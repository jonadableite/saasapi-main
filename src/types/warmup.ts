// src/types/warmup.ts
export interface MediaContent {
  type: 'image' | 'video' | 'audio' | 'sticker';
  url?: string;
  base64?: string;
  mimetype?: string;
  caption?: string;
  fileName?: string;
  preview?: string;
}

export interface WarmupConfig {
  userId: string;
  phoneInstances: Array<{
    instanceId: string;
    phoneNumber: string;
  }>;
  contents: {
    texts: string[];
    images: (string | MediaContent)[];
    audios: (string | MediaContent)[];
    videos: (string | MediaContent)[];
    stickers: (string | MediaContent)[];
    emojis: string[];
    // Novos tipos de conteúdo
    documents?: (string | MediaContent)[];
    locations?: Array<{
      latitude: number;
      longitude: number;
      name: string;
      address: string;
    }>;
    contacts?: Array<{
      name: string;
      number: string;
      email?: string;
    }>;
    polls?: Array<{
      question: string;
      options: string[];
    }>;
  };
  config: {
    textChance: number;
    audioChance: number;
    reactionChance: number;
    stickerChance: number;
    imageChance: number;
    videoChance: number;
    minDelay: number;
    maxDelay: number;
    // Novas configurações para grupos e números externos
    groupChance: number; // Chance de enviar mensagem para grupo vs privado
    externalNumbersChance: number; // Chance de usar números externos vs instâncias
    groupId?: string; // ID do grupo para conversas em grupo
    externalNumbers?: string[]; // Lista de números externos
    // Novas configurações avançadas
    documentChance: number;
    locationChance: number;
    contactChance: number;
    pollChance: number;
    // Configurações de comportamento humano
    typingSimulation: boolean;
    onlineStatusSimulation: boolean;
    readReceiptSimulation: boolean;
    // Configurações de horário
    activeHours: {
      start: number; // 0-23
      end: number; // 0-23
    };
    weekendBehavior: 'normal' | 'reduced' | 'off';
    // Configurações de resposta
    autoReplyChance: number;
    replyDelay: {
      min: number;
      max: number;
    };
    // Configurações de status
    statusUpdateChance: number;
    statusTexts?: string[];
    // Configurações de perfil
    profileUpdateChance: number;
    profileNames?: string[];
    profileBios?: string[];
    // Configurações de grupo
    groupJoinChance: number;
    groupLeaveChance: number;
    groupInviteChance: number;
    // Configurações de mídia
    mediaDownloadChance: number;
    mediaForwardChance: number;
    // Configurações de segurança
    antiDetectionMode: boolean;
    randomDeviceInfo: boolean;
    // Configurações de qualidade
    messageQuality: 'low' | 'medium' | 'high';
    engagementOptimization: boolean;
  };
}

// Novos tipos para funcionalidades avançadas
export interface HumanBehaviorConfig {
  typingSpeed: 'slow' | 'normal' | 'fast';
  responseTime: 'immediate' | 'normal' | 'delayed';
  messageLength: 'short' | 'medium' | 'long';
  emojiUsage: 'low' | 'medium' | 'high';
  mediaPreference: 'text' | 'media' | 'mixed';
}

export interface TimeBasedConfig {
  timezone: string;
  workingHours: {
    start: number;
    end: number;
  };
  breakTimes: Array<{
    start: number;
    end: number;
  }>;
  weekendSchedule: {
    saturday: boolean;
    sunday: boolean;
  };
}

export interface EngagementConfig {
  messageFrequency: 'low' | 'medium' | 'high';
  conversationDepth: 'shallow' | 'medium' | 'deep';
  responseRate: number; // 0-1
  followUpChance: number; // 0-1
  groupParticipation: 'passive' | 'active' | 'very_active';
}
