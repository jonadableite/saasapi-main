// src/services/hotmart.service.ts
import type { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { logger } from '../utils/logger';
import { welcomeService } from './welcome.service';

const prisma = new PrismaClient();

// Interfaces para os tipos de dados
interface HotmartWebhookData {
  event: string;
  eventDate: string;
  data: {
    transaction: string;
    subscriberCode?: string;
    productId: string;
    productName: string;
    customer: {
      name: string;
      email: string;
      document?: string;
      phone?: string;
      address?: {
        country?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        address?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
      };
    };
    payment: {
      type?: string;
      method?: string;
      status: string;
      value: number;
      currency: string;
      installments?: number;
      totalInstallments?: number;
    };
    subscription?: {
      status: string;
      frequency?: string;
      startDate?: string;
      endDate?: string;
      nextChargeDate?: string;
      cancelationDate?: string;
      cancelationReason?: string;
    };
    affiliate?: {
      code?: string;
      name?: string;
      commissionValue?: number;
      commissionPercentage?: number;
    };
    producer?: {
      code?: string;
      name?: string;
      value?: number;
      percentage?: number;
    };
    platform?: {
      value?: number;
      percentage?: number;
    };
  };
}

interface HotmartApiResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

interface HotmartSubscription {
  subscriberCode: string;
  status: string;
  productId: string;
  productName: string;
  subscriber: {
    name: string;
    email: string;
    document?: string;
    phone?: string;
    userId?: string;
    address?: {
      country?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      address?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
    };
  };
  payment: {
    type?: string;
    method?: string;
    status: string;
    value: number;
    currency: string;
  };
  subscription: {
    status: string;
    frequency?: string;
    startDate?: string;
    endDate?: string;
    nextChargeDate?: string;
    cancelationDate?: string;
    cancelationReason?: string;
  };
  affiliate?: {
    code?: string;
    name?: string;
    commissionValue?: number;
    commissionPercentage?: number;
  };
  producer?: {
    code?: string;
    name?: string;
    value?: number;
    percentage?: number;
  };
  platform?: {
    value?: number;
    percentage?: number;
  };
}

interface HotmartTransaction {
  transaction: string;
  subscriberCode: string;
  productId: string;
  transactionType: string;
  transactionStatus: string;
  transactionValue: number;
  transactionCurrency: string;
  paymentType?: string;
  paymentMethod?: string;
  paymentStatus: string;
  paymentDate?: string;
  dueDate?: string;
  refundDate?: string;
  refundValue?: number;
  refundReason?: string;
  chargebackDate?: string;
  chargebackValue?: number;
  chargebackReason?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  affiliateCode?: string;
  affiliateName?: string;
  commissionValue?: number;
  commissionPercentage?: number;
  producerCode?: string;
  producerName?: string;
  producerValue?: number;
  producerPercentage?: number;
  platformValue?: number;
  platformPercentage?: number;
}

interface HotmartUser {
  userId: string;
  name: string;
  email: string;
  document?: string;
  phone?: string;
  address?: {
    country?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    address?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
  };
}

export class HotmartService {
  private apiBaseUrl = 'https://api-sec-vlc.hotmart.com';
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.clientId = process.env.HOTMART_CLIENT_ID || '';
    this.clientSecret = process.env.HOTMART_CLIENT_SECRET || '';
  }

  /**
   * Autentica na API da Hotmart e obtém o access token
   */
  private async authenticate(): Promise<string> {
    try {
      // Verificar se já temos um token válido
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.accessToken;
      }

      const response = await axios.post(
        `${this.apiBaseUrl}/security/oauth/token`,
        {
          grant_type: 'client_credentials',
          client_id: this.clientId,
          client_secret: this.clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));

      logger.info('Autenticação na API Hotmart realizada com sucesso');
      return this.accessToken;
    } catch (error) {
      logger.error('Erro na autenticação da API Hotmart:', error);
      throw new Error('Falha na autenticação com a API Hotmart');
    }
  }

  /**
   * Faz uma requisição autenticada para a API da Hotmart
   */
  private async makeAuthenticatedRequest(endpoint: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    try {
      const token = await this.authenticate();

      const response = await axios.get(`${this.apiBaseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        params,
      });

      return response.data;
    } catch (error) {
      logger.error(`Erro na requisição para ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Processa webhook da Hotmart
   */
  async processWebhook(webhookData: HotmartWebhookData, hottok: string): Promise<HotmartApiResponse> {
    try {
      // Validar hottok
      const expectedHottok = process.env.HOTMART_WEBHOOK_TOKEN || process.env.HOTMART_WEBHOOK_TOKENHOTMART_WEBHOOK_TOKEN;
      if (hottok !== expectedHottok) {
        logger.error('Hottok inválido recebido no webhook');
        logger.error(`Esperado: ${expectedHottok}`);
        logger.error(`Recebido: ${hottok}`);
        throw new Error('Hottok inválido');
      }

      logger.info(`Processando webhook: ${webhookData.event}`, {
        transaction: webhookData.data.transaction,
        subscriberCode: webhookData.data.subscriberCode,
      });

      // Registrar evento
      const event = await this.registerEvent(webhookData);

      // Processar evento baseado no tipo
      switch (webhookData.event) {
        case 'PURCHASE_APPROVED':
          await this.handlePurchaseApproved(webhookData.data as HotmartWebhookData['data']);
          break;
        case 'SUBSCRIPTION_CANCELLED':
          await this.handleSubscriptionCancelled(webhookData.data as HotmartWebhookData['data']);
          break;
        case 'SUBSCRIPTION_CHANGED':
          await this.handleSubscriptionChanged(webhookData.data as HotmartWebhookData['data']);
          break;
        case 'SUBSCRIPTION_BILLING_DATE_UPDATED':
          await this.handleSubscriptionBillingDateUpdated(webhookData.data as HotmartWebhookData['data']);
          break;
        case 'PURCHASE_CANCELLED':
          await this.handlePurchaseCancelled(webhookData.data as HotmartWebhookData['data']);
          break;
        case 'PURCHASE_REFUNDED':
          await this.handlePurchaseRefunded(webhookData.data as HotmartWebhookData['data']);
          break;
        case 'CHARGEBACK':
          await this.handleChargeback(webhookData.data as HotmartWebhookData['data']);
          break;
        case 'PURCHASE_EXPIRED':
          await this.handlePurchaseExpired(webhookData.data as HotmartWebhookData['data']);
          break;
        case 'PURCHASE_DELAYED':
          await this.handlePurchaseDelayed(webhookData.data as HotmartWebhookData['data']);
          break;
        case 'CART_ABANDONED':
          await this.handleCartAbandoned(webhookData.data as HotmartWebhookData['data']);
          break;
        default:
          logger.warn(`Evento não tratado: ${webhookData.event}`);
      }

      return {
        success: true,
        data: { eventId: event.id },
      };
    } catch (error) {
      logger.error('Erro ao processar webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Registra evento no banco de dados
   */
  private async registerEvent(webhookData: HotmartWebhookData) {
    // Validar e converter a data do evento
    let eventDate: Date;
    try {
      eventDate = new Date(webhookData.eventDate);
      // Verificar se a data é válida
      if (isNaN(eventDate.getTime())) {
        logger.warn('Data do evento inválida, usando data atual:', webhookData.eventDate);
        eventDate = new Date();
      }
    } catch (error) {
      logger.warn('Erro ao converter data do evento, usando data atual:', webhookData.eventDate);
      eventDate = new Date();
    }

    return await prisma.hotmartEvent.create({
      data: {
        eventType: webhookData.event,
        eventData: webhookData as unknown as Prisma.InputJsonValue,
        eventDate: eventDate,
        transaction: webhookData.data.transaction,
        subscriberCode: webhookData.data.subscriberCode,
        productId: webhookData.data.productId,
        status: 'PENDING',
      },
    });
  }

  /**
   * Processa compra aprovada
   */
  private async handlePurchaseApproved(data: HotmartWebhookData['data']) {
    try {
      logger.info('Processando compra aprovada:', data.transaction);

      // Verificar se já existe um cliente com este subscriber_code
      let customer = await prisma.hotmartCustomer.findUnique({
        where: { subscriberCode: data.subscriberCode },
      });

      if (customer) {
        // Atualizar cliente existente
        customer = await prisma.hotmartCustomer.update({
          where: { id: customer.id },
          data: {
            transaction: data.transaction,
            paymentStatus: data.payment.status,
            subscriptionStatus: data.subscription?.status || 'ACTIVE',
            subscriptionValue: data.payment.value,
            subscriptionCurrency: data.payment.currency,
            subscriptionFrequency: data.subscription?.frequency,
            subscriptionStartDate: data.subscription?.startDate ? new Date(data.subscription.startDate) : null,
            subscriptionEndDate: data.subscription?.endDate ? new Date(data.subscription.endDate) : null,
            nextChargeDate: data.subscription?.nextChargeDate ? new Date(data.subscription.nextChargeDate) : null,
            isActive: true,
            updatedAt: new Date(),
          },
        });
      } else {
        // Criar novo cliente
        customer = await prisma.hotmartCustomer.create({
          data: {
            subscriberCode: data.subscriberCode,
            transaction: data.transaction,
            productId: data.productId,
            productName: data.productName,
            customerName: data.customer.name,
            customerEmail: data.customer.email,
            customerPhone: data.customer.phone,
            customerDocument: data.customer.document,
            customerCountry: data.customer.address?.country,
            customerCity: data.customer.address?.city,
            customerState: data.customer.address?.state,
            customerZipCode: data.customer.address?.zipCode,
            customerAddress: data.customer.address?.address,
            customerNumber: data.customer.address?.number,
            customerComplement: data.customer.address?.complement,
            customerNeighborhood: data.customer.address?.neighborhood,
            paymentType: data.payment.type,
            paymentMethod: data.payment.method,
            paymentStatus: data.payment.status,
            subscriptionStatus: data.subscription?.status || 'ACTIVE',
            subscriptionValue: data.payment.value,
            subscriptionCurrency: data.payment.currency,
            subscriptionFrequency: data.subscription?.frequency,
            subscriptionStartDate: data.subscription?.startDate ? new Date(data.subscription.startDate) : null,
            subscriptionEndDate: data.subscription?.endDate ? new Date(data.subscription.endDate) : null,
            nextChargeDate: data.subscription?.nextChargeDate ? new Date(data.subscription.nextChargeDate) : null,
            affiliateCode: data.affiliate?.code,
            affiliateName: data.affiliate?.name,
            producerCode: data.producer?.code,
            producerName: data.producer?.name,
            isActive: true,
            isTrial: data.subscription?.status === 'TRIAL',
            trialEndDate: data.subscription?.status === 'TRIAL' ? new Date(data.subscription.endDate) : null,
          },
        });

        // Enriquecer dados do cliente via API
        await this.enrichCustomerData(customer.id, data.subscriberCode);

        // Enviar boas-vindas
        await this.sendWelcomeMessage(customer);
      }

      // Registrar transação
      await this.registerTransaction(data, customer.id);

      logger.info('Compra aprovada processada com sucesso');
    } catch (error) {
      logger.error('Erro ao processar compra aprovada:', error);
      throw error;
    }
  }

  /**
   * Processa cancelamento de assinatura
   */
  private async handleSubscriptionCancelled(data: HotmartWebhookData['data']) {
    try {
      logger.info('Processando cancelamento de assinatura:', data.subscriberCode);

      const customer = await prisma.hotmartCustomer.findUnique({
        where: { subscriberCode: data.subscriberCode },
      });

      if (customer) {
        await prisma.hotmartCustomer.update({
          where: { id: customer.id },
          data: {
            subscriptionStatus: 'CANCELLED',
            cancelationDate: data.subscription?.cancelationDate ? new Date(data.subscription.cancelationDate) : new Date(),
            cancelationReason: data.subscription?.cancelationReason,
            isActive: false,
            updatedAt: new Date(),
          },
        });

        // Bloquear acesso do usuário se existir
        if (customer.whatleadUserId) {
          await prisma.user.update({
            where: { id: customer.whatleadUserId },
            data: { active: false },
          });
        }
      }

      logger.info('Cancelamento de assinatura processado com sucesso');
    } catch (error) {
      logger.error('Erro ao processar cancelamento de assinatura:', error);
      throw error;
    }
  }

  /**
   * Processa troca de plano
   */
  private async handleSubscriptionChanged(data: HotmartWebhookData['data']) {
    try {
      logger.info('Processando troca de plano:', data.subscriberCode);

      const customer = await prisma.hotmartCustomer.findUnique({
        where: { subscriberCode: data.subscriberCode },
      });

      if (customer) {
        await prisma.hotmartCustomer.update({
          where: { id: customer.id },
          data: {
            productId: data.productId,
            productName: data.productName,
            subscriptionValue: data.payment.value,
            subscriptionCurrency: data.payment.currency,
            subscriptionFrequency: data.subscription?.frequency,
            subscriptionStartDate: data.subscription?.startDate ? new Date(data.subscription.startDate) : null,
            subscriptionEndDate: data.subscription?.endDate ? new Date(data.subscription.endDate) : null,
            nextChargeDate: data.subscription?.nextChargeDate ? new Date(data.subscription.nextChargeDate) : null,
            updatedAt: new Date(),
          },
        });
      }

      logger.info('Troca de plano processada com sucesso');
    } catch (error) {
      logger.error('Erro ao processar troca de plano:', error);
      throw error;
    }
  }

  /**
   * Processa atualização de data de cobrança
   */
  private async handleSubscriptionBillingDateUpdated(data: HotmartWebhookData['data']) {
    try {
      logger.info('Processando atualização de data de cobrança:', data.subscriberCode);

      const customer = await prisma.hotmartCustomer.findUnique({
        where: { subscriberCode: data.subscriberCode },
      });

      if (customer) {
        await prisma.hotmartCustomer.update({
          where: { id: customer.id },
          data: {
            nextChargeDate: data.subscription?.nextChargeDate ? new Date(data.subscription.nextChargeDate) : null,
            updatedAt: new Date(),
          },
        });
      }

      logger.info('Atualização de data de cobrança processada com sucesso');
    } catch (error) {
      logger.error('Erro ao processar atualização de data de cobrança:', error);
      throw error;
    }
  }

  /**
   * Processa compra cancelada
   */
  private async handlePurchaseCancelled(data: HotmartWebhookData['data']) {
    try {
      logger.info('Processando compra cancelada:', data.transaction);

      const customer = await prisma.hotmartCustomer.findFirst({
        where: { transaction: data.transaction },
      });

      if (customer) {
        await prisma.hotmartCustomer.update({
          where: { id: customer.id },
          data: {
            paymentStatus: 'CANCELLED',
            subscriptionStatus: 'CANCELLED',
            isActive: false,
            updatedAt: new Date(),
          },
        });
      }

      logger.info('Compra cancelada processada com sucesso');
    } catch (error) {
      logger.error('Erro ao processar compra cancelada:', error);
      throw error;
    }
  }

  /**
   * Processa reembolso
   */
  private async handlePurchaseRefunded(data: HotmartWebhookData['data']) {
    try {
      logger.info('Processando reembolso:', data.transaction);

      const customer = await prisma.hotmartCustomer.findFirst({
        where: { transaction: data.transaction },
      });

      if (customer) {
        await prisma.hotmartCustomer.update({
          where: { id: customer.id },
          data: {
            paymentStatus: 'REFUNDED',
            updatedAt: new Date(),
          },
        });
      }

      logger.info('Reembolso processado com sucesso');
    } catch (error) {
      logger.error('Erro ao processar reembolso:', error);
      throw error;
    }
  }

  /**
   * Processa chargeback
   */
  private async handleChargeback(data: HotmartWebhookData['data']) {
    try {
      logger.info('Processando chargeback:', data.transaction);

      const customer = await prisma.hotmartCustomer.findFirst({
        where: { transaction: data.transaction },
      });

      if (customer) {
        await prisma.hotmartCustomer.update({
          where: { id: customer.id },
          data: {
            paymentStatus: 'CHARGEBACK',
            updatedAt: new Date(),
          },
        });
      }

      logger.info('Chargeback processado com sucesso');
    } catch (error) {
      logger.error('Erro ao processar chargeback:', error);
      throw error;
    }
  }

  /**
   * Processa compra expirada
   */
  private async handlePurchaseExpired(data: HotmartWebhookData['data']) {
    try {
      logger.info('Processando compra expirada:', data.transaction);

      const customer = await prisma.hotmartCustomer.findFirst({
        where: { transaction: data.transaction },
      });

      if (customer) {
        await prisma.hotmartCustomer.update({
          where: { id: customer.id },
          data: {
            paymentStatus: 'EXPIRED',
            subscriptionStatus: 'EXPIRED',
            isActive: false,
            updatedAt: new Date(),
          },
        });
      }

      logger.info('Compra expirada processada com sucesso');
    } catch (error) {
      logger.error('Erro ao processar compra expirada:', error);
      throw error;
    }
  }

  /**
   * Processa compra atrasada
   */
  private async handlePurchaseDelayed(data: HotmartWebhookData['data']) {
    try {
      logger.info('Processando compra atrasada:', data.transaction);

      const customer = await prisma.hotmartCustomer.findFirst({
        where: { transaction: data.transaction },
      });

      if (customer) {
        await prisma.hotmartCustomer.update({
          where: { id: customer.id },
          data: {
            paymentStatus: 'DELAYED',
            subscriptionStatus: 'DELAYED',
            updatedAt: new Date(),
          },
        });
      }

      logger.info('Compra atrasada processada com sucesso');
    } catch (error) {
      logger.error('Erro ao processar compra atrasada:', error);
      throw error;
    }
  }

  /**
   * Processa abandono de carrinho
   */
  private async handleCartAbandoned(data: HotmartWebhookData['data']) {
    try {
      logger.info('Processando abandono de carrinho:', data.transaction);

      // Registrar evento de abandono para análise
      await prisma.hotmartEvent.create({
        data: {
          eventType: 'CART_ABANDONED',
          eventData: data as unknown as Prisma.InputJsonValue,
          eventDate: new Date(),
          transaction: data.transaction,
          productId: data.productId,
          status: 'PROCESSED',
        },
      });

      logger.info('Abandono de carrinho processado com sucesso');
    } catch (error) {
      logger.error('Erro ao processar abandono de carrinho:', error);
      throw error;
    }
  }

  /**
   * Enriquece dados do cliente via API da Hotmart
   */
  private async enrichCustomerData(customerId: string, subscriberCode: string) {
    try {
      logger.info('Enriquecendo dados do cliente:', subscriberCode);

      // Buscar dados da assinatura
      const subscriptionData = await this.getSubscriptionDetails(subscriberCode);
      if (subscriptionData) {
        await prisma.hotmartCustomer.update({
          where: { id: customerId },
          data: {
            hotmartUserId: subscriptionData.subscriber?.userId,
            hotmartUserEmail: subscriptionData.subscriber?.email,
            hotmartUserName: subscriptionData.subscriber?.name,
            hotmartUserPhone: subscriptionData.subscriber?.phone,
            hotmartUserDocument: subscriptionData.subscriber?.document,
            hotmartUserCountry: subscriptionData.subscriber?.address?.country,
            hotmartUserCity: subscriptionData.subscriber?.address?.city,
            hotmartUserState: subscriptionData.subscriber?.address?.state,
            hotmartUserZipCode: subscriptionData.subscriber?.address?.zipCode,
            hotmartUserAddress: subscriptionData.subscriber?.address?.address,
            hotmartUserNumber: subscriptionData.subscriber?.address?.number,
            hotmartUserComplement: subscriptionData.subscriber?.address?.complement,
            hotmartUserNeighborhood: subscriptionData.subscriber?.address?.neighborhood,
            updatedAt: new Date(),
          },
        });
      }

      // Buscar dados do usuário se houver user_id
      if (subscriptionData?.subscriber?.userId) {
        const userData = await this.getUserDetails(subscriptionData.subscriber.userId);
        if (userData) {
          await prisma.hotmartCustomer.update({
            where: { id: customerId },
            data: {
              hotmartUserEmail: userData.email,
              hotmartUserName: userData.name,
              hotmartUserPhone: userData.phone,
              hotmartUserDocument: userData.document,
              hotmartUserCountry: userData.address?.country,
              hotmartUserCity: userData.address?.city,
              hotmartUserState: userData.address?.state,
              hotmartUserZipCode: userData.address?.zipCode,
              hotmartUserAddress: userData.address?.address,
              hotmartUserNumber: userData.address?.number,
              hotmartUserComplement: userData.address?.complement,
              hotmartUserNeighborhood: userData.address?.neighborhood,
              updatedAt: new Date(),
            },
          });
        }
      }

      logger.info('Dados do cliente enriquecidos com sucesso');
    } catch (error) {
      logger.error('Erro ao enriquecer dados do cliente:', error);
      // Não lançar erro para não interromper o fluxo principal
    }
  }

  /**
   * Registra transação no banco de dados
   */
  private async registerTransaction(data: HotmartWebhookData['data'], customerId: string) {
    try {
      await prisma.hotmartTransaction.create({
        data: {
          transactionId: data.transaction,
          subscriberCode: data.subscriberCode,
          productId: data.productId,
          transactionType: 'PURCHASE',
          transactionStatus: 'APPROVED',
          transactionValue: data.payment.value,
          transactionCurrency: data.payment.currency,
          paymentType: data.payment.type,
          paymentMethod: data.payment.method,
          paymentStatus: data.payment.status,
          paymentDate: new Date(),
          installmentNumber: data.payment.installments,
          totalInstallments: data.payment.totalInstallments,
          affiliateCode: data.affiliate?.code,
          affiliateName: data.affiliate?.name,
          commissionValue: data.affiliate?.commissionValue,
          commissionPercentage: data.affiliate?.commissionPercentage,
          producerCode: data.producer?.code,
          producerName: data.producer?.name,
          producerValue: data.producer?.value,
          producerPercentage: data.producer?.percentage,
          platformValue: data.platform?.value,
          platformPercentage: data.platform?.percentage,
          customerId,
        },
      });
    } catch (error) {
      logger.error('Erro ao registrar transação:', error);
      throw error;
    }
  }

  /**
   * Envia mensagem de boas-vindas
   */
  private async sendWelcomeMessage(customer: any) {
    try {
      // Verificar se já existe um usuário no sistema Whatlead
      let whatleadUser = await prisma.user.findUnique({
        where: { email: customer.customerEmail },
      });

      if (!whatleadUser) {
        // Criar usuário no sistema Whatlead
        const hashedPassword = await require('bcrypt').hash(customer.customerEmail, 10);

        whatleadUser = await prisma.user.create({
          data: {
            name: customer.customerName,
            email: customer.customerEmail,
            password: hashedPassword,
            phone: customer.customerPhone || '',
            profile: 'user',
            plan: 'pro', // Plano padrão para clientes Hotmart
            whatleadCompanyId: 'default-company-id', // Ajustar conforme necessário
            role: 'user',
          },
        });

        // Atualizar cliente Hotmart com o ID do usuário Whatlead
        await prisma.hotmartCustomer.update({
          where: { id: customer.id },
          data: { whatleadUserId: whatleadUser.id },
        });
      }

      // Enviar boas-vindas
      await welcomeService.sendWelcomeMessage({
        name: customer.customerName,
        email: customer.customerEmail,
        login: customer.customerEmail,
        password: customer.customerEmail,
        phone: customer.customerPhone,
      });

      logger.info('Mensagem de boas-vindas enviada com sucesso');
    } catch (error) {
      logger.error('Erro ao enviar mensagem de boas-vindas:', error);
      // Não lançar erro para não interromper o fluxo principal
    }
  }

  /**
   * Busca detalhes da assinatura via API
   */
  async getSubscriptionDetails(subscriberCode: string): Promise<HotmartSubscription | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/payments/api/v1/subscriptions', {
        // biome-ignore lint/style/useNamingConvention: <explanation>
        subscriber_code: subscriberCode,
      });

      const items = response.items as any[];
      if (items && items.length > 0) {
        return items[0];
      }

      return null;
    } catch (error) {
      logger.error('Erro ao buscar detalhes da assinatura:', error);
      return null;
    }
  }

  /**
   * Busca detalhes do usuário via API
   */
  async getUserDetails(userId: string): Promise<HotmartUser | null> {
    try {
      const response = await this.makeAuthenticatedRequest('/payments/api/v1/sales/users', {
        // biome-ignore lint/style/useNamingConvention: <explanation>
        user_id: userId,
      });

      const items = response.items as any[];
      if (items && items.length > 0) {
        return items[0];
      }

      return null;
    } catch (error) {
      logger.error('Erro ao buscar detalhes do usuário:', error);
      return null;
    }
  }

  /**
   * Lista todas as assinaturas
   */
  async listSubscriptions(filters: any = {}): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest('/payments/api/v1/subscriptions', filters);
      return response;
    } catch (error) {
      logger.error('Erro ao listar assinaturas:', error);
      throw error;
    }
  }

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(subscriberCode: string, sendEmail = true): Promise<any> {
    try {
      const token = await this.authenticate();

      const response = await axios.post(
        `${this.apiBaseUrl}/payments/api/v1/subscriptions/${subscriberCode}/cancel`,
        {
          send_mail: sendEmail,
        },
        {
          headers: {
            // biome-ignore lint/style/useNamingConvention: <explanation>
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Assinatura ${subscriberCode} cancelada com sucesso`);
      return response.data;
    } catch (error) {
      logger.error('Erro ao cancelar assinatura:', error);
      throw error;
    }
  }

  /**
   * Reativa uma assinatura
   */
  async reactivateSubscription(subscriberCode: string, chargeNow = false): Promise<any> {
    try {
      const token = await this.authenticate();

      const response = await axios.post(
        `${this.apiBaseUrl}/payments/api/v1/subscriptions/${subscriberCode}/reactivate`,
        {
          charge_now: chargeNow,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info(`Assinatura ${subscriberCode} reativada com sucesso`);
      return response.data;
    } catch (error) {
      logger.error('Erro ao reativar assinatura:', error);
      throw error;
    }
  }

  /**
   * Busca clientes do banco de dados
   */
  async getCustomers(filters: any = {}): Promise<any> {
    try {
      const where: any = {};

      if (filters.status) {
        where.subscriptionStatus = filters.status;
      }

      if (filters.paymentStatus) {
        where.paymentStatus = filters.paymentStatus;
      }

      if (filters.productId) {
        where.productId = filters.productId;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.search) {
        where.OR = [
          { customerName: { contains: filters.search, mode: 'insensitive' } },
          { customerEmail: { contains: filters.search, mode: 'insensitive' } },
          { subscriberCode: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const customers = await prisma.hotmartCustomer.findMany({
        where,
        include: {
          hotmartEvents: {
            orderBy: { eventDate: 'desc' },
            take: 5,
          },
          hotmartTransactions: {
            orderBy: { paymentDate: 'desc' },
            take: 5,
          },
          whatleadUser: {
            select: {
              id: true,
              name: true,
              email: true,
              active: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: filters.skip || 0,
        take: filters.take || 50,
      });

      const total = await prisma.hotmartCustomer.count({ where });

      return {
        customers,
        total,
        page: Math.floor((filters.skip || 0) / (filters.take || 50)) + 1,
        totalPages: Math.ceil(total / (filters.take || 50)),
      };
    } catch (error) {
      logger.error('Erro ao buscar clientes:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas dos clientes
   */
  async getCustomerStats(): Promise<any> {
    try {
      const [
        totalCustomers,
        activeCustomers,
        cancelledCustomers,
        delayedCustomers,
        trialCustomers,
        totalRevenue,
        monthlyRevenue,
      ] = await Promise.all([
        prisma.hotmartCustomer.count(),
        prisma.hotmartCustomer.count({ where: { isActive: true, subscriptionStatus: 'ACTIVE' } }),
        prisma.hotmartCustomer.count({ where: { subscriptionStatus: 'CANCELLED' } }),
        prisma.hotmartCustomer.count({ where: { subscriptionStatus: 'DELAYED' } }),
        prisma.hotmartCustomer.count({ where: { isTrial: true } }),
        prisma.hotmartCustomer.aggregate({
          _sum: { subscriptionValue: true },
          where: { isActive: true },
        }),
        prisma.hotmartCustomer.aggregate({
          _sum: { subscriptionValue: true },
          where: {
            isActive: true,
            subscriptionStartDate: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

      return {
        totalCustomers,
        activeCustomers,
        cancelledCustomers,
        delayedCustomers,
        trialCustomers,
        totalRevenue: totalRevenue._sum.subscriptionValue || 0,
        monthlyRevenue: monthlyRevenue._sum.subscriptionValue || 0,
        churnRate: totalCustomers > 0 ? (cancelledCustomers / totalCustomers) * 100 : 0,
      };
    } catch (error) {
      logger.error('Erro ao buscar estatísticas dos clientes:', error);
      throw error;
    }
  }

  /**
   * Sincroniza dados com a API da Hotmart
   */
  async syncWithHotmart(): Promise<any> {
    try {
      logger.info('Iniciando sincronização com Hotmart');

      const subscriptions = await this.listSubscriptions({
        status: 'ACTIVE',
        limit: 100,
      });

      let syncedCount = 0;
      let errorCount = 0;

      for (const subscription of subscriptions.items || []) {
        try {
          const existingCustomer = await prisma.hotmartCustomer.findUnique({
            where: { subscriberCode: subscription.subscriberCode },
          });

          if (!existingCustomer) {
            // Criar novo cliente
            await prisma.hotmartCustomer.create({
              data: {
                subscriberCode: subscription.subscriberCode,
                productId: subscription.productId,
                productName: subscription.productName,
                customerName: subscription.subscriber.name,
                customerEmail: subscription.subscriber.email,
                customerPhone: subscription.subscriber.phone,
                customerDocument: subscription.subscriber.document,
                customerCountry: subscription.subscriber.address?.country,
                customerCity: subscription.subscriber.address?.city,
                customerState: subscription.subscriber.address?.state,
                customerZipCode: subscription.subscriber.address?.zipCode,
                customerAddress: subscription.subscriber.address?.address,
                customerNumber: subscription.subscriber.address?.number,
                customerComplement: subscription.subscriber.address?.complement,
                customerNeighborhood: subscription.subscriber.address?.neighborhood,
                paymentType: subscription.payment.type,
                paymentMethod: subscription.payment.method,
                paymentStatus: subscription.payment.status,
                subscriptionStatus: subscription.subscription.status,
                subscriptionValue: subscription.payment.value,
                subscriptionCurrency: subscription.payment.currency,
                subscriptionFrequency: subscription.subscription.frequency,
                subscriptionStartDate: subscription.subscription.startDate ? new Date(subscription.subscription.startDate) : null,
                subscriptionEndDate: subscription.subscription.endDate ? new Date(subscription.subscription.endDate) : null,
                nextChargeDate: subscription.subscription.nextChargeDate ? new Date(subscription.subscription.nextChargeDate) : null,
                affiliateCode: subscription.affiliate?.code,
                affiliateName: subscription.affiliate?.name,
                producerCode: subscription.producer?.code,
                producerName: subscription.producer?.name,
                isActive: true,
                isTrial: subscription.subscription.status === 'TRIAL',
                trialEndDate: subscription.subscription.status === 'TRIAL' ? new Date(subscription.subscription.endDate) : null,
              },
            });

            syncedCount++;
          }
        } catch (error) {
          logger.error(`Erro ao sincronizar assinatura ${subscription.subscriberCode}:`, error);
          errorCount++;
        }
      }

      logger.info(`Sincronização concluída: ${syncedCount} sincronizados, ${errorCount} erros`);

      return {
        success: true,
        syncedCount,
        errorCount,
      };
    } catch (error) {
      logger.error('Erro na sincronização com Hotmart:', error);
      throw error;
    }
  }

  /**
   * Busca eventos pendentes
   */
  async getPendingEvents(): Promise<any[]> {
    try {
      const events = await prisma.hotmartEvent.findMany({
        where: {
          status: 'PENDING',
          retryCount: {
            lt: 3,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: 50,
      });

      return events;
    } catch (error) {
      logger.error('Erro ao buscar eventos pendentes:', error);
      throw error;
    }
  }

  /**
   * Processa um evento pendente
   */
  async processPendingEvent(eventId: string): Promise<void> {
    try {
      const event = await prisma.hotmartEvent.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new Error('Evento não encontrado');
      }

      // Processar o evento baseado no tipo
      const eventData = event.eventData as HotmartWebhookData['data'];

      switch (event.eventType) {
        case 'PURCHASE_APPROVED':
          await this.handlePurchaseApproved(eventData);
          break;
        case 'SUBSCRIPTION_CANCELLED':
          await this.handleSubscriptionCancelled(eventData);
          break;
        case 'SUBSCRIPTION_CHANGED':
          await this.handleSubscriptionChanged(eventData);
          break;
        case 'SUBSCRIPTION_BILLING_DATE_UPDATED':
          await this.handleSubscriptionBillingDateUpdated(eventData);
          break;
        case 'PURCHASE_CANCELLED':
          await this.handlePurchaseCancelled(eventData);
          break;
        case 'PURCHASE_REFUNDED':
          await this.handlePurchaseRefunded(eventData);
          break;
        case 'CHARGEBACK':
          await this.handleChargeback(eventData);
          break;
        case 'PURCHASE_EXPIRED':
          await this.handlePurchaseExpired(eventData);
          break;
        case 'PURCHASE_DELAYED':
          await this.handlePurchaseDelayed(eventData);
          break;
        case 'CART_ABANDONED':
          await this.handleCartAbandoned(eventData);
          break;
        default:
          logger.warn(`Evento não tratado: ${event.eventType}`);
      }

      // Marcar evento como processado
      await prisma.hotmartEvent.update({
        where: { id: eventId },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Erro ao processar evento pendente:', error);
      throw error;
    }
  }

  /**
   * Incrementa o contador de tentativas de um evento
   */
  async incrementEventRetryCount(eventId: string): Promise<void> {
    try {
      await prisma.hotmartEvent.update({
        where: { id: eventId },
        data: {
          retryCount: {
            increment: 1,
          },
          status: 'FAILED',
          errorMessage: 'Erro no processamento',
        },
      });
    } catch (error) {
      logger.error('Erro ao incrementar contador de tentativas:', error);
      throw error;
    }
  }

  /**
   * Analisa o churn dos clientes
   */
  async analyzeChurn(): Promise<any> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const [
        totalCustomers,
        churnedCustomers,
        atRiskCustomers,
      ] = await Promise.all([
        prisma.hotmartCustomer.count({
          where: { isActive: true },
        }),
        prisma.hotmartCustomer.count({
          where: {
            subscriptionStatus: 'CANCELLED',
            cancelationDate: {
              gte: thirtyDaysAgo,
            },
          },
        }),
        prisma.hotmartCustomer.count({
          where: {
            isActive: true,
            subscriptionStatus: 'DELAYED',
            lastActivityDate: {
              lt: thirtyDaysAgo,
            },
          },
        }),
      ]);

      const churnRate = totalCustomers > 0 ? (churnedCustomers / totalCustomers) * 100 : 0;

      return {
        totalCustomers,
        churnedCustomers,
        churnRate,
        atRiskCustomers,
        analysisDate: now,
      };
    } catch (error) {
      logger.error('Erro na análise de churn:', error);
      throw error;
    }
  }

  /**
   * Limpa dados antigos
   */
  async cleanupOldData(): Promise<any> {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const [
        deletedEvents,
        deletedTransactions,
        archivedCustomers,
      ] = await Promise.all([
        prisma.hotmartEvent.deleteMany({
          where: {
            createdAt: {
              lt: oneYearAgo,
            },
            status: 'PROCESSED',
          },
        }),
        prisma.hotmartTransaction.deleteMany({
          where: {
            createdAt: {
              lt: oneYearAgo,
            },
            transactionStatus: 'CANCELLED',
          },
        }),
        prisma.hotmartCustomer.updateMany({
          where: {
            createdAt: {
              lt: oneYearAgo,
            },
            subscriptionStatus: 'CANCELLED',
            isActive: false,
          },
          data: {
            tags: {
              push: 'archived',
            },
          },
        }),
      ]);

      return {
        deletedEvents: deletedEvents.count,
        deletedTransactions: deletedTransactions.count,
        archivedCustomers: archivedCustomers.count,
      };
    } catch (error) {
      logger.error('Erro na limpeza de dados:', error);
      throw error;
    }
  }

  /**
   * Busca um cliente por ID
   */
  async getCustomerById(id: string): Promise<any> {
    try {
      const customer = await prisma.hotmartCustomer.findUnique({
        where: { id },
        include: {
          hotmartEvents: {
            orderBy: { eventDate: 'desc' },
            take: 10,
          },
          hotmartTransactions: {
            orderBy: { paymentDate: 'desc' },
            take: 10,
          },
          whatleadUser: {
            select: {
              id: true,
              name: true,
              email: true,
              active: true,
            },
          },
        },
      });

      return customer;
    } catch (error) {
      logger.error('Erro ao buscar cliente por ID:', error);
      throw error;
    }
  }

  /**
   * Busca eventos de um cliente
   */
  async getCustomerEvents(customerId: string, page = 1, limit = 20): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      const [events, total] = await Promise.all([
        prisma.hotmartEvent.findMany({
          where: { customerId },
          orderBy: { eventDate: 'desc' },
          skip,
          take: limit,
        }),
        prisma.hotmartEvent.count({
          where: { customerId },
        }),
      ]);

      return {
        events,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Erro ao buscar eventos do cliente:', error);
      throw error;
    }
  }

  /**
   * Busca transações de um cliente
   */
  async getCustomerTransactions(customerId: string, page = 1, limit = 20): Promise<any> {
    try {
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        prisma.hotmartTransaction.findMany({
          where: { customerId },
          orderBy: { paymentDate: 'desc' },
          skip,
          take: limit,
        }),
        prisma.hotmartTransaction.count({
          where: { customerId },
        }),
      ]);

      return {
        transactions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Erro ao buscar transações do cliente:', error);
      throw error;
    }
  }

  /**
   * Atualiza dados de um cliente
   */
  async updateCustomer(id: string, updateData: any): Promise<any> {
    try {
      const customer = await prisma.hotmartCustomer.update({
        where: { id },
        data: updateData,
        include: {
          whatleadUser: {
            select: {
              id: true,
              name: true,
              email: true,
              active: true,
            },
          },
        },
      });

      return customer;
    } catch (error) {
      logger.error('Erro ao atualizar cliente:', error);
      throw error;
    }
  }

  /**
   * Adiciona notas a um cliente
   */
  async addCustomerNote(customerId: string, notes: string): Promise<any> {
    try {
      const customer = await prisma.hotmartCustomer.update({
        where: { id: customerId },
        data: {
          notes: notes,
          updatedAt: new Date(),
        },
      });

      return customer;
    } catch (error) {
      logger.error('Erro ao adicionar nota:', error);
      throw error;
    }
  }

  /**
   * Adiciona tags a um cliente
   */
  async addCustomerTags(customerId: string, tags: string[]): Promise<any> {
    try {
      const customer = await prisma.hotmartCustomer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error('Cliente não encontrado');
      }

      const updatedTags = [...new Set([...customer.tags, ...tags])];

      const updatedCustomer = await prisma.hotmartCustomer.update({
        where: { id: customerId },
        data: {
          tags: updatedTags,
          updatedAt: new Date(),
        },
      });

      return updatedCustomer;
    } catch (error) {
      logger.error('Erro ao adicionar tags:', error);
      throw error;
    }
  }

  /**
   * Remove tags de um cliente
   */
  async removeCustomerTags(customerId: string, tags: string[]): Promise<any> {
    try {
      const customer = await prisma.hotmartCustomer.findUnique({
        where: { id: customerId },
      });

      if (!customer) {
        throw new Error('Cliente não encontrado');
      }

      const updatedTags = customer.tags.filter(tag => !tags.includes(tag));

      const updatedCustomer = await prisma.hotmartCustomer.update({
        where: { id: customerId },
        data: {
          tags: updatedTags,
          updatedAt: new Date(),
        },
      });

      return updatedCustomer;
    } catch (error) {
      logger.error('Erro ao remover tags:', error);
      throw error;
    }
  }

  /**
   * Exporta dados dos clientes
   */
  async exportCustomers(filters: any = {}, format = 'csv'): Promise<string> {
    try {
      const customers = await this.getCustomers(filters);

      if (format === 'csv') {
        const headers = [
          'ID',
          'Código do Assinante',
          'Nome',
          'Email',
          'Telefone',
          'Produto',
          'Status da Assinatura',
          'Status do Pagamento',
          'Valor da Assinatura',
          'Data de Início',
          'Próxima Cobrança',
          'Data de Criação',
        ];

        const rows = customers.customers.map((customer: any) => [
          customer.id,
          customer.subscriberCode,
          customer.customerName,
          customer.customerEmail,
          customer.customerPhone,
          customer.productName,
          customer.subscriptionStatus,
          customer.paymentStatus,
          customer.subscriptionValue,
          customer.subscriptionStartDate,
          customer.nextChargeDate,
          customer.createdAt,
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map((row: any) => row.join(',')),
        ].join('\n');

        return csvContent;
      }

      throw new Error('Formato de exportação não suportado');
    } catch (error) {
      logger.error('Erro ao exportar clientes:', error);
      throw error;
    }
  }

  /**
   * Gera relatório de análise
   */
  async generateAnalyticsReport(params: any): Promise<any> {
    try {
      const { startDate, endDate, groupBy = 'month' } = params;

      const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
      const end = endDate ? new Date(endDate) : new Date();

      const analytics = await prisma.hotmartAnalytics.findMany({
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
        orderBy: {
          date: 'asc',
        },
      });

      // Agrupar dados por período
      const groupedData = this.groupAnalyticsData(analytics, groupBy);

      return {
        period: {
          startDate: start,
          endDate: end,
          groupBy,
        },
        data: groupedData,
        summary: this.calculateSummary(analytics),
      };
    } catch (error) {
      logger.error('Erro ao gerar relatório de análise:', error);
      throw error;
    }
  }

  /**
   * Agrupa dados de análise por período
   */
  private groupAnalyticsData(analytics: any[], groupBy: string): any {
    const grouped: any = {};

    analytics.forEach((item) => {
      let key: string;

      if (groupBy === 'month') {
        key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'week') {
        const weekNumber = Math.ceil((item.date.getTime() - new Date(item.date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
        key = `${item.date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
      } else {
        key = item.date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          totalRevenue: 0,
          activeSubscriptions: 0,
          newSubscriptions: 0,
          cancelledSubscriptions: 0,
          churnRate: 0,
        };
      }

      grouped[key].totalRevenue += Number(item.totalRevenue);
      grouped[key].activeSubscriptions += item.activeSubscriptions;
      grouped[key].newSubscriptions += item.newSubscriptions;
      grouped[key].cancelledSubscriptions += item.cancelledSubscriptions;
    });

    // Calcular taxa de churn para cada período
    Object.keys(grouped).forEach((key) => {
      const period = grouped[key];
      period.churnRate = period.activeSubscriptions > 0
        ? (period.cancelledSubscriptions / period.activeSubscriptions) * 100
        : 0;
    });

    return Object.values(grouped);
  }

  /**
   * Calcula resumo dos dados de análise
   */
  private calculateSummary(analytics: any[]): any {
    const summary = {
      totalRevenue: 0,
      totalActiveSubscriptions: 0,
      totalNewSubscriptions: 0,
      totalCancelledSubscriptions: 0,
      averageChurnRate: 0,
    };

    analytics.forEach((item) => {
      summary.totalRevenue += Number(item.totalRevenue);
      summary.totalActiveSubscriptions += item.activeSubscriptions;
      summary.totalNewSubscriptions += item.newSubscriptions;
      summary.totalCancelledSubscriptions += item.cancelledSubscriptions;
    });

    summary.averageChurnRate = summary.totalActiveSubscriptions > 0
      ? (summary.totalCancelledSubscriptions / summary.totalActiveSubscriptions) * 100
      : 0;

    return summary;
  }
}

export const hotmartService = new HotmartService();