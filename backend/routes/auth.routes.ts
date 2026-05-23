import { Request, RequestHandler, Response, Router } from 'express';

import { delayFromQuery } from '../middleware/delay';
import { signToken } from '../middleware/auth';
import { AuthenticatedRequest, LoginPayload } from '../types';
import { XmlStore } from '../storage/xml-store';
import { AuditLog } from '../storage/audit-log';

export function createAuthRoutes(
  store: XmlStore,
  authMiddleware: RequestHandler,
  auditLog: AuditLog
): Router {
  const router = Router();

  router.post('/login', async (request: Request, response: Response, next) => {
    try {
      const payload = request.body as Partial<LoginPayload>;

      if (!payload.userId || !payload.password || !payload.role) {
        response.status(400).json({ message: 'User ID, password, and role are required.' });
        return;
      }

      const user = await store.authenticate({
        userId: payload.userId,
        password: payload.password,
        role: payload.role
      });

      if (!user) {
        response.status(401).json({ message: 'Invalid credentials, role, or inactive account.' });
        return;
      }

      await auditLog.append({
        action: 'LOGIN',
        performedBy: user.userId,
        targetUserId: user.userId,
        details: `Successful login as ${user.role}`
      });

      response.json({
        token: signToken(user),
        user
      });
    } catch (error) {
      next(error);
    }
  });

  router.get('/me', authMiddleware, delayFromQuery, (request: Request, response: Response) => {
    response.json({
      user: (request as AuthenticatedRequest).user
    });
  });

  return router;
}
