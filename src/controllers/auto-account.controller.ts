// src/controllers/auto-account.controller.ts
import type { Request, Response } from 'express';
import { autoAccountService } from '../services/auto-account.service';
import { logger } from '../utils/logger';

export class AutoAccountController {
  /**
   * Cria conta manualmente (para casos especiais)
   */
  async createAccountManually(req: Request, res: Response) {
    try {
      const {
        customerEmail,
        customerName,
        customerPhone,
        paymentValue,
        paymentStatus = 'APPROVED',
        subscriptionStatus = 'ACTIVE',
        productId,
        productName,
        transactionId,
        subscriberCode,
        source = 'manual',
      } = req.body;

      // Validações básicas
      if (!customerEmail || !customerName || !paymentValue) {
        return res.status(400).json({
          success: false,
          error: 'Email, nome e valor do pagamento são obrigatórios',
        });
      }

      const paymentData = {
        customerEmail,
        customerName,
        customerPhone,
        paymentValue: Number(paymentValue),
        paymentStatus,
        subscriptionStatus,
        productId,
        productName,
        transactionId,
        subscriberCode,
        source: source as 'hotmart' | 'stripe' | 'manual',
      };

      const user = await autoAccountService.createAccountFromPayment(paymentData);

      return res.status(201).json({
        success: true,
        message: 'Conta criada com sucesso',
        data: {
          userId: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        },
      });
    } catch (error) {
      logger.error('Erro ao criar conta manualmente:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Verifica se uma conta existe
   */
  async checkAccountExists(req: Request, res: Response) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email é obrigatório',
        });
      }

      const exists = await autoAccountService.checkAccountExists(email);

      return res.json({
        success: true,
        exists,
        email,
      });
    } catch (error) {
      logger.error('Erro ao verificar existência da conta:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Obtém informações da conta por email
   */
  async getAccountByEmail(req: Request, res: Response) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email é obrigatório',
        });
      }

      const account = await autoAccountService.getAccountByEmail(email);

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Conta não encontrada',
        });
      }

      return res.json({
        success: true,
        data: {
          id: account.id,
          email: account.email,
          name: account.name,
          plan: account.plan,
          company: account.company,
          instances: account.instances,
          createdAt: account.createdAt,
        },
      });
    } catch (error) {
      logger.error('Erro ao buscar conta por email:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }

  /**
   * Reenvia email de boas-vindas
   */
  async resendWelcomeEmail(req: Request, res: Response) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email é obrigatório',
        });
      }

      const account = await autoAccountService.getAccountByEmail(email);

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Conta não encontrada',
        });
      }

      // Reenviar boas-vindas
      await autoAccountService['sendWelcomeMessage'](account, {
        customerEmail: account.email,
        customerName: account.name,
        customerPhone: account.phone,
        paymentValue: 0,
        paymentStatus: 'APPROVED',
        source: 'manual',
      });

      return res.json({
        success: true,
        message: 'Email de boas-vindas reenviado com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao reenviar email de boas-vindas:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }
}

export const autoAccountController = new AutoAccountController();