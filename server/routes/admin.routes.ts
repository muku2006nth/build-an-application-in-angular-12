import { Request, RequestHandler, Response, Router } from 'express';

import { delayFromQuery } from '../middleware/delay';
import { requireAdmin } from '../middleware/auth';
import { AuthenticatedRequest, UserMutationPayload } from '../types';
import { XmlStore } from '../storage/xml-store';

export function createAdminRoutes(store: XmlStore, authMiddleware: RequestHandler): Router {
  const router = Router();

  router.use('/admin', authMiddleware, requireAdmin);

  router.get('/admin/users', delayFromQuery, async (_request: Request, response: Response, next) => {
    try {
      response.json({
        users: await store.listUsers()
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/admin/users', async (request: Request, response: Response, next) => {
    try {
      const payload = request.body as Partial<UserMutationPayload>;
      const validationError = validateUserPayload(payload, true);

      if (validationError) {
        response.status(400).json({ message: validationError });
        return;
      }

      const user = await store.createUser(payload as UserMutationPayload);
      response.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  });

  router.put('/admin/users/:id', async (request: Request, response: Response, next) => {
    try {
      const id = getRouteId(request);
      const payload = request.body as Partial<UserMutationPayload>;
      const validationError = validateUserPayload(payload, false);

      if (validationError) {
        response.status(400).json({ message: validationError });
        return;
      }

      const user = await store.updateUser(id, payload as UserMutationPayload);

      if (!user) {
        response.status(404).json({ message: 'User not found.' });
        return;
      }

      response.json({ user });
    } catch (error) {
      next(error);
    }
  });

  router.delete('/admin/users/:id', async (request: Request, response: Response, next) => {
    try {
      const id = getRouteId(request);
      const currentUser = (request as AuthenticatedRequest).user;

      if (currentUser?.id === id) {
        response.status(400).json({ message: 'The signed-in admin cannot delete their own account.' });
        return;
      }

      const deleted = await store.deleteUser(id);

      if (!deleted) {
        response.status(404).json({ message: 'User not found.' });
        return;
      }

      response.json({ deleted: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function getRouteId(request: Request): string {
  const id = request.params['id'];
  return Array.isArray(id) ? id[0] : id;
}

function validateUserPayload(payload: Partial<UserMutationPayload>, passwordRequired: boolean): string | null {
  if (!payload.userId?.trim()) {
    return 'User ID is required.';
  }

  if (!payload.displayName?.trim()) {
    return 'Display name is required.';
  }

  if (passwordRequired && (!payload.password || payload.password.trim().length < 6)) {
    return 'Password must be at least 6 characters.';
  }

  if (payload.role !== 'General User' && payload.role !== 'Admin') {
    return 'Role must be General User or Admin.';
  }

  if (!payload.department?.trim()) {
    return 'Department is required.';
  }

  if (!payload.accessLevel?.trim()) {
    return 'Access level is required.';
  }

  if (typeof payload.active !== 'boolean') {
    return 'Active status is required.';
  }

  return null;
}
