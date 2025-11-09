import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import logger from '../lib/logger';

// JWT_SECRET is REQUIRED - fail fast if not configured
const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: SESSION_SECRET environment variable is required for JWT security');
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'BARBER' | 'CLIENT';
    barberId?: string;
    accessibleRoles: ('ADMIN' | 'BARBER' | 'CLIENT')[];
  };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies.authToken;

    if (!token) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as {
      userId: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Check if user has an associated Barber record
    const barber = await prisma.barber.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    // Calculate accessible roles
    const accessibleRoles: ('ADMIN' | 'BARBER' | 'CLIENT')[] = [user.role as 'ADMIN' | 'BARBER' | 'CLIENT'];
    
    // If user is ADMIN and has a barber record, they can also access BARBER routes
    if (user.role === 'ADMIN' && barber) {
      accessibleRoles.push('BARBER');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'BARBER' | 'CLIENT',
      barberId: barber?.id,
      accessibleRoles,
    };
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Check if user has access to any of the required roles through accessibleRoles
    const hasAccess = roles.some(role => req.user!.accessibleRoles.includes(role as any));

    if (!hasAccess) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    next();
  };
}

// Middleware specifically for barber endpoints - validates barberId exists
export function requireBarberAccess() {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // User must have BARBER in accessibleRoles
    if (!req.user.accessibleRoles.includes('BARBER')) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // For ADMIN users acting as barbers, validate barberId exists
    if (req.user.role === 'ADMIN' && !req.user.barberId) {
      return res.status(403).json({ error: 'Acceso denegado: no tiene registro de barbero asociado' });
    }

    next();
  };
}
