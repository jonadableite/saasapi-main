// src/services/auto-account.service.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { logger } from '../utils/logger';
import { welcomeService } from './welcome.service';

const prisma = new PrismaClient();

export interface PaymentConfirmationData {
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  paymentValue: number;
  paymentStatus: string;
  subscriptionStatus?: string;
  productId?: string;
  productName?: string;
  transactionId?: string;
  subscriberCode?: string;
  source: 'hotmart' | 'stripe' | 'manual';
}

export class AutoAccountService {
  /**
   * Cria automaticamente uma conta quando um pagamento é confirmado
   */
  async createAccountFromPayment(paymentData: PaymentConfirmationData) {
    try {
      logger.info('Iniciando criação automática de conta:', {
        email: paymentData.customerEmail,
        source: paymentData.source,
        value: paymentData.paymentValue,
      });

      // Verificar se já existe um usuário
      const existingUser = await prisma.user.findUnique({
        where: { email: paymentData.customerEmail },
      });

      if (existingUser) {
        logger.info('Usuário já existe, atualizando informações:', existingUser.email);
        await this.updateExistingUser(existingUser.id, paymentData);
        return existingUser;
      }

      // Criar nova conta
      const newUser = await this.createNewUser(paymentData);

      // Enviar boas-vindas
      await this.sendWelcomeMessage(newUser, paymentData);

      logger.info('Conta criada com sucesso:', {
        userId: newUser.id,
        email: newUser.email,
        plan: newUser.plan,
      });

      return newUser;
    } catch (error) {
      logger.error('Erro ao criar conta automaticamente:', error);
      throw error;
    }
  }

  /**
   * Cria um novo usuário no sistema
   */
  private async createNewUser(paymentData: PaymentConfirmationData) {
    // Criar hash da senha (email como senha inicial)
    const hashedPassword = await bcrypt.hash(paymentData.customerEmail, 10);

    // Criar empresa para o usuário
    const company = await prisma.company.create({
      data: {
        name: `${paymentData.customerName}'s Company`,
        active: true,
      },
    });

    // Determinar plano baseado no valor do pagamento
    const plan = this.determinePlanFromValue(paymentData.paymentValue);
    const planLimits = this.getPlanLimits(plan);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name: paymentData.customerName,
        email: paymentData.customerEmail,
        password: hashedPassword,
        phone: paymentData.customerPhone || '',
        profile: 'user',
        plan: plan,
        whatleadCompanyId: company.id,
        role: 'user',
        maxInstances: planLimits.maxInstances,
        messagesPerDay: planLimits.messagesPerDay,
        features: planLimits.features,
        support: planLimits.support,
        active: true,
        status: true,
        // Configurar trial se necessário
        trialEndDate: paymentData.subscriptionStatus === 'TRIAL' ?
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
      },
    });

    // Se for cliente Hotmart, atualizar a tabela de clientes
    if (paymentData.source === 'hotmart' && paymentData.subscriberCode) {
      await this.updateHotmartCustomer(user.id, paymentData);
    }

    return user;
  }

  /**
   * Atualiza usuário existente com novas informações
   */
  private async updateExistingUser(userId: string, paymentData: PaymentConfirmationData) {
    const plan = this.determinePlanFromValue(paymentData.paymentValue);
    const planLimits = this.getPlanLimits(plan);

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: plan,
        maxInstances: planLimits.maxInstances,
        messagesPerDay: planLimits.messagesPerDay,
        features: planLimits.features,
        support: planLimits.support,
        updatedAt: new Date(),
      },
    });

    // Se for cliente Hotmart, atualizar a tabela de clientes
    if (paymentData.source === 'hotmart' && paymentData.subscriberCode) {
      await this.updateHotmartCustomer(userId, paymentData);
    }
  }

  /**
   * Atualiza cliente Hotmart com o ID do usuário Whatlead
   */
  private async updateHotmartCustomer(whatleadUserId: string, paymentData: PaymentConfirmationData) {
    try {
      await prisma.hotmartCustomer.updateMany({
        where: {
          subscriberCode: paymentData.subscriberCode,
          customerEmail: paymentData.customerEmail,
        },
        data: {
          whatleadUserId: whatleadUserId,
          lastActivityDate: new Date(),
          paymentStatus: paymentData.paymentStatus,
          subscriptionStatus: paymentData.subscriptionStatus || 'ACTIVE',
        },
      });
    } catch (error) {
      logger.error('Erro ao atualizar cliente Hotmart:', error);
    }
  }

  /**
   * Envia mensagem de boas-vindas
   */
  private async sendWelcomeMessage(user: any, paymentData: PaymentConfirmationData) {
    try {
      await welcomeService.sendWelcomeMessage({
        name: user.name,
        email: user.email,
        login: user.email,
        password: user.email, // Senha inicial é o email
        phone: user.phone,
      });

      logger.info('Mensagem de boas-vindas enviada para:', user.email);
    } catch (error) {
      logger.error('Erro ao enviar mensagem de boas-vindas:', error);
    }
  }

  /**
   * Determina o plano baseado no valor do pagamento
   */
  private determinePlanFromValue(value: number): string {
    if (value >= 299) return 'scale';
    if (value >= 97) return 'pro';
    if (value >= 49) return 'basic';
    return 'free';
  }

  /**
   * Retorna os limites do plano
   */
  private getPlanLimits(plan: string) {
    const limits = {
      free: {
        maxInstances: 1,
        messagesPerDay: 20,
        features: ['TEXT'],
        support: 'basic',
      },
      basic: {
        maxInstances: 2,
        messagesPerDay: 50,
        features: ['TEXT', 'IMAGE'],
        support: 'basic',
      },
      pro: {
        maxInstances: 5,
        messagesPerDay: 100,
        features: ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO'],
        support: 'priority',
      },
      scale: {
        maxInstances: 15,
        messagesPerDay: 500,
        features: ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'STICKER'],
        support: 'premium',
      },
    };

    return limits[plan as keyof typeof limits] || limits.free;
  }

  /**
   * Verifica se um email já possui conta no sistema
   */
  async checkAccountExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return !!user;
  }

  /**
   * Obtém informações da conta por email
   */
  async getAccountByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
        instances: {
          select: {
            id: true,
            instanceName: true,
            connectionStatus: true,
          },
        },
      },
    });
  }
}

export const autoAccountService = new AutoAccountService();