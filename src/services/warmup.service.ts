import { EventEmitter } from 'node:events';
// src/services/warmup.service.ts
import axios from 'axios';
import { PLAN_LIMITS } from '../constants/planLimits';
import { prisma } from '../lib/prisma';
import type { MessageType } from '../types/messageTypes';
import type { MediaContent, WarmupConfig } from '../types/warmup';

const URL_API = 'https://evo.whatlead.com.br';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';

interface ApiError {
  response?: {
    data?: any;
  };
  message?: string;
}

interface SendMessageConfig {
  endpoint: string;
  payload: any;
  delay: number;
}

interface MediaStats {
  id: string;
  instanceName: string;
  text: number;
  image: number;
  video: number;
  audio: number;
  sticker: number;
  reaction: number;
  document: number;
  location: number;
  contact: number;
  poll: number;
  status: number;
  profile: number;
  group_action: number;
  totalDaily: number;
  totalAllTime: number;
  totalSent: number;
  totalReceived: number;
  date: Date;
}

interface WarmupStats {
  instanceName: string;
  status: string;
  startTime: Date;
  pauseTime?: Date;
  warmupTime?: number;
  progress?: number;
  lastActive?: Date;
  userId: string;
  mediaStatsId: string;
  mediaReceivedId: string;
  // Novos campos para estatísticas avançadas
  engagementScore?: number;
  responseRate?: number;
  averageResponseTime?: number;
  conversationDepth?: number;
  groupParticipation?: number;
}

interface MediaPayload {
  number: string;
  mediatype?: string;
  media?: string;
  audio?: string;
  sticker?: string;
  text?: string;
  caption?: string;
  fileName?: string;
  mimetype?: string;
  delay?: number;
  encoding?: boolean;
  options?: {
    delay: number;
    linkPreview: boolean;
  };
  // Novos campos para tipos avançados
  document?: string;
  location?: {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
  };
  contact?: {
    name: string;
    number: string;
    email?: string;
  };
  poll?: {
    question: string;
    options: string[];
  };
}

interface ReactionPayload {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  reaction: string;
}

interface PhoneInstance {
  instanceId: string;
  phoneNumber: string;
}

interface ApiResponse {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
    participant?: string;
  };
  pushName: string;
  status: string;
  message: {
    conversation?: string;
    imageMessage?: any;
    videoMessage?: any;
    audioMessage?: any;
    stickerMessage?: any;
    reactionMessage?: any;
    messageContextInfo?: any;
    documentMessage?: any;
    locationMessage?: any;
    contactMessage?: any;
    pollMessage?: any;
  };
  contextInfo?: any;
  messageType: string;
  messageTimestamp: number;
  instanceId: string;
  source: string;
}

// Novas interfaces para funcionalidades avançadas
interface HumanBehaviorSimulator {
  simulateTyping(instanceId: string, target: string): Promise<void>;
  simulateOnlineStatus(
    instanceId: string,
    status: 'online' | 'offline',
  ): Promise<void>;
  simulateReadReceipt(
    instanceId: string,
    messageId: string,
  ): Promise<void>;
  simulateResponseDelay(
    messageLength: number,
    urgency: 'low' | 'medium' | 'high',
  ): Promise<void>;
}

interface TimeBasedScheduler {
  isActiveTime(): boolean;
  isWeekend(): boolean;
  getOptimalDelay(): number;
  shouldSendMessage(): boolean;
}

interface EngagementOptimizer {
  calculateEngagementScore(instanceId: string): Promise<number>;
  optimizeMessageTiming(instanceId: string): Promise<number>;
  suggestResponseStrategy(
    conversationHistory: any[],
  ): Promise<string>;
  trackConversationDepth(
    instanceId: string,
    messageCount: number,
  ): void;
}

export class WarmupService {
  private activeInstances: Map<string, NodeJS.Timeout>;
  private stop: boolean;
  private eventEmitter: EventEmitter;
  private humanBehaviorSimulator: HumanBehaviorSimulator;
  private timeBasedScheduler: TimeBasedScheduler;
  private engagementOptimizer: EngagementOptimizer;
  private conversationHistory: Map<string, any[]>;
  private engagementScores: Map<string, number>;

  constructor() {
    this.activeInstances = new Map();
    this.stop = false;
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(20);
    this.conversationHistory = new Map();
    this.engagementScores = new Map();

    // Inicializar simuladores
    this.humanBehaviorSimulator = this.createHumanBehaviorSimulator();
    this.timeBasedScheduler = this.createTimeBasedScheduler();
    this.engagementOptimizer = this.createEngagementOptimizer();
  }

  private createHumanBehaviorSimulator(): HumanBehaviorSimulator {
    return {
      async simulateTyping(
        instanceId: string,
        target: string,
      ): Promise<void> {
        const typingDuration =
          Math.floor(Math.random() * 3000) + 1000;
        console.log(
          `Simulando digitação para ${target} por ${typingDuration}ms`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, typingDuration),
        );
      },

      async simulateOnlineStatus(
        instanceId: string,
        status: 'online' | 'offline',
      ): Promise<void> {
        try {
          // Simular status online/offline usando um endpoint que existe
          await axios.post(
            `${URL_API}/instance/connectionState/${instanceId}`,
            {
              state: status,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                apikey: API_KEY,
              },
            },
          );
          console.log(`Status ${status} simulado para ${instanceId}`);
        } catch (error) {
          // Se o endpoint não existir, apenas logar e continuar
          console.log(
            `Status ${status} simulado para ${instanceId} (simulado)`,
          );
        }
      },

