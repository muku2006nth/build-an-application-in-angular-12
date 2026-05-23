import { NextFunction, Request, Response } from 'express';

export async function delayFromQuery(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  const delayMs = clampDelay(toNumber(request.query['delay']));
  response.setHeader('X-Dummy-Delay-Ms', String(delayMs));

  if (delayMs > 0) {
    await new Promise((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }

  next();
}

function clampDelay(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(Math.round(value), 0), 5000);
}

function toNumber(value: unknown): number {
  if (Array.isArray(value)) {
    return toNumber(value[0]);
  }

  return Number(value ?? 0);
}
