// src/services/instance-rotation.service.ts
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export interface InstanceRotationConfig {
  useRotation: boolean;
  strategy: 'RANDOM' | 'SEQUENTIAL' | 'LOAD_BALANCED';
  maxMessagesPerInstance?: number;
}

export interface AvailableInstance {
  id: string;
  instanceName: string;
  priority: number;
  messagesSent: number;
  maxMessages?: number;
  lastUsedAt?: Date;
  isActive: boolean;
}

export class InstanceRotationService {
  private rotationLogger = logger.setContext('InstanceRotation');

  /**
   * Adiciona instâncias a uma campanha
   */
  public async addInstancesToCampaign(
    campaignId: string,
    instanceIds: string[],
    config: InstanceRotationConfig,
  ): Promise<void> {
    try {
      this.rotationLogger.info(
        `Adicionando ${instanceIds.length} instâncias à campanha ${campaignId}`,
      );

      // Verificar se as instâncias existem e estão conectadas
      const instances = await prisma.instance.findMany({
        where: {
          id: { in: instanceIds },
          connectionStatus: 'CONNECTED',
        },
        select: {
          id: true,
          instanceName: true,
        },
      });

      if (instances.length === 0) {
        throw new Error('Nenhuma instância conectada encontrada');
      }

      if (instances.length !== instanceIds.length) {
        this.rotationLogger.warn(
          `Apenas ${instances.length} de ${instanceIds.length} instâncias estão conectadas`,
        );
      }

      // Atualizar configuração da campanha
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          useInstanceRotation: config.useRotation,
          rotationStrategy: config.strategy,
          maxMessagesPerInstance: config.maxMessagesPerInstance,
        },
      });

      // Adicionar instâncias à campanha
      const campaignInstances = instances.map((instance, index) => ({
        campaignId,
        instanceId: instance.id,
        instanceName: instance.instanceName,
        priority: index,
        isActive: true,
        maxMessages: config.maxMessagesPerInstance,
      }));

      await prisma.campaignInstance.createMany({
        data: campaignInstances,
        skipDuplicates: true,
      });

      this.rotationLogger.info(
        `${campaignInstances.length} instâncias adicionadas com sucesso`,
      );
    } catch (error) {
      this.rotationLogger.error(
        'Erro ao adicionar instâncias:',
        error,
      );
      throw error;
    }
  }

  /**
   * Remove instâncias de uma campanha
   */
  public async removeInstancesFromCampaign(
    campaignId: string,
    instanceIds: string[],
  ): Promise<void> {
    try {
      this.rotationLogger.info(
        `Removendo ${instanceIds.length} instâncias da campanha ${campaignId}`,
      );

      await prisma.campaignInstance.deleteMany({
        where: {
          campaignId,
          instanceId: { in: instanceIds },
        },
      });

      this.rotationLogger.info('Instâncias removidas com sucesso');
    } catch (error) {
      this.rotationLogger.error('Erro ao remover instâncias:', error);
      throw error;
    }
  }

  /**
   * Obtém a próxima instância disponível baseada na estratégia de rotação
   */
  public async getNextAvailableInstance(
    campaignId: string,
  ): Promise<AvailableInstance | null> {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          campaignInstances: {
            where: { isActive: true },
            include: {
              instance: {
                select: {
                  id: true,
                  instanceName: true,
                  connectionStatus: true,
                },
              },
            },
            orderBy: { priority: 'asc' },
          },
        },
      });

      if (!campaign || !campaign.useInstanceRotation) {
        return null;
      }

      const availableInstances = campaign.campaignInstances.filter(
        (ci) => ci.instance.connectionStatus === 'CONNECTED',
      );

      if (availableInstances.length === 0) {
        this.rotationLogger.warn(
          `Nenhuma instância disponível para campanha ${campaignId}`,
        );
        return null;
      }

      // Filtrar instâncias que não atingiram o limite de mensagens
      const eligibleInstances = availableInstances.filter((ci) => {
        if (!ci.maxMessages) return true;
        return ci.messagesSent < ci.maxMessages;
      });

      if (eligibleInstances.length === 0) {
        this.rotationLogger.warn(
          `Todas as instâncias atingiram o limite de mensagens para campanha ${campaignId}`,
        );
        return null;
      }

      let selectedInstance: (typeof eligibleInstances)[0];

      switch (campaign.rotationStrategy) {
        case 'RANDOM':
          selectedInstance =
            this.selectRandomInstance(eligibleInstances);
          break;

        case 'SEQUENTIAL':
          selectedInstance =
            this.selectSequentialInstance(eligibleInstances);
          break;

        case 'LOAD_BALANCED':
          selectedInstance =
            this.selectLoadBalancedInstance(eligibleInstances);
          break;

        default:
          selectedInstance =
            this.selectRandomInstance(eligibleInstances);
      }

      // Atualizar contador de mensagens e último uso
      await prisma.campaignInstance.update({
        where: { id: selectedInstance.id },
        data: {
          messagesSent: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });

      this.rotationLogger.info(
        `Instância selecionada: ${selectedInstance.instanceName} (estratégia: ${campaign.rotationStrategy})`,
      );

      return {
        id: selectedInstance.instanceId,
        instanceName: selectedInstance.instanceName,
        priority: selectedInstance.priority,
        messagesSent: selectedInstance.messagesSent + 1,
        maxMessages: selectedInstance.maxMessages,
        lastUsedAt: selectedInstance.lastUsedAt,
        isActive: selectedInstance.isActive,
      };
    } catch (error) {
      this.rotationLogger.error(
        'Erro ao obter próxima instância:',
        error,
      );
      throw error;
    }
  }

  /**
   * Seleciona uma instância aleatoriamente
   */
  private selectRandomInstance(instances: any[]): any {
    const randomIndex = Math.floor(Math.random() * instances.length);
    return instances[randomIndex];
  }

  /**
   * Seleciona a próxima instância na sequência
   */
  private selectSequentialInstance(instances: any[]): any {
    // Ordenar por último uso (mais antigo primeiro)
    const sortedInstances = instances.sort((a, b) => {
      if (!a.lastUsedAt && !b.lastUsedAt) return 0;
      if (!a.lastUsedAt) return -1;
      if (!b.lastUsedAt) return 1;
      return a.lastUsedAt.getTime() - b.lastUsedAt.getTime();
    });

    return sortedInstances[0];
  }

  /**
   * Seleciona a instância com menor carga (menos mensagens enviadas)
   */
  private selectLoadBalancedInstance(instances: any[]): any {
    return instances.reduce((min, current) => {
      return current.messagesSent < min.messagesSent ? current : min;
    });
  }

  /**
   * Obtém estatísticas de uso das instâncias de uma campanha
   */
  public async getCampaignInstanceStats(campaignId: string): Promise<{
    totalInstances: number;
    activeInstances: number;
    connectedInstances: number;
    totalMessagesSent: number;
    instances: Array<{
      instanceName: string;
      messagesSent: number;
      maxMessages?: number;
      lastUsedAt?: Date;
      isActive: boolean;
      connectionStatus: string;
    }>;
  }> {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          campaignInstances: {
            include: {
              instance: {
                select: {
                  instanceName: true,
                  connectionStatus: true,
                },
              },
            },
            orderBy: { priority: 'asc' },
          },
        },
      });

      if (!campaign) {
        throw new Error('Campanha não encontrada');
      }

      const instances = campaign.campaignInstances;
      const totalInstances = instances.length;
      const activeInstances = instances.filter(
        (ci) => ci.isActive,
      ).length;
      const connectedInstances = instances.filter(
        (ci) =>
          ci.isActive && ci.instance.connectionStatus === 'CONNECTED',
      ).length;
      const totalMessagesSent = instances.reduce(
        (sum, ci) => sum + ci.messagesSent,
        0,
      );

      return {
        totalInstances,
        activeInstances,
        connectedInstances,
        totalMessagesSent,
        instances: instances.map((ci) => ({
          instanceName: ci.instanceName,
          messagesSent: ci.messagesSent,
          maxMessages: ci.maxMessages,
          lastUsedAt: ci.lastUsedAt,
          isActive: ci.isActive,
          connectionStatus: ci.instance.connectionStatus,
        })),
      };
    } catch (error) {
      this.rotationLogger.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Reseta contadores de mensagens de uma campanha
   */
  public async resetCampaignInstanceCounters(
    campaignId: string,
  ): Promise<void> {
    try {
      this.rotationLogger.info(
        `Resetando contadores da campanha ${campaignId}`,
      );

      await prisma.campaignInstance.updateMany({
        where: { campaignId },
        data: {
          messagesSent: 0,
          lastUsedAt: null,
        },
      });

      this.rotationLogger.info('Contadores resetados com sucesso');
    } catch (error) {
      this.rotationLogger.error('Erro ao resetar contadores:', error);
      throw error;
    }
  }

  /**
   * Ativa/desativa uma instância específica
   */
  public async toggleInstanceStatus(
    campaignId: string,
    instanceId: string,
    isActive: boolean,
  ): Promise<void> {
    try {
      this.rotationLogger.info(
        `${
          isActive ? 'Ativando' : 'Desativando'
        } instância ${instanceId} na campanha ${campaignId}`,
      );

      await prisma.campaignInstance.update({
        where: {
          campaignId_instanceId: {
            campaignId,
            instanceId,
          },
        },
        data: { isActive },
      });

      this.rotationLogger.info(
        'Status da instância atualizado com sucesso',
      );
    } catch (error) {
      this.rotationLogger.error(
        'Erro ao atualizar status da instância:',
        error,
      );
      throw error;
    }
  }
}

export const instanceRotationService = new InstanceRotationService();