      async simulateReadReceipt(
        instanceId: string,
        messageId: string,
      ): Promise<void> {
        try {
          await axios.post(
            `${URL_API}/message/markAsRead/${instanceId}`,
            {
              messageId: messageId,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                apikey: API_KEY,
              },
            },
          );
          console.log(
            `Read receipt simulado para mensagem ${messageId}`,
          );
        } catch (error) {
          console.error('Erro ao simular read receipt:', error);
        }
      },

      async simulateResponseDelay(
        messageLength: number,
        urgency: 'low' | 'medium' | 'high',
      ): Promise<void> {
        const baseDelay = messageLength * 50; // 50ms por caractere
        const urgencyMultiplier = {
          low: 2,
          medium: 1,
          high: 0.5,
        };
        const finalDelay = baseDelay * urgencyMultiplier[urgency];
        await new Promise((resolve) =>
          setTimeout(resolve, finalDelay),
        );
      },
    };
  }

  private createTimeBasedScheduler(): TimeBasedScheduler {
    return {
      isActiveTime(): boolean {
        // Removido bloqueio de horário - sempre considera horário ativo
        return true;
      },

      isWeekend(): boolean {
        const now = new Date();
        const day = now.getDay();
        return day === 0 || day === 6; // Domingo = 0, Sábado = 6
      },

      getOptimalDelay(): number {
        // Delay consistente independente do horário
        return 5000; // 5 segundos de delay padrão
      },

      shouldSendMessage(): boolean {
        // Removido bloqueio de horário - sempre permite envio de mensagens
        return true;
      },
    };
  }

  private createEngagementOptimizer(): EngagementOptimizer {
    return {
      async calculateEngagementScore(
        instanceId: string,
      ): Promise<number> {
        const stats = await prisma.warmupStats.findUnique({
          where: { instanceName: instanceId },
          include: { mediaStats: true },
        });

        if (!stats || !stats.mediaStats) return 0;

        const totalMessages =
          stats.mediaStats.totalSent + stats.mediaStats.totalReceived;
        const responseRate =
          stats.mediaStats.totalReceived / Math.max(totalMessages, 1);
        const activityLevel = stats.warmupTime || 0;

        return Math.min(100, responseRate * 50 + activityLevel * 0.1);
      },

      async optimizeMessageTiming(
        instanceId: string,
      ): Promise<number> {
        const engagementScore = await this.calculateEngagementScore(
          instanceId,
        );

        // Timing baseado no score de engajamento
        if (engagementScore > 80) return 2000; // Alto engajamento = resposta rápida
        if (engagementScore > 50) return 5000; // Médio engajamento = resposta normal
        return 10000; // Baixo engajamento = resposta lenta
      },

      async suggestResponseStrategy(
        conversationHistory: any[],
      ): Promise<string> {
        const recentMessages = conversationHistory.slice(-5);
        const hasQuestions = recentMessages.some((msg) =>
          msg.text?.includes('?'),
        );
        const hasEmojis = recentMessages.some((msg) =>
          /\p{Emoji}/u.test(msg.text || ''),
        );

        if (hasQuestions) return 'question_response';
        if (hasEmojis) return 'emoji_response';
        return 'normal_response';
      },

      trackConversationDepth(
        instanceId: string,
        messageCount: number,
      ): void {
        const currentDepth =
          this.conversationHistory.get(instanceId)?.length || 0;
        this.conversationHistory.set(instanceId, [
          ...(this.conversationHistory.get(instanceId) || []),
          { timestamp: new Date(), count: messageCount },
        ]);
      },
    };
  }

  async startWarmup(config: WarmupConfig): Promise<void> {
    this.stop = false;

    const warmupPromises = config.phoneInstances.map(
      async (instance) => {
        await this.startInstanceTimer(
          instance.instanceId,
          config.userId,
        );
        await this.startInstanceWarmup(instance, config);
      },
    );

    await Promise.all(warmupPromises);
  }

  private async checkDailyMessageLimit(
    instanceId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          plan: true,
          instances: {
            where: {
              instanceName: instanceId,
            },
          },
        },
      });

      if (!user) {
        console.error(`Usuário ${userId} não encontrado`);
        return false;
      }

      if (user.plan !== 'free') {
        return true; // Usuários de planos pagos não têm limite.
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const stats = await prisma.mediaStats.findFirst({
        where: {
          instanceName: instanceId,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
        select: { totalDaily: true },
      });

      const totalMessages = stats?.totalDaily || 0;

      if (totalMessages >= 20) {
        console.log(`
				Limite diário de mensagens atingido para a instância ${instanceId}
				Total de mensagens hoje: ${totalMessages}
			`);

        await prisma.warmupStats.updateMany({
          where: {
            instanceName: instanceId,
            status: 'active',
          },
          data: {
            status: 'paused',
            pauseTime: new Date(),
          },
        });

        return false;
      }

      console.log(`
			Status do limite diário para a instância ${instanceId}:
			- Mensagens enviadas hoje: ${totalMessages}
			- Mensagens restantes: ${20 - totalMessages}
		`);

      return true;
    } catch (error) {
      console.error('Erro ao verificar limite diário:', {
        instanceId,
        error,
      });
      return false;
    }
  }

  private validateSticker(content: MediaContent): boolean {
    if (!content.base64) {
      console.error('Sticker sem conteúdo base64');
      return false;
    }

    if (!content.mimetype?.includes('webp')) {
      console.error('Sticker com formato inválido. Deve ser webp');
      return false;
    }

    // Estimativa do tamanho em bytes do base64 (base64 é aproximadamente 33% maior que o binário original)
    const base64Size = content.base64.length * 1.0; // Ajuste para 0.75 se necessário
    if (base64Size > 10000000) {
      // Limite de 10MB
      console.error('Sticker muito grande');
      return false;
    }

    return true;
  }

  private async startInstanceTimer(
    instanceId: string,
    userId: string,
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Buscar ou criar estatísticas do dia atual
    let mediaStats = await prisma.mediaStats.findFirst({
      where: {
        instanceName: instanceId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (!mediaStats) {
      mediaStats = await prisma.mediaStats.create({
        data: {
          instanceName: instanceId,
          text: 0,
          image: 0,
          video: 0,
          audio: 0,
          sticker: 0,
          reaction: 0,
          totalDaily: 0,
          totalAllTime: 0,
          totalSent: 0,
          totalReceived: 0,
          date: today,
        },
      });
    }

    // Buscar ou criar estatísticas de recebimento do dia atual
    let mediaReceivedStats = await prisma.mediaStats.findFirst({
      where: {
        instanceName: instanceId,
        date: {
          gte: today,
          lt: tomorrow,
        },
        // Adicione uma condição para diferenciar das estatísticas de envio
        isReceived: true,
      },
    });

    if (!mediaReceivedStats) {
      mediaReceivedStats = await prisma.mediaStats.create({
        data: {
          instanceName: instanceId,
          text: 0,
          image: 0,
          video: 0,
          audio: 0,
          sticker: 0,
          reaction: 0,
          totalDaily: 0,
          totalAllTime: 0,
          totalSent: 0,
          totalReceived: 0,
          date: today,
          isReceived: true, // Marcar como estatísticas de recebimento
        },
      });
    }

    const stats = await prisma.warmupStats.upsert({
      where: { instanceName: instanceId },
      create: {
        instanceName: instanceId,
        status: 'active',
        startTime: new Date(),
        userId: userId,
        mediaStatsId: mediaStats.id,
        mediaReceivedId: mediaReceivedStats.id,
      },
      update: {
        status: 'active',
        startTime: new Date(),
        mediaStatsId: mediaStats.id,
        mediaReceivedId: mediaReceivedStats.id,
      },
    });

    const timer = setInterval(async () => {
      if (this.stop) {
        clearInterval(timer);
        return;
      }

      const currentStats = await prisma.warmupStats.findUnique({
        where: { instanceName: instanceId },
      });

      if (currentStats?.status === 'active') {
        const newWarmupTime = (currentStats.warmupTime || 0) + 1;
        const progress = Math.min(
          Math.floor((newWarmupTime / (480 * 3600)) * 100),
          100,
        );

        await prisma.warmupStats.update({
          where: { instanceName: instanceId },
          data: {
            warmupTime: newWarmupTime,
            progress,
            lastActive: new Date(),
          },
        });
      }
    }, 1000);

    this.activeInstances.set(instanceId, timer);
  }

  private async resetDailyCounter(instanceId: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.mediaStats.updateMany({
      where: {
        instanceName: instanceId,
        date: {
          lt: today,
        },
      },
      data: {
        totalDaily: 0,
        date: today,
      },
    });
  }

  private async updateMediaStats(
    instanceId: string,
    messageType: string,
    isSent: boolean,
  ): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Buscar ou criar estatísticas do dia atual
      let mediaStats = await prisma.mediaStats.findFirst({
        where: {
          instanceName: instanceId,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      if (!mediaStats) {
        mediaStats = await prisma.mediaStats.create({
          data: {
            instanceName: instanceId,
            date: today,
            text: 0,
            image: 0,
            video: 0,
            audio: 0,
            sticker: 0,
            reaction: 0,
            totalDaily: 0,
            totalAllTime: 0,
            totalSent: 0,
            totalReceived: 0,
          },
        });
      }

      // Preparar dados para atualização
      const updateData: {
        [key: string]: any;
        totalDaily: { increment: number };
        totalAllTime: { increment: number };
        totalSent?: { increment: number };
        totalReceived?: { increment: number };
      } = {
        totalDaily: { increment: 1 },
        totalAllTime: { increment: 1 },
      };

      // Atualizar contadores de envio/recebimento
      if (isSent) {
        updateData.totalSent = { increment: 1 };
      } else {
        updateData.totalReceived = { increment: 1 };
      }

      // Atualizar contador específico do tipo de mensagem
      switch (messageType) {
        case 'text':
        case 'image':
        case 'video':
        case 'audio':
        case 'sticker':
        case 'reaction':
          updateData[messageType] = { increment: 1 };
          break;
        default:
          console.warn(
            `Tipo de mensagem desconhecido: ${messageType}`,
          );
      }

      // Atualizar estatísticas no banco
      const updatedStats = await prisma.mediaStats.update({
        where: { id: mediaStats.id },
        data: updateData,
      });

      // Log das atualizações
      console.log(`Estatísticas atualizadas para ${instanceId}:`, {
        messageType,
        dailyTotal: updatedStats.totalDaily,
        allTimeTotal: updatedStats.totalAllTime,
        sent: updatedStats.totalSent,
        received: updatedStats.totalReceived,
        specificTypeCount:
          updatedStats[messageType as keyof typeof updatedStats],
      });

      // Verificar limite diário para plano free
      if (updatedStats.totalDaily >= 20) {
        const user = await prisma.user.findFirst({
          where: {
            instances: {
              some: {
                instanceName: instanceId,
              },
            },
          },
          select: {
            plan: true,
          },
        });

        if (user?.plan === 'free') {
          console.log(`
          Limite diário atingido para instância ${instanceId}
          Total de mensagens hoje: ${updatedStats.totalDaily}
          Detalhamento:
          - Textos: ${updatedStats.text}
          - Imagens: ${updatedStats.image}
          - Vídeos: ${updatedStats.video}
          - Áudios: ${updatedStats.audio}
          - Stickers: ${updatedStats.sticker}
          - Reações: ${updatedStats.reaction}
        `);

          // Pausar o aquecimento automaticamente
          await prisma.warmupStats.update({
            where: { instanceName: instanceId },
            data: {
              status: 'paused',
              pauseTime: new Date(),
            },
          });

          throw new Error(
            'Limite diário de mensagens atingido para plano free',
          );
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', {
        error,
        instanceId,
        messageType,
        isSent,
      });
      throw error;
    }
  }

  public async processReceivedMessage(
    instanceId: string,
    message: ApiResponse,
  ): Promise<void> {
    try {
      const messageType = this.getMessageType(message);
      await this.updateMediaStats(instanceId, messageType, false);
    } catch (error) {
      console.error('Erro ao processar mensagem recebida:', error);
    }
  }

  private getMessageType(message: ApiResponse): string {
    if (message.message?.conversation) return 'text';
    if (message.message?.imageMessage) return 'image';
    if (message.message?.videoMessage) return 'video';
    if (message.message?.audioMessage) return 'audio';
    if (message.message?.stickerMessage) return 'sticker';
    if (message.message?.reactionMessage) return 'reaction';
    return 'unknown';
  }

  async stopWarmup(instanceId: string): Promise<void> {
    const timer = this.activeInstances.get(instanceId);
    if (timer) {
      clearInterval(timer);
      this.activeInstances.delete(instanceId);
    }

    // Remove todos os listeners específicos desta instância
    this.eventEmitter.removeAllListeners();

    await prisma.warmupStats.update({
      where: { instanceName: instanceId },
      data: {
        status: 'paused',
        pauseTime: new Date(),
      },
    });
  }

  async getInstanceStats(instanceId: string) {
    try {
      // Estatísticas do dia atual
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyStats = await prisma.mediaStats.findFirst({
        where: {
          instanceName: instanceId,
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      // Totais gerais
      const totalStats = await prisma.mediaStats.aggregate({
        where: {
          instanceName: instanceId,
        },
        _sum: {
          totalAllTime: true,
          text: true,
          image: true,
          video: true,
          audio: true,
          sticker: true,
          reaction: true,
        },
      });

      return {
        daily: dailyStats || {
          text: 0,
          image: 0,
          video: 0,
          audio: 0,
          sticker: 0,
          reaction: 0,
          totalDaily: 0,
        },
        total: totalStats._sum,
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  async stopAll(): Promise<void> {
    this.stop = true;
    for (const [
      instanceId,
      timer,
    ] of this.activeInstances.entries()) {
      clearInterval(timer);
      try {
        await prisma.warmupStats.updateMany({
          where: { instanceName: instanceId },
          data: {
            status: 'paused',
            pauseTime: new Date(),
          },
        });
      } catch (error) {
        // Loga o erro, mas não interrompe o loop para outras instâncias
        console.error(
          `Erro ao pausar WarmupStats para a instância ${instanceId}:`,
          error,
        );
      }
    }
    this.activeInstances.clear();
  }

  private async startInstanceWarmup(
    instance: PhoneInstance,
    config: WarmupConfig,
  ): Promise<void> {
    console.log(
      `Iniciando aquecimento para a instância ${instance.instanceId}`,
    );

    // Verificar plano do usuário
    const user = await prisma.user.findUnique({
      where: { id: config.userId },
      select: { plan: true },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const planLimits =
      PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];

    // Validar tipos de mensagem conforme o plano
    const allowedTypes = planLimits.features as MessageType[];

    // Verifica se o usuário tem conteúdo disponível para enviar
    const availableContent = {
      text:
        Array.isArray(config.contents.texts) &&
        config.contents.texts.length > 0,
      audio:
        Array.isArray(config.contents.audios) &&
        config.contents.audios.length > 0,
      image:
        Array.isArray(config.contents.images) &&
        config.contents.images.length > 0,
      video:
        Array.isArray(config.contents.videos) &&
        config.contents.videos.length > 0,
      sticker:
        Array.isArray(config.contents.stickers) &&
        config.contents.stickers.length > 0,
    };

    // Filtrar tipos de mensagem permitidos pelo plano
    const filteredContentTypes = Object.keys(availableContent).filter(
      (type) => {
        const messageType = type.replace('Chance', '') as MessageType;
        return allowedTypes.includes(messageType);
      },
    );
    if (!filteredContentTypes.length) {
      console.log(
        'Nenhum conteúdo disponível para envio conforme o plano do usuário',
      );
      return;
    }

    // Adicionar um listener para mensagens recebidas
    const messageListener = (message: ApiResponse) => {
      if (!message.key.fromMe) {
        this.processReceivedMessage(instance.instanceId, message);
      }
    };

    // Registrar o listener
    this.eventEmitter.on('message', messageListener);

    // Lista de números externos para conversar
    const externalNumbers = this.getExternalNumbersList();

    // ID do grupo para conversas em grupo
    const groupId =
      config.config.groupId || '120363419940617369@g.us';

    while (!this.stop) {
      try {
        // Verificar limite diário antes de iniciar novo ciclo
        const canSendMessage = await this.checkDailyMessageLimit(
          instance.instanceId,
          config.userId,
        );
        if (!canSendMessage) {
          console.log(
            'Limite diário atingido, pausando aquecimento...',
          );
          await this.stopWarmup(instance.instanceId);
          break;
        }

        const stats = await prisma.warmupStats.findUnique({
          where: { instanceName: instance.instanceId },
        });

        if (stats?.status !== 'active') {
          console.log(
            `Aquecimento para a instância ${instance.instanceId} foi pausado.`,
          );
          break;
        }

        // Removida verificação de horário - sempre permite envio de mensagens

        // Calcular score de engajamento
        const engagementScore =
          await this.engagementOptimizer.calculateEngagementScore(
            instance.instanceId,
          );
        console.log(
          `Score de engajamento: ${engagementScore.toFixed(1)}`,
        );

        // Otimizar timing baseado no engajamento
        const optimalDelay =
          await this.engagementOptimizer.optimizeMessageTiming(
            instance.instanceId,
          );
        console.log(`Timing otimizado: ${optimalDelay}ms`);

        // Simular status online se configurado
        if (config.config.onlineStatusSimulation) {
          await this.humanBehaviorSimulator.simulateOnlineStatus(
            instance.instanceId,
            'online',
          );
        }

        // Decidir se vai enviar para grupo ou privado
        const isGroupMessage =
          Math.random() < (config.config.groupChance || 0.3);

        // Decidir se vai usar números externos ou instâncias
        const useExternalNumbers =
          Math.random() <
          (config.config.externalNumbersChance || 0.4);

        let targetNumbers: string[] = [];

        if (isGroupMessage) {
          // Para grupos, sempre usar o grupo configurado
          targetNumbers = [groupId];
          console.log('Decidido enviar mensagem para grupo');
        } else {
          // Para privado, escolher entre números externos ou instâncias
          if (useExternalNumbers) {
            // Selecionar alguns números externos aleatoriamente
            const shuffledExternal = [...externalNumbers].sort(
              () => Math.random() - 0.5,
            );
            targetNumbers = shuffledExternal.slice(
              0,
              Math.min(3, shuffledExternal.length),
            );
            console.log(
              `Decidido usar ${targetNumbers.length} números externos`,
            );
          } else {
            // Usar instâncias do config
            targetNumbers = config.phoneInstances
              .filter(
                (toInstance) =>
                  instance.instanceId !== toInstance.instanceId,
              )
              .map((toInstance) => toInstance.phoneNumber);
            console.log(
              `Decidido usar ${targetNumbers.length} instâncias`,
            );
          }
        }

        for (const targetNumber of targetNumbers) {
          if (this.stop) continue;

          try {
            const messageTypes = [
              { type: 'sticker', chance: 0.3 }, // 30% chance
              { type: 'audio', chance: 0.4 }, // 40% chance
              { type: 'text', chance: 0.3 }, // 30% chance
              { type: 'reaction', chance: 0.2 }, // 20% chance
              { type: 'image', chance: 0.1 }, // 10% chance
              { type: 'video', chance: 0.1 }, // 10% chance
            ].filter(
              (t) =>
                availableContent[
                  t.type as keyof typeof availableContent
                ],
            );

            if (messageTypes.length === 0) continue;

            const messageType = this.decideMessageType(config.config);
            if (!filteredContentTypes.includes(messageType)) {
              console.log(
                `Tipo de mensagem ${messageType} não permitido pelo plano`,
              );
              continue;
            }

            const randomValue = Math.random();
            let accumulatedChance = 0;
            let selectedType = messageTypes[0].type;

            for (const { type, chance } of messageTypes) {
              accumulatedChance += chance;
              if (randomValue <= accumulatedChance) {
                selectedType = type;
                break;
              }
            }

            // Simular comportamento humano com otimizações
            if (config.config.typingSimulation) {
              switch (selectedType) {
                case 'text':
                  console.log(
                    `Simulando digitação para ${
                      isGroupMessage ? 'grupo' : targetNumber
                    }...`,
                  );
                  await this.humanBehaviorSimulator.simulateTyping(
                    instance.instanceId,
                    isGroupMessage ? 'grupo' : targetNumber,
                  );
                  break;
                case 'audio':
                  console.log(
                    `Simulando gravação de áudio para ${
                      isGroupMessage ? 'grupo' : targetNumber
                    }...`,
                  );
                  await new Promise((resolve) =>
                    setTimeout(
                      resolve,
                      Math.floor(Math.random() * 10000) + 5000,
                    ),
                  );
                  break;
                case 'image':
                case 'video':
                  console.log(
                    `Simulando seleção de mídia para ${
                      isGroupMessage ? 'grupo' : targetNumber
                    }...`,
                  );
                  await new Promise((resolve) =>
                    setTimeout(
                      resolve,
                      Math.floor(Math.random() * 5000) + 3000,
                    ),
                  );
                  break;
                case 'sticker':
                  console.log(
                    `Simulando seleção de sticker para ${
                      isGroupMessage ? 'grupo' : targetNumber
                    }...`,
                  );
                  await new Promise((resolve) =>
                    setTimeout(
                      resolve,
                      Math.floor(Math.random() * 4000) + 2000,
                    ),
                  );
                  break;
              }
            } else {
              // Delay básico se simulação desabilitada
              await new Promise((resolve) =>
                setTimeout(
                  resolve,
                  Math.floor(Math.random() * 2000) + 1000,
                ),
              );
            }

            const content = this.getContentForType(
              selectedType,
              config.contents,
            );

            if (content) {
              console.log(
                `Enviando ${selectedType} para ${
                  isGroupMessage ? 'grupo' : targetNumber
                }`,
              );

              const messageId = await this.sendMessage(
                instance.instanceId,
                targetNumber,
                content,
                selectedType,
                config.userId,
              );

              if (messageId) {
                console.log(
                  `Mensagem ${selectedType} enviada com sucesso`,
                );

                // Simular read receipt se configurado
                if (config.config.readReceiptSimulation) {
                  await this.humanBehaviorSimulator.simulateReadReceipt(
                    instance.instanceId,
                    messageId,
                  );
                }

                // Rastrear profundidade da conversa
                this.engagementOptimizer.trackConversationDepth(
                  instance.instanceId,
                  this.conversationHistory.get(instance.instanceId)
                    ?.length || 0,
                );

                if (
                  selectedType === 'text' &&
                  Math.random() < config.config.reactionChance
                ) {
                  console.log('Aguardando para reagir à mensagem...');
                  await new Promise((resolve) =>
                    setTimeout(
                      resolve,
                      Math.floor(Math.random() * 2000) + 2000,
                    ),
                  );
                  await this.sendReaction(
                    instance.instanceId,
                    targetNumber,
                    messageId,
                    config,
                  );
                }

                // Aplicar delay otimizado baseado no engajamento
                const optimizedDelay = Math.max(optimalDelay, 8000);
                console.log(
                  `Aguardando ${optimizedDelay}ms antes da próxima mensagem (otimizado)...`,
                );
                await new Promise((resolve) =>
                  setTimeout(
                    resolve,
                    optimizedDelay + Math.floor(Math.random() * 5000),
                  ),
                );
              }
            }
          } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            if (
              error instanceof Error &&
              error.message.includes('Limite diário')
            ) {
              await this.stopWarmup(instance.instanceId);
              break;
            }
            await new Promise((resolve) =>
              setTimeout(
                resolve,
                Math.floor(Math.random() * 10000) + 10000,
              ),
            );
          }
        }

        // Atualizar status periodicamente
        if (
          Math.random() < (config.config.statusUpdateChance || 0.1)
        ) {
          const statusTexts = config.config.statusTexts || [
            'Disponível',
            'Em reunião',
            'No trabalho',
          ];
          const randomStatus = this.getRandomItem(statusTexts);
          console.log(`Atualizando status para: ${randomStatus}`);
          await this.updateStatus(
            instance.instanceId,
            randomStatus,
            config,
          );
        }

        // Atualizar perfil periodicamente
        if (
          Math.random() < (config.config.profileUpdateChance || 0.05)
        ) {
          const profileNames = config.config.profileNames || [
            'João Silva',
            'Maria Santos',
          ];
          const profileBios = config.config.profileBios || [
            'Desenvolvedor',
            'Analista',
          ];
          const randomName = this.getRandomItem(profileNames);
          const randomBio = this.getRandomItem(profileBios);
          console.log(
            `Atualizando perfil: ${randomName} - ${randomBio}`,
          );
          await this.updateProfile(
            instance.instanceId,
            {
              name: randomName,
              bio: randomBio,
              status: 'online',
            },
            config,
          );
        }

        console.log(
          'Finalizando ciclo de mensagens, aguardando próximo ciclo...',
        );
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            Math.floor(Math.random() * 15000) + 15000,
          ),
        );
      } catch (error) {
        console.error('Erro no loop principal:', error);
        if (
          error instanceof Error &&
          error.message.includes('Limite diário')
        ) {
          await this.stopWarmup(instance.instanceId);
          break;
        }
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            Math.floor(Math.random() * 20000) + 20000,
          ),
        );
      }
    }
  }

  private getMimeType(type: string): string {
    switch (type) {
      case 'image':
        return 'image/jpeg';
      case 'video':
        return 'video/mp4';
      case 'audio':
        return 'audio/mp3';
      case 'sticker':
        return 'image/webp';
      default:
        return 'application/octet-stream';
    }
  }

  private async checkPlanLimits(
    instanceId: string,
    userId: string,
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) return false;

    const planLimits =
      PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS];

    // Verifica limite diário de mensagens
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const messageCount = await prisma.mediaStats.findFirst({
      where: {
        instanceName: instanceId,
        date: {
          gte: today,
        },
      },
    });

    if (
      (messageCount?.totalDaily || 0) >= planLimits.messagesPerDay
    ) {
      console.log(
        `Limite diário atingido para instância ${instanceId}`,
      );
      await this.stopWarmup(instanceId);
      return false;
    }

    return true;
  }

  private async sendMessage(
    instanceId: string,
    to: string,
    content: any,
    messageType: string,
    userId: string,
  ): Promise<string | false> {
    try {
      const canSend = await this.checkPlanLimits(instanceId, userId);
      if (!canSend) {
        throw new Error('Limite do plano atingido');
      }

      // Verificar se é um grupo (contém @g.us) ou número privado
      const isGroup = to.includes('@g.us');
      const formattedNumber = isGroup
        ? to
        : to.replace('@s.whatsapp.net', '');

      // Verificar se é um tipo avançado que precisa de tratamento especial
      if (
        ['document', 'location', 'contact', 'poll'].includes(
          messageType,
        )
      ) {
        return await this.sendAdvancedMessage(
          instanceId,
          formattedNumber,
          content,
          messageType,
          userId,
        );
      }

      const config = this.createMessageConfig(
        instanceId,
        formattedNumber,
        content,
        messageType,
      );

      console.log(`\n=== Iniciando envio de ${messageType} ===`);
      console.log(`Instância: ${instanceId}`);
      console.log(`Destinatário: ${formattedNumber}`);
      console.log(`Tipo: ${isGroup ? 'Grupo' : 'Privado'}`);
      console.log(`Endpoint: ${config.endpoint}`);
      console.log('Payload:', {
        ...config.payload,
        media: config.payload.media ? '[BASE64]' : undefined,
        audio: config.payload.audio ? '[BASE64]' : undefined,
        sticker: config.payload.sticker ? '[BASE64]' : undefined,
      });

      await new Promise((resolve) =>
        setTimeout(
          resolve,
          config.delay + Math.floor(Math.random() * 1000),
        ),
      );

      const response = await axios.post<ApiResponse>(
        config.endpoint,
        config.payload,
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: API_KEY,
          },
        },
      );

      if (response.data?.key?.id) {
        console.log(`Mensagem ${messageType} enviada com sucesso`);
        await this.updateMediaStats(instanceId, messageType, true);
        return response.data.key.id;
      }

      console.error(
        `Falha ao enviar ${messageType}: Resposta inválida`,
        response.data,
      );
      return false;
    } catch (error) {
      const apiError = error as ApiError;
      console.error(`Erro ao enviar ${messageType}:`, {
        error:
          apiError.response?.data ||
          apiError.message ||
          'Erro desconhecido',
        instanceId,
        to,
        messageType,
      });
      return false;
    }
  }

  private async sendAdvancedMessage(
    instanceId: string,
    to: string,
    content: any,
    messageType: string,
    userId: string,
  ): Promise<string | undefined> {
    try {
      switch (messageType) {
        case 'document':
          return await this.sendDocument(
            instanceId,
            to,
            content,
            {} as WarmupConfig,
          );
        case 'location':
          return await this.sendLocation(
            instanceId,
            to,
            content,
            {} as WarmupConfig,
          );
        case 'contact':
          return await this.sendContact(
            instanceId,
            to,
            content,
            {} as WarmupConfig,
          );
        case 'poll':
          return await this.sendPoll(
            instanceId,
            to,
            content,
            {} as WarmupConfig,
          );
        default:
          console.error(
            `Tipo de mensagem avançada não suportado: ${messageType}`,
          );
          return false;
      }
    } catch (error) {
      console.error(
        `Erro ao enviar mensagem avançada ${messageType}:`,
        error,
      );
      return false;
    }
  }

  private createMessageConfig(
    instanceId: string,
    formattedNumber: string,
    content: any,
    messageType: string,
  ): SendMessageConfig {
    const isMedia = typeof content === 'object';
    const isGroup = formattedNumber.includes('@g.us');
    const config: SendMessageConfig = {
      endpoint: '',
      payload: {},
      delay: 1000,
    };

    if (isMedia && content) {
      const mediaContent = content as MediaContent;

      if (messageType === 'sticker') {
        config.endpoint = `${URL_API}/message/sendSticker/${instanceId}`;
        config.delay = Math.floor(Math.random() * 2000) + 1000;
        config.payload = {
          number: formattedNumber,
          sticker: mediaContent.base64,
          delay: config.delay,
        };
      } else if (messageType === 'image' || messageType === 'video') {
        config.endpoint = `${URL_API}/message/sendMedia/${instanceId}`;
        const base64Length = mediaContent.base64?.length || 0;
        config.delay = Math.min(
          5000,
          Math.floor(base64Length / 1000) + 2000,
        );
        config.payload = {
          number: formattedNumber,
          mediatype: messageType,
          media: mediaContent.base64,
          mimetype: mediaContent.mimetype,
          fileName: mediaContent.fileName,
          caption: mediaContent.caption,
          delay: config.delay,
        };
      } else if (messageType === 'audio') {
        config.endpoint = `${URL_API}/message/sendWhatsAppAudio/${instanceId}`;
        config.delay = Math.floor(Math.random() * 10000) + 5000;
        config.payload = {
          number: formattedNumber,
          audio: mediaContent.base64,
          encoding: true,
          delay: config.delay,
        };
      }
    } else {
      config.endpoint = `${URL_API}/message/sendText/${instanceId}`;
      const textLength = (content as string).length;
      config.delay = Math.min(
        8000,
        Math.floor(textLength * 100) + 2000,
      );
      config.payload = {
        number: formattedNumber,
        text: content,
        delay: config.delay,
        linkPreview: true,
      };
    }

    return config;
  }

  // Função auxiliar para extrair o ID da mensagem de forma segura
  private getMessageId(response: any): string | undefined {
    return response?.data?.key?.id || response?.key?.id;
  }

  private async sendReaction(
    instanceId: string,
    to: string,
    messageId: string,
    config: WarmupConfig,
  ): Promise<boolean> {
    try {
      const reaction = this.getRandomItem(config.contents.emojis);
      const payload = {
        key: {
          remoteJid: `${to}@s.whatsapp.net`,
          fromMe: true,
          id: messageId,
        },
        reaction: reaction,
      };

      // Log do payload
      console.log(
        `Enviando reação para mensagem ${messageId}:`,
        payload,
      );

      await axios.post(
        `${URL_API}/message/sendReaction/${instanceId}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: API_KEY,
          },
        },
      );

      await this.updateMediaStats(instanceId, 'reaction', true);
      return true;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Erro ao enviar reação:', {
        error:
          apiError.response?.data ||
          apiError.message ||
          'Erro desconhecido',
        payload: {
          messageId,
          to,
          instanceId,
        },
      });
      return false;
    }
  }

  // Novos métodos para tipos avançados de mensagem
  private async sendDocument(
    instanceId: string,
    to: string,
    document: any,
    config: WarmupConfig,
  ): Promise<string | false> {
    try {
      const payload = {
        number: to,
        document: document.base64,
        fileName: document.fileName || 'document.pdf',
        mimetype: document.mimetype || 'application/pdf',
        caption: document.caption || '',
      };

      const response = await axios.post(
        `${URL_API}/message/sendDocument/${instanceId}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: API_KEY,
          },
        },
      );

      if (response.data?.key?.id) {
        await this.updateMediaStats(instanceId, 'document', true);
        return response.data.key.id;
      }

      return false;
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      return false;
    }
  }

  private async sendLocation(
    instanceId: string,
    to: string,
    location: any,
    config: WarmupConfig,
  ): Promise<string | false> {
    try {
      const payload = {
        number: to,
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name,
        address: location.address,
      };

      const response = await axios.post(
        `${URL_API}/message/sendLocation/${instanceId}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: API_KEY,
          },
        },
      );

      if (response.data?.key?.id) {
        await this.updateMediaStats(instanceId, 'location', true);
        return response.data.key.id;
      }

      return false;
    } catch (error) {
      console.error('Erro ao enviar localização:', error);
      return false;
    }
  }

  private async sendContact(
    instanceId: string,
    to: string,
    contact: any,
    config: WarmupConfig,
  ): Promise<string | false> {
    try {
      const payload = {
        number: to,
        contact: {
          name: contact.name,
          number: contact.number,
          email: contact.email,
        },
      };

      const response = await axios.post(
        `${URL_API}/message/sendContact/${instanceId}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: API_KEY,
          },
        },
      );

      if (response.data?.key?.id) {
        await this.updateMediaStats(instanceId, 'contact', true);
        return response.data.key.id;
      }

      return false;
    } catch (error) {
      console.error('Erro ao enviar contato:', error);
      return false;
    }
  }

  private async sendPoll(
    instanceId: string,
    to: string,
    poll: any,
    config: WarmupConfig,
  ): Promise<string | false> {
    try {
      const payload = {
        number: to,
        question: poll.question,
        options: poll.options,
      };

      const response = await axios.post(
        `${URL_API}/message/sendPoll/${instanceId}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: API_KEY,
          },
        },
      );

      if (response.data?.key?.id) {
        await this.updateMediaStats(instanceId, 'poll', true);
        return response.data.key.id;
      }

      return false;
    } catch (error) {
      console.error('Erro ao enviar enquete:', error);
      return false;
    }
  }

  private async updateProfile(
    instanceId: string,
    profileData: any,
    config: WarmupConfig,
  ): Promise<boolean> {
    try {
      const payload = {
        name: profileData.name,
        bio: profileData.bio,
        status: profileData.status,
      };

      await axios.post(
        `${URL_API}/instance/updateProfile/${instanceId}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: API_KEY,
          },
        },
      );

      await this.updateMediaStats(instanceId, 'profile', true);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return false;
    }
  }

  private async updateStatus(
    instanceId: string,
    statusText: string,
    config: WarmupConfig,
  ): Promise<boolean> {
    try {
      const payload = {
        status: statusText,
      };

      await axios.post(
        `${URL_API}/instance/updateStatus/${instanceId}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            apikey: API_KEY,
          },
        },
      );

      await this.updateMediaStats(instanceId, 'status', true);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return false;
    }
  }

  private async sendRandomMedia(
    instanceId: string,
    to: string,
    config: WarmupConfig,
  ): Promise<void> {
    const mediaTypes = ['image', 'audio', 'video', 'sticker'];

    for (const type of mediaTypes) {
      const contentType = type as keyof typeof config.contents;
      if (
        config.contents[contentType]?.length > 0 &&
        Math.random() < (config.config as any)[`${type}Chance`]
      ) {
        const content = await this.getContentForType(
          type,
          config.contents,
        );
        if (content) {
          await this.sendMessage(
            instanceId,
            to,
            content,
            type,
            config.userId || '',
          );
        }
      }
    }
  }

  private getContentForType(
    type: string,
    contents: WarmupConfig['contents'],
  ): string | MediaContent | any {
    try {
      const contentKey = `${type}s` as keyof typeof contents;
      const contentArray = contents[contentKey];

      if (
        !contentArray ||
        !Array.isArray(contentArray) ||
        contentArray.length === 0
      ) {
        console.log(`Nenhum conteúdo disponível para ${type}`);
        return null;
      }

      const content = this.getRandomItem(contentArray as any[]);

      if (type === 'text') {
        return content as string;
      }

      if (typeof content === 'object' && 'base64' in content) {
        return {
          type: type as 'image' | 'video' | 'audio' | 'sticker',
          base64: content.base64,
          fileName: content.fileName || `file.${type}`,
          mimetype: content.mimetype || this.getMimeType(type),
        };
      }

      // Para novos tipos de conteúdo
      if (
        type === 'document' ||
        type === 'location' ||
        type === 'contact' ||
        type === 'poll'
      ) {
        return content;
      }

      return null;
    } catch (error) {
      console.error(`Erro ao obter conteúdo para ${type}:`, error);
      return null;
    }
  }

  private getRandomItem<T>(items: T[]): T {
    if (!items || items.length === 0) {
      throw new Error('Array vazio ou indefinido');
    }
    return items[Math.floor(Math.random() * items.length)];
  }

  private async delay(min: number, max: number): Promise<void> {
    const baseDelay =
      Math.floor(Math.random() * (max - min + 1)) + min;
    const variation = Math.floor(Math.random() * 1000);
    const finalDelay = baseDelay + variation;
    return new Promise((resolve) => setTimeout(resolve, finalDelay));
  }

  private decideMessageType(config: WarmupConfig['config']): string {
    const random = Math.random();
    const chances = [
      { type: 'text', chance: config.textChance || 0.35 },
      { type: 'audio', chance: config.audioChance || 0.25 },
      { type: 'sticker', chance: config.stickerChance || 0.15 },
      { type: 'image', chance: config.imageChance || 0.08 },
      { type: 'video', chance: config.videoChance || 0.05 },
      { type: 'document', chance: config.documentChance || 0.03 },
      { type: 'location', chance: config.locationChance || 0.02 },
      { type: 'contact', chance: config.contactChance || 0.02 },
      { type: 'poll', chance: config.pollChance || 0.02 },
    ];

    let accumulated = 0;
    for (const { type, chance } of chances) {
      accumulated += chance;
      if (random <= accumulated) {
        return type;
      }
    }

    return 'text';
  }

  private getExternalNumbersList(): string[] {
    return [
      '5511999151515',
      '553123320005',
      '5511956860124',
      '551134748029',
      '551155728778',
      '5521993153062',
      '554832433664',
      '551128530702',
      '554791107025',
      '551128530762',
      '5511937577552',
      '5521994017240',
      '557532216114',
      '5511972146733',
      '5511915862328',
      '559230421437',
      '555133825500',
      '5511934505884',
      '5511975295195',
      '5511912609190',
      '5511994304972',
      '5511939036857',
      '551126265327',
      '551131552800',
      '555599897514',
      '554732373771',
      '551940421800',
      '558534866366',
      '555433176300',
      '558007274660',
      '5511976664900',
      '5511986293294',
      '5511934819317',
      '558881822574',
      '551156130202',
      '551132300363',
      '5511915828037',
      '551821018311',
      '551130422170',
      '555133143838',
      '558140043050',
      '558006661515',
      '551121098888',
      '552135909000',
      '551128530325',
      '551132301493',
      '555133343432',
      '558140043230',
      '5521993410670',
      '5511941836701',
      '5511940646175',
      '5511941536754',
      '558000207758',
      '558001040104',
      '552120423829',
      '551130048007',
      '5511944469719',
      '551133452288',
      '5519983630058',
      '552721247700',
      '553183386125',
      '5511963785460',
      '556135224521',
      '551131354148',
      '5521981281045',
      '558002320800',
      '5511955581462',
      '552134601746',
      '551140644106',
      '554195053843',
      '551151999851',
      '551142008293',
      '551142000252',
      '5511943323273',
      '5511973079915',
      '5511993428075',
      '551150621456',
      '555433270042',
      '558340629108',
      '553133849008',
      '552138121921',
      '5511943079112',
      '5511911875504',
      '551148390436',
      '558331422688',
      '5511988952656',
      '5521980090636',
      '551135223406',
      '551935006321',
      '557182197732',
      '551131985816',
      '551131360110',
      '5511972888604',
      '5511934687141',
      '5511943396419',
      '558007442110',
      '551142000355',
      '553432576000',
      '5511976216004',
      '555191490457',
      '5521991776152',
      '5511933505743',
      '5511988913555',
      '5511945382314',
      '553198780286',
      '551132322935',
      '5511942114304',
      '558001488000',
      '552139007070',
      '551151963400',
      '553132612801',
      '558000550073',
      '558007268010',
      '551150439404',
      '551130037242',
      '5521967446767',
      '5511976379870',
      '5521965247184',
      '551137249000',
      '5511944882022',
      '5511975691546',
      '5511964146890',
      '5511913185864',
      '5511999910621',
      '556140040001',
      '551140201955',
      '5521973015191',
    ];
  }
}

export const warmupService = new WarmupService();
