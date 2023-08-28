import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import fp from 'fastify-plugin';
import onFinished from 'on-finished';

import { RateLimit, RateLimitOptions } from '../index';

export interface RateLimitRequest {
  req: FastifyRequest;
  reply: FastifyReply;
  done: HookHandlerDoneFunction;
}

export interface FastifyRateLimitOptions extends Partial<Omit<RateLimitOptions<RateLimitRequest>, 'handleNextRequest' | 'handleDiscardedRequest' | 'isRequestExpired'>> {
  errorResponseBuilder?: (payload: RateLimitRequest) => any;
  isImportantRequest?: (payload: RateLimitRequest) => boolean;
}

const defaultErrorResponseBuilder = (payload: RateLimitRequest) => {
  const error = new Error(`RATE_LIMIT_EXCEEDED, Too Many Requests`);
  (error as any).statusCode = 429;
  return error;
}

export const rateLimitFastify = fp(async (fastify, options: FastifyRateLimitOptions) => {
  const errorResponseBuilder = options.errorResponseBuilder || defaultErrorResponseBuilder;
  const hasImportantQueue = !!options.isImportantRequest;;

  const rateLimit = new RateLimit<RateLimitRequest>({
    ...options,
    hasImportantQueue,
    handleNextRequest: (payload) => {
      onFinished(payload.reply.raw, () => {
        rateLimit.finish()
      });

      payload.done();
    },
    handleDiscardedRequest: (payload) => {
      payload.done(errorResponseBuilder(payload));
    },
    isRequestExpired: (payload) => {
      return payload.req.raw.socket.destroyed;
    }
  });

  fastify.addHook('onRequest', (req, reply, done) => {
    const payload = { req, reply, done };
    rateLimit.add(payload, hasImportantQueue && options.isImportantRequest!(payload));
  });

  fastify.addHook('onClose', (instance, done) => {
    rateLimit.destroy();
    done();
  });
});
