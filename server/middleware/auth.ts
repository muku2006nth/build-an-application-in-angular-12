import { NextFunction, Request, Response } from 'express';

import { AuthenticatedRequest, PublicUser, TokenPayload } from '../types';
import { XmlStore } from '../storage/xml-store';

export function signToken(user: PublicUser): string {
  const payload: TokenPayload = {
    userId: user.userId,
    role: user.role,
    issuedAt: new Date().toISOString()
  };

  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function createAuthMiddleware(store: XmlStore) {
  return async function authenticateRequest(
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> {
    const authorizationHeader = request.header('authorization') ?? '';
    const token = authorizationHeader.replace(/^Bearer\s+/i, '');

    if (!token) {
      response.status(401).json({ message: 'Missing bearer token.' });
      return;
    }

    try {
      const payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as TokenPayload;
      const user = await store.findActiveUser(payload.userId, payload.role);

      if (!user) {
        response.status(401).json({ message: 'Session expired or user is inactive.' });
        return;
      }

      (request as AuthenticatedRequest).user = user;
      next();
    } catch {
      response.status(401).json({ message: 'Invalid session token.' });
    }
  };
}

export function requireAdmin(
  request: Request,
  response: Response,
  next: NextFunction
): void {
  const user = (request as AuthenticatedRequest).user;

  if (user?.role !== 'Admin') {
    response.status(403).json({ message: 'Admin role is required.' });
    return;
  }

  next();
}
