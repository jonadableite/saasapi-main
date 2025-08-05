// src/controllers/hotmart.controller.ts
import type { Request, Response } from 'express';
import { hotmartService } from '../services/hotmart.service';
import { logger } from '../utils/logger';

export class HotmartController {
  /**
   * Endpoint para receber webhooks da Hotmart
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      const hottok = req.headers['x-hotmart-hottok'] as string;

      if (!hottok) {
        logger.error('Hottok não fornecido no cabeçalho');
        return res.status(401).json({
          success: false,
          error: 'Hottok não fornecido',
        });
      }

      const webhookData = req.body;

      if (!webhookData || !webhookData.event) {
        logger.error('Dados do webhook inválidos');
        return res.status(400).json({
          success: false,
          error: 'Dados do webhook inválidos',
        });
      }

      logger.info('Webhook recebido:', {
        event: webhookData.event,
        transaction: webhookData.data?.transaction,
        subscriber_code: webhookData.data?.subscriber_code,
      });

      const result = await hotmartService.processWebhook(webhookData, hottok);

      if (result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error) {
      logger.error('Erro ao processar webhook:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Lista todos os clientes Hotmart
   */
  async getCustomers(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 50,
        status,
        paymentStatus,
        productId,
        isActive,
        search,
      } = req.query;

      const filters = {
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        status: status as string,
        paymentStatus: paymentStatus as string,
        productId: productId as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search: search as string,
      };

      const result = await hotmartService.getCustomers(filters);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Erro ao buscar clientes:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Busca um cliente específico
   */
  async getCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const customer = await hotmartService.getCustomerById(id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Cliente não encontrado',
        });
      }

      return res.status(200).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      logger.error('Erro ao buscar cliente:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Busca estatísticas dos clientes
   */
  async getCustomerStats(req: Request, res: Response) {
    try {
      const stats = await hotmartService.getCustomerStats();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Lista eventos de um cliente
   */
  async getCustomerEvents(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const events = await hotmartService.getCustomerEvents(
        customerId,
        Number(page),
        Number(limit)
      );

      return res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      logger.error('Erro ao buscar eventos do cliente:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Lista transações de um cliente
   */
  async getCustomerTransactions(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const transactions = await hotmartService.getCustomerTransactions(
        customerId,
        Number(page),
        Number(limit)
      );

      return res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      logger.error('Erro ao buscar transações do cliente:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(req: Request, res: Response) {
    try {
      const { subscriberCode } = req.params;
      const { sendEmail = true } = req.body;

      const result = await hotmartService.cancelSubscription(subscriberCode, sendEmail);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Assinatura cancelada com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao cancelar assinatura:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Reativa uma assinatura
   */
  async reactivateSubscription(req: Request, res: Response) {
    try {
      const { subscriberCode } = req.params;
      const { chargeNow = false } = req.body;

      const result = await hotmartService.reactivateSubscription(subscriberCode, chargeNow);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Assinatura reativada com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao reativar assinatura:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Sincroniza dados com a API da Hotmart
   */
  async syncWithHotmart(req: Request, res: Response) {
    try {
      const result = await hotmartService.syncWithHotmart();

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Sincronização concluída com sucesso',
      });
    } catch (error) {
      logger.error('Erro na sincronização:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Lista assinaturas da API da Hotmart
   */
  async listSubscriptions(req: Request, res: Response) {
    try {
      const filters = req.query;
      const result = await hotmartService.listSubscriptions(filters);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Erro ao listar assinaturas:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Busca detalhes de uma assinatura
   */
  async getSubscriptionDetails(req: Request, res: Response) {
    try {
      const { subscriberCode } = req.params;
      const result = await hotmartService.getSubscriptionDetails(subscriberCode);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: 'Assinatura não encontrada',
        });
      }

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Erro ao buscar detalhes da assinatura:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Atualiza dados de um cliente
   */
  async updateCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const result = await hotmartService.updateCustomer(id, updateData);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Cliente atualizado com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao atualizar cliente:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Adiciona notas a um cliente
   */
  async addCustomerNote(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      const { notes } = req.body;

      const result = await hotmartService.addCustomerNote(customerId, notes);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Nota adicionada com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao adicionar nota:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Adiciona tags a um cliente
   */
  async addCustomerTags(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      const { tags } = req.body;

      const result = await hotmartService.addCustomerTags(customerId, tags);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Tags adicionadas com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao adicionar tags:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Remove tags de um cliente
   */
  async removeCustomerTags(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      const { tags } = req.body;

      const result = await hotmartService.removeCustomerTags(customerId, tags);

      return res.status(200).json({
        success: true,
        data: result,
        message: 'Tags removidas com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao remover tags:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Exporta dados dos clientes
   */
  async exportCustomers(req: Request, res: Response) {
    try {
      const { format = 'csv' } = req.query;
      const filters = req.body;

      const result = await hotmartService.exportCustomers(filters, format as string);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=customers.csv');

      return res.status(200).send(result);
    } catch (error) {
      logger.error('Erro ao exportar clientes:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Gera relatório de análise
   */
  async generateAnalyticsReport(req: Request, res: Response) {
    try {
      const { startDate, endDate, groupBy = 'month' } = req.query;

      const report = await hotmartService.generateAnalyticsReport({
        startDate: startDate as string,
        endDate: endDate as string,
        groupBy: groupBy as string,
      });

      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error('Erro ao gerar relatório:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }
}

export const hotmartController = new HotmartController();