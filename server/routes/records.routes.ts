import { Request, RequestHandler, Response, Router } from 'express';

import { delayFromQuery } from '../middleware/delay';
import { AuthenticatedRequest } from '../types';
import { XmlStore } from '../storage/xml-store';

export function createRecordRoutes(store: XmlStore, authMiddleware: RequestHandler): Router {
  const router = Router();

  router.get('/records', authMiddleware, delayFromQuery, async (request: Request, response: Response, next) => {
    try {
      const user = (request as AuthenticatedRequest).user;

      if (!user) {
        response.status(401).json({ message: 'Missing authenticated user.' });
        return;
      }

      const result = await store.getRecordsFor(user);
      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
