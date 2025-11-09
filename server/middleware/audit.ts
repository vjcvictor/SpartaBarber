import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from './auth';
import logger from '../lib/logger';

export async function auditLog(
  action: string,
  entity: string,
  entityId?: string,
  diff?: any
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user?.id || null,
          actorRole: req.user?.role || 'SYSTEM',
          action,
          entity,
          entityId,
          diff: diff ? JSON.stringify(diff) : null,
          ip: req.ip || req.socket.remoteAddress || null,
          userAgent: req.headers['user-agent'] || null,
        },
      });
    } catch (error) {
      logger.error('Audit log error:', error);
    }
    next();
  };
}

export function createAuditLog(
  userId: string | null,
  actorRole: string,
  action: string,
  entity: string,
  entityId?: string,
  diff?: any,
  req?: Request
) {
  return prisma.auditLog.create({
    data: {
      userId,
      actorRole,
      action,
      entity,
      entityId,
      diff: diff ? JSON.stringify(diff) : null,
      ip: req?.ip || req?.socket.remoteAddress || null,
      userAgent: req?.headers['user-agent'] || null,
    },
  });
}
