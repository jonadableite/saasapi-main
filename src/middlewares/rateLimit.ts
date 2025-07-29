// src/middlewares/rateLimit.ts
import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const rateLimitMiddleware = (options: RateLimitOptions) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: options.message,
      retryAfter: Math.ceil(options.windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    keyGenerator: (req: Request) => {
      // Use user ID if available, otherwise fall back to IP
      const userReq = req as any;
      return userReq.user?.id || req.ip;
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000),
        type: 'RATE_LIMIT_EXCEEDED',
      });
    },
  });
};

// Middlewares pré-configurados
export const groupRateLimit = rateLimitMiddleware({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30,
  message:
    'Muitas operações de grupo. Tente novamente em alguns minutos.',
});

export const createGroupRateLimit = rateLimitMiddleware({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5,
  message:
    'Limite de criação de grupos atingido. Tente novamente em alguns minutos.',
});

export const inviteRateLimit = rateLimitMiddleware({
  windowMs: 2 * 60 * 1000, // 2 minutos
  max: 10,
  message:
    'Muitos convites enviados. Tente novamente em alguns minutos.',
});
