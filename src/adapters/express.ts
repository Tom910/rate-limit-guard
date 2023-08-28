import type { Request, Response, NextFunction } from 'express';
import onFinished from 'on-finished';
import { RateLimit, RateLimitOptions } from '../index';

export interface RequestLimiterRequest {
  req: Request;
  res: Response;
  next: NextFunction;
}

export interface ExpressRateLimitOptions extends Partial<Omit<RateLimitOptions<RequestLimiterRequest>, 'handleNextRequest' | 'handleDiscardedRequest' | 'isRequestExpired'>> {
  errorResponseBuilder?: (payload: RequestLimiterRequest) => any;
  isImportantRequest?: (payload: RequestLimiterRequest) => boolean;
}

const defaultErrorResponseBuilder = (payload: RequestLimiterRequest) => {
  payload.res.status(429);
  if (!payload.res.writableEnded) {
    payload.res.send('Too Many Requests');
  }
}

export const rateLimitExpress = (options: ExpressRateLimitOptions = {}) => {
  const errorResponseBuilder = options.errorResponseBuilder || defaultErrorResponseBuilder;
  const hasImportantQueue = !!options.isImportantRequest;;

  const rateLimit = new RateLimit<RequestLimiterRequest>({
    ...options,
    hasImportantQueue,
    handleNextRequest: (payload) => {
      onFinished(payload.res, () => {
        rateLimit.finish()
      });

      payload.next();
    },
    handleDiscardedRequest: (payload) => {
      errorResponseBuilder(payload)
    },
    isRequestExpired: (payload) => {
      return payload.req.socket.destroyed;
    }
  });
  return (req: Request, res: Response, next: NextFunction) => {
    const payload = { req, res, next };
    rateLimit.add(payload, hasImportantQueue && options.isImportantRequest!(payload));
  }
}
