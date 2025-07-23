// src/services/campaign.service.ts
import type { Campaign, PrismaClient } from '@prisma/client';
import { endOfDay, startOfDay } from 'date-fns';
import type {
  CampaignParams,
  ImportLeadsResult,
  Lead,
} from '../interface';
import { prisma } from '../lib/prisma'; // Importação do prisma
import { getFromCache, setToCache } from '../lib/redis';
import { logger } from '../utils/logger'; // Importação do logger
import { messageDispatcherService } from './campaign-dispatcher.service';
import { leadSegmentationService } from './lead-segmentation.service';
import { unreadMessageHandler } from './unread-message-handler.service';

interface MediaParams {
  type: 'image' | 'video' | 'audio';
  content: string;
  caption?: string;
}

export class CampaignService {
  private prisma: PrismaClient;

  constructor() {
    // Usar a instância de prisma já inicializada de '../lib/prisma'
    this.prisma = prisma;
  }

  // Função para remover duplicatas do arquivo
  private removeDuplicateLeads(leads: Lead[]): Lead[] {
    const uniquePhones = new Set<string>();

    return leads.filter((lead) => {
      if (!lead || !lead.phone) {
        logger.warn('Lead inválido ignorado:', lead);
        return false;
      }

      const phone = this.formatPhone(lead.phone);
      if (phone && !uniquePhones.has(phone)) {
        uniquePhones.add(phone);
        return true;
      }

      return false;
    });
  }

