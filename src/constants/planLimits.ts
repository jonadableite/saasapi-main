// src/constants/planLimits.ts
import type { MessageType } from '../types/messageTypes';

export const PLAN_LIMITS = {
  free: {
    numbers: 2,
    messagesPerDay: 20,
    features: ['text'] as MessageType[],
    support: 'basic',
    trialDays: 2,
  },
  basic: {
    numbers: 2,
    messagesPerDay: 50,
    features: ['text', 'reaction'] as MessageType[],
    support: 'basic',
  },
  pro: {
    numbers: 5,
    messagesPerDay: 500,
    features: [
      'text',
      'audio',
      'reaction',
      'sticker',
    ] as MessageType[],
    support: 'priority',
  },
  enterprise: {
    numbers: 99,
    messagesPerDay: 99999,
    features: [
      'text',
      'audio',
      'media',
      'reaction',
      'sticker',
    ] as MessageType[],
    support: '24/7',
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;
