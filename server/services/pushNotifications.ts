import webpush from 'web-push';
import { prisma } from '../lib/prisma';
import logger from '../lib/logger';

// Send push notification to a specific user (all their devices)
export async function sendPushToUser(
    userId: string,
    payload: {
        title: string;
        body: string;
        icon?: string;
        badge?: string;
        data?: any;
        tag?: string;
        requireInteraction?: boolean;
        actions?: Array<{ action: string; title: string; icon?: string }>;
    }
): Promise<boolean> {
    try {
        const config = await prisma.config.findFirst();

        if (!config || !config.vapidPublicKey || !config.vapidPrivateKeyEnc) {
            logger.warn('VAPID keys not configured, skipping push notification');
            return false;
        }

        // Get all push subscriptions for this user
        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId },
        });

        if (subscriptions.length === 0) {
            logger.info(`No push subscriptions found for user ${userId}`);
            return false;
        }

        webpush.setVapidDetails(
            'mailto:victorj.cuero@gmail.com',
            config.vapidPublicKey,
            config.vapidPrivateKeyEnc // In production, decrypt this
        );

        const pushPayload = JSON.stringify(payload);
        let successCount = 0;
        let failCount = 0;

        // Send to all user's devices
        for (const sub of subscriptions) {
            try {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                };

                await webpush.sendNotification(pushSubscription, pushPayload);
                successCount++;

                await prisma.notificationLog.create({
                    data: {
                        channel: 'push',
                        event: payload.tag || 'general',
                        targetRole: 'CLIENT',
                        to: sub.endpoint,
                        payload: pushPayload,
                        status: 'sent',
                    },
                });
            } catch (error: any) {
                failCount++;
                logger.error(`Push notification failed for subscription ${sub.id}:`, error.message);

                // If subscription is invalid (410 Gone), remove it
                if (error.statusCode === 410) {
                    await prisma.pushSubscription.delete({
                        where: { id: sub.id },
                    });
                    logger.info(`Removed invalid push subscription ${sub.id}`);
                }

                await prisma.notificationLog.create({
                    data: {
                        channel: 'push',
                        event: payload.tag || 'general',
                        targetRole: 'CLIENT',
                        to: sub.endpoint,
                        payload: pushPayload,
                        status: 'failed',
                        error: error.message,
                    },
                });
            }
        }

        logger.info(`Push notifications sent to user ${userId}: ${successCount} success, ${failCount} failed`);
        return successCount > 0;
    } catch (error: any) {
        logger.error('Error sending push notifications:', error);
        return false;
    }
}
