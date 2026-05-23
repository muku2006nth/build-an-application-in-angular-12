import { Request, RequestHandler, Response, Router } from 'express';

import { delayFromQuery } from '../middleware/delay';
import { requireAdmin } from '../middleware/auth';
import { AuthenticatedRequest, UserMutationPayload } from '../types';
import { XmlStore } from '../storage/xml-store';
import { AuditLog } from '../storage/audit-log';
import { TaskStore } from '../storage/task-store';

export function createAdminRoutes(
  store: XmlStore,
  authMiddleware: RequestHandler,
  auditLog: AuditLog,
  taskStore: TaskStore
): Router {
  const router = Router();

  router.use('/admin', authMiddleware, requireAdmin);

  // ── List users (with optional ?page & ?limit pagination) ──────────────────
  router.get('/admin/users', delayFromQuery, async (request: Request, response: Response, next) => {
    try {
      const allUsers = await store.listUsers();
      const page  = Math.max(1, toInt(request.query['page'],  1));
      const limit = Math.min(100, Math.max(1, toInt(request.query['limit'], 50)));
      const total = allUsers.length;
      const start = (page - 1) * limit;
      const users = allUsers.slice(start, start + limit);

      response.json({ users, total, page, limit, pages: Math.ceil(total / limit) });
    } catch (error) {
      next(error);
    }
  });

  // ── Create user ───────────────────────────────────────────────────────────
  router.post('/admin/users', async (request: Request, response: Response, next) => {
    try {
      const payload = request.body as Partial<UserMutationPayload>;
      const validationError = validateUserPayload(payload, true);

      if (validationError) {
        response.status(400).json({ message: validationError });
        return;
      }

      const performer = (request as AuthenticatedRequest).user;
      const user = await store.createUser(payload as UserMutationPayload);

      await auditLog.append({
        action: 'CREATE',
        performedBy: performer?.userId ?? 'unknown',
        targetUserId: user.userId,
        details: `Created user "${user.displayName}" with role ${user.role}`
      });

      response.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  });

  // ── Update user ───────────────────────────────────────────────────────────
  router.put('/admin/users/:id', async (request: Request, response: Response, next) => {
    try {
      const id = getRouteId(request);
      const payload = request.body as Partial<UserMutationPayload>;
      const validationError = validateUserPayload(payload, false);

      if (validationError) {
        response.status(400).json({ message: validationError });
        return;
      }

      const performer = (request as AuthenticatedRequest).user;
      const user = await store.updateUser(id, payload as UserMutationPayload);

      if (!user) {
        response.status(404).json({ message: 'User not found.' });
        return;
      }

      await auditLog.append({
        action: 'UPDATE',
        performedBy: performer?.userId ?? 'unknown',
        targetUserId: user.userId,
        details: `Updated user "${user.displayName}" — role: ${user.role}, active: ${String(user.active)}`
      });

      response.json({ user });
    } catch (error) {
      next(error);
    }
  });

  // ── Delete user ───────────────────────────────────────────────────────────
  router.delete('/admin/users/:id', async (request: Request, response: Response, next) => {
    try {
      const id = getRouteId(request);
      const performer = (request as AuthenticatedRequest).user;

      if (performer?.id === id) {
        response.status(400).json({ message: 'The signed-in admin cannot delete their own account.' });
        return;
      }

      const deleted = await store.deleteUser(id);

      if (!deleted) {
        response.status(404).json({ message: 'User not found.' });
        return;
      }

      await auditLog.append({
        action: 'DELETE',
        performedBy: performer?.userId ?? 'unknown',
        targetUserId: id,
        details: `Deleted user record ${id}`
      });

      response.json({ deleted: true });
    } catch (error) {
      next(error);
    }
  });

  // ── Audit log ─────────────────────────────────────────────────────────────
  router.get('/admin/audit', async (_request: Request, response: Response, next) => {
    try {
      const entries = await auditLog.readAll();
      response.json({ entries: entries.slice().reverse(), total: entries.length });
    } catch (error) {
      next(error);
    }
  });

  // ── Employee profile (tasks + performance) ────────────────────────────────
  router.get('/admin/users/:id/profile', delayFromQuery, async (request: Request, response: Response, next) => {
    try {
      const id = getRouteId(request);
      const allUsers = await store.listUsers();
      const user = allUsers.find((u) => u.id === id);

      if (!user) {
        response.status(404).json({ message: 'User not found.' });
        return;
      }

      const profile = await taskStore.getEmployeeProfile(user, auditLog);
      response.json(profile);
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

function toInt(value: unknown, fallback: number): number {
  const n = parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
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
