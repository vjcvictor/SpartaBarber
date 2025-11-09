import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';

/**
 * Modern CSRF protection using defense-in-depth approach
 * 
 * LAYER 1: SameSite=Lax Cookies (Primary Defense)
 * ---------------------------------------------
 * Auth cookies in server/routes.ts are set with sameSite='lax' which prevents
 * the browser from sending cookies on cross-site POST requests initiated from
 * external sites (e.g., attacker.com submitting a form to our site).
 * 
 * This means even if an attacker creates a malicious form that POSTs to our API,
 * the authToken cookie won't be included, so the request will fail authentication.
 * 
 * LAYER 2: Origin/Referer Validation (Additional Defense)
 * -------------------------------------------------------
 * This middleware adds an extra layer by verifying the Origin or Referer header
 * matches our host. This protects against:
 * - Older browsers that don't support SameSite
 * - Edge cases where SameSite might be bypassed
 * - Requests from browser extensions or non-browser clients
 * 
 * IMPORTANT: In development mode, this middleware is lenient to allow testing.
 * In production, it strictly enforces that all mutating requests include
 * Origin or Referer headers matching the host.
 * 
 * Together, these two layers provide robust CSRF protection without the
 * complexity of double-submit tokens or the need for deprecated libraries.
 * 
 * References:
 * - OWASP CSRF Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 * - SameSite Cookies: https://web.dev/samesite-cookies-explained/
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Only protect state-changing methods
  const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  // Get headers for verification
  const origin = req.get('origin');
  const referer = req.get('referer');
  const host = req.get('host');

  // In development, be lenient but log warnings
  if (process.env.NODE_ENV === 'development') {
    if (!origin && !referer) {
      logger.warn(`CSRF Warning: ${req.method} ${req.path} has no Origin or Referer header`);
    }
    return next();
  }

  // PRODUCTION: Strict validation
  // Require at least one of Origin or Referer
  if (!origin && !referer) {
    logger.error(`CSRF Blocked: ${req.method} ${req.path} - Missing both Origin and Referer headers`);
    return res.status(403).json({ 
      error: 'CSRF validation failed',
      details: 'Request must include Origin or Referer header' 
    });
  }

  // Verify Origin if present
  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        logger.error(`CSRF Blocked: ${req.method} ${req.path} - Origin mismatch: ${originHost} !== ${host}`);
        return res.status(403).json({ 
          error: 'CSRF validation failed',
          details: 'Origin does not match host' 
        });
      }
    } catch (error) {
      logger.error(`CSRF Blocked: ${req.method} ${req.path} - Invalid Origin header: ${origin}`);
      return res.status(403).json({ 
        error: 'CSRF validation failed',
        details: 'Invalid Origin header' 
      });
    }
  }

  // Verify Referer if Origin not present
  if (!origin && referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost !== host) {
        logger.error(`CSRF Blocked: ${req.method} ${req.path} - Referer mismatch: ${refererHost} !== ${host}`);
        return res.status(403).json({ 
          error: 'CSRF validation failed',
          details: 'Referer does not match host' 
        });
      }
    } catch (error) {
      logger.error(`CSRF Blocked: ${req.method} ${req.path} - Invalid Referer header: ${referer}`);
      return res.status(403).json({ 
        error: 'CSRF validation failed',
        details: 'Invalid Referer header' 
        });
    }
  }

  next();
}
