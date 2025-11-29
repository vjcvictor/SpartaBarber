import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface PushSubscriptionState {
    isSupported: boolean;
    isSubscribed: boolean;
    isLoading: boolean;
    error: string | null;
}

export function usePushNotifications() {
    const [state, setState] = useState<PushSubscriptionState>({
        isSupported: false,
        isSubscribed: false,
        isLoading: true,
        error: null,
    });

    // Check if push notifications are supported
    useEffect(() => {
        const checkSupport = async () => {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                setState(prev => ({
                    ...prev,
                    isSupported: false,
                    isLoading: false,
                    error: 'Push notifications are not supported in this browser',
                }));
                return;
            }

            setState(prev => ({ ...prev, isSupported: true }));

            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();

                setState(prev => ({
                    ...prev,
                    isSubscribed: !!subscription,
                    isLoading: false,
                }));
            } catch (error) {
                console.error('Error checking subscription:', error);
                setState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: 'Error checking subscription status',
                }));
            }
        };

        checkSupport();
    }, []);

    const subscribe = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Request notification permission
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                throw new Error('Notification permission denied');
            }

            // Get VAPID public key
            const response = await apiRequest('GET', '/api/config/vapid-public-key');
            const data = await response.json();
            const publicKey = data.publicKey;

            // Register service worker
            const registration = await navigator.serviceWorker.ready;

            // Subscribe to push notifications
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });

            // Send subscription to server
            await apiRequest('POST', '/api/push/subscribe', {
                subscription: subscription.toJSON(),
                userAgent: navigator.userAgent,
            });

            setState(prev => ({
                ...prev,
                isSubscribed: true,
                isLoading: false,
            }));

            return true;
        } catch (error: any) {
            console.error('Error subscribing to push:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Error subscribing to push notifications',
            }));
            return false;
        }
    }, []);

    const unsubscribe = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Unsubscribe from push
                await subscription.unsubscribe();

                // Remove subscription from server
                await apiRequest('DELETE', '/api/push/unsubscribe', {
                    endpoint: subscription.endpoint,
                });
            }

            setState(prev => ({
                ...prev,
                isSubscribed: false,
                isLoading: false,
            }));

            return true;
        } catch (error: any) {
            console.error('Error unsubscribing from push:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Error unsubscribing from push notifications',
            }));
            return false;
        }
    }, []);

    return {
        ...state,
        subscribe,
        unsubscribe,
    };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