  async listCampaigns(userId: string): Promise<Campaign[]> {
    try {
      const cacheKey = `campaigns:${userId}`;
      const cachedCampaigns = await getFromCache(cacheKey);

      if (cachedCampaigns) {
        return JSON.parse(cachedCampaigns);
      }

      const campaigns = await this.prisma.campaign.findMany({
        where: { userId },
        include: {
          dispatches: {
            include: { instance: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          statistics: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      await setToCache(cacheKey, JSON.stringify(campaigns), 3600); // 1 hora de TTL

      return campaigns;
    } catch (error) {
      logger.error(
        'Erro ao listar campanhas do Redis, buscando no banco:',
        error,
      );
      // Em caso de erro no Redis, retornar dados do banco
      return this.prisma.campaign.findMany({
        where: { userId },
        include: {
          dispatches: {
            include: { instance: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          statistics: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  private async processFile(
    file: Express.Multer.File,
  ): Promise<Lead[]> {
    const content = file.buffer.toString();
    const lines = content.split('\n');

    return lines
      .filter((line) => line.trim())
      .map((line) => {
        const [name, phone] = line
          .split(',')
          .map((field) => field.trim());
        // Aplica formatPhone aqui para garantir que o telefone esteja formatado desde o início
        return { name: name || null, phone: this.formatPhone(phone) };
      })
      .filter((lead) => lead.phone !== null) as Lead[]; // Filtra apenas leads com telefone válido e formatado
  }

  async importLeads(
    file: Express.Multer.File,
    userId: string,
    campaignId: string,
  ): Promise<ImportLeadsResult> {
    try {
      const rawLeads = await this.processFile(file);
      const uniqueLeads = this.removeDuplicateLeads(rawLeads); // removeDuplicateLeads já usa formatPhone

      // Obter telefones formatados dos leads únicos para a verificação
      const uniqueFormattedPhones = uniqueLeads.map(
        (lead) => lead.phone as string,
      );

      // Verificar leads existentes na campanha com base nos telefones formatados
      const existingLeads = await this.prisma.campaignLead.findMany({
        where: {
          campaignId,
          phone: {
            in: uniqueFormattedPhones, // Use os telefones formatados
          },
        },
      });

      const existingPhonesInCampaign = new Set(
        existingLeads.map((lead) => lead.phone),
      );

      // Filtrar apenas os leads que não existem na campanha atual
      const newLeadsToCreate = uniqueLeads.filter(
        (lead) => !existingPhonesInCampaign.has(lead.phone as string),
      );

      logger.log('Leads novos a serem importados:', newLeadsToCreate);

      // Atualizar leads existentes
      await this.prisma.campaignLead.updateMany({
        where: {
          campaignId,
          phone: { in: Array.from(existingPhonesInCampaign) },
        },
        data: {
          status: 'PENDING',
          sentAt: null,
          deliveredAt: null,
          readAt: null,
          failedAt: null,
          failureReason: null,
          messageId: null,
        },
      });

      let createResult = { count: 0 };
      if (newLeadsToCreate.length > 0) {
        createResult = await this.prisma.campaignLead.createMany({
          data: newLeadsToCreate.map((lead) => ({
            campaignId,
            userId,
            name: lead.name || null,
            phone: lead.phone as string, // Já formatado e garantido como string
            status: 'PENDING',
          })),
          skipDuplicates: true, // Isso garante que se houver uma corrida ou outra duplicata, ela será ignorada
        });
      }

      // Buscar total de leads na campanha
      const totalLeadsInCampaign =
        await this.prisma.campaignLead.count({
          where: { campaignId },
        });

      // Buscar todos os leads atualizados/criados para retornar
      const updatedLeads = await this.prisma.campaignLead.findMany({
        where: { campaignId },
      });

      return {
        success: true,
        count: updatedLeads.length,
        leads: updatedLeads,
        summary: {
          total: totalLeadsInCampaign,
          totalInFile: rawLeads.length, // Total de leads no arquivo original
          duplicatesInFile: rawLeads.length - uniqueLeads.length, // Duplicatas removidas do arquivo
          existingInCampaign: existingLeads.length, // Leads que já existiam na campanha e foram atualizados
          newLeadsImported: createResult.count, // Novos leads realmente importados
        },
      };
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        // Esta mensagem pode ser mais específica se a constraint P2002 for em (campaignId, phone)
        throw new Error(
          'Houve um problema de duplicidade. Verifique se não há números repetidos no arquivo que já existam na campanha ou entre si.',
        );
      }
      logger.error('Erro ao importar leads:', error);
      throw error;
    }
  }

  /// Função auxiliar para formatar números de telefone
  private formatPhone(phone: unknown): string | null {
    if (!phone) return null;
    try {
      const cleaned = String(phone).replace(/\D/g, '');

      if (cleaned.length < 10) return null;

      return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
    } catch (error) {
      logger.error('Erro ao formatar telefone:', phone, error); // Usando a instância global de logger
      return null;
    }
  }

  public async getCampaignLeads(
    campaignId: string,
    userId: string | undefined,
    page: number,
    limit: number,
  ) {
    const where = {
      campaignId,
      ...(userId && { userId }),
    };

    const [leads, total] = await Promise.all([
      this.prisma.campaignLead.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.campaignLead.count({ where }),
    ]);

    return {
      data: leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  public async removeLead(
    campaignId: string,
    leadId: string,
    userId: string,
  ) {
    return this.prisma.campaignLead.deleteMany({
      where: {
        id: leadId,
        campaignId,
        userId,
      },
    });
  }

  public async startCampaign(params: CampaignParams): Promise<void> {
    const instance = await this.prisma.instance.findUnique({
      where: { instanceName: params.instanceName },
    });

    if (!instance) {
      throw new Error(
        `Instância ${params.instanceName} não encontrada`,
      );
    }

    if (instance.connectionStatus !== 'OPEN') {
      throw new Error(
        `Instância ${params.instanceName} não está conectada`,
      );
    }

    // Resetar o status de todos os leads da campanha para PENDING
    await this.prisma.campaignLead.updateMany({
      where: { campaignId: params.campaignId },
      data: {
        status: 'PENDING',
        sentAt: null,
        deliveredAt: null,
        readAt: null,
        failedAt: null,
        failureReason: null,
        messageId: null, // Limpar o messageId para uma nova tentativa
      },
    });

    // Usar o messageDispatcherService existente
    return messageDispatcherService.startDispatch({
      campaignId: params.campaignId,
      instanceName: instance.instanceName,
      message: params.message,
      media: params.media,
      minDelay: params.minDelay,
      maxDelay: params.maxDelay,
    });
  }

  // Método auxiliar
  private getMimeType(type: 'image' | 'video' | 'audio'): string {
    switch (type) {
      case 'image':
        return 'image/jpeg';
      case 'video':
        return 'video/mp4';
      case 'audio':
        return 'audio/mp3';
      default:
        return 'application/octet-stream';
    }
  }

  public async stopDispatch(): Promise<void> {
    return messageDispatcherService.stopDispatch();
  }

  async updateMessageStatus(
    messageId: string,
    newStatus: string,
    instanceId: string,
    phone: string, // Mantido para log, mas a busca principal será por messageId
    messageType: string,
    content: string,
    reason?: string,
  ): Promise<void> {
    try {
      // Encontrar o CampaignLead usando o messageId
      const lead = await this.prisma.campaignLead.findFirst({
        where: { messageId }, // Busca pelo messageId para maior precisão
        include: { campaign: true },
      });

      if (!lead) {
        logger.warn(
          `Lead não encontrado para messageId: ${messageId} (telefone: ${phone})`,
        );
        return;
      }

      // Atualizar o status do CampaignLead
      await this.prisma.campaignLead.update({
        where: { id: lead.id },
        data: {
          status: newStatus.toUpperCase(), // Garante que o status seja em maiúsculas se necessário
          ...(newStatus === 'sent' && { sentAt: new Date() }),
          ...(newStatus === 'delivered' && {
            deliveredAt: new Date(),
          }),
          ...(newStatus === 'read' && { readAt: new Date() }),
          ...(newStatus === 'failed' && {
            failedAt: new Date(),
            failureReason: reason,
          }),
        },
      });

      // Criar um log da mensagem
      await this.prisma.messageLog.create({
        data: {
          messageId,
          messageDate: new Date(),
          campaignId: lead.campaignId,
          campaignLeadId: lead.id,
          messageType,
          content,
          status: newStatus,
          statusHistory: [
            {
              status: newStatus,
              timestamp: new Date().toISOString(),
              reason,
            },
          ],
        },
      });
    } catch (error) {
      logger.error(
        'Erro ao atualizar status da mensagem ou criar log:',
        error,
      );
      throw error;
    }
  }

  public async getDailyStats(
    campaignId: string,
    date: Date,
  ): Promise<Record<string, number>> {
    try {
      const stats = await this.prisma.messageLog.groupBy({
        by: ['status'],
        where: {
          campaignId,
          messageDate: {
            gte: startOfDay(date),
            lte: endOfDay(date),
          },
        },
        _count: {
          status: true,
        },
      });

      return stats.reduce(
        (acc, curr) => ({
          ...acc,
          [curr.status]: curr._count.status,
        }),
        {} as Record<string, number>,
      );
    } catch (error) {
      logger.error('Erro ao obter estatísticas diárias:', error);
      throw new Error('Erro ao calcular estatísticas diárias');
    }
  }

  public async getDetailedReport(
    campaignId: string,
    startDate: Date,
    endDate: Date,
  ) {
    try {
      return await this.prisma.messageLog.findMany({
        where: {
          campaignId,
          messageDate: {
            gte: startOfDay(startDate),
            lte: endOfDay(endDate),
          },
        },
        select: {
          messageId: true,
          messageDate: true,
          status: true,
          sentAt: true,
          deliveredAt: true,
          readAt: true,
          failedAt: true,
          failureReason: true,
          lead: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
        orderBy: {
          messageDate: 'asc',
        },
      });
    } catch (error) {
      logger.error('Erro ao gerar relatório detalhado:', error);
      throw new Error('Erro ao gerar relatório');
    }
  }

  async processUnreadMessages(): Promise<void> {
    await unreadMessageHandler.processUnreadMessages();
  }

  async segmentLeads(): Promise<void> {
    await leadSegmentationService.segmentLeads();
  }

  public async getLeadCountBySegmentation(
    campaignId: string,
    segmentation: string,
  ): Promise<number> {
    try {
      const count = await this.prisma.campaignLead.count({
        where: {
          campaignId,
          segment: segmentation,
        },
      });
      logger.log(`Contagem de leads (serviço): ${count}`);
      return count;
    } catch (error) {
      logger.error(
        'Erro ao buscar contagem de leads por segmentação:',
        error,
      );
      throw error;
    }
  }
}

export const campaignService = new CampaignService();
