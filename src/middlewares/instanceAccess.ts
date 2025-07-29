// src/middlewares/instanceAccess.ts
import type { NextFunction, Response } from 'express';
import { prisma } from '../lib/prisma';
import type { RequestWithUser } from '../types';
import { logger } from '../utils/logger';

const instanceLogger = logger.setContext('InstanceAccess');

export const validateInstanceAccess = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    const instanceName = req.params.instanceName;

    // Se não há instanceName na rota, pula a validação
    if (!instanceName) {
      return next();
    }

    const userId = req.user?.id;
    if (!userId) {
      instanceLogger.warn(
        'Tentativa de acesso sem usuário autenticado',
      );
      return res.status(401).json({
        error: 'Usuário não autenticado',
      });
    }

    // Verifica se a instância existe e pertence ao usuário
    const instance = await prisma.instance.findFirst({
      where: {
        instanceName: instanceName,
        userId: userId,
      },
      select: {
        id: true,
        instanceName: true,
        connectionStatus: true,
        userId: true,
      },
    });

    if (!instance) {
      instanceLogger.warn(
        `Instância não encontrada ou acesso negado: ${instanceName} para usuário ${userId}`,
      );
      return res.status(404).json({
        error:
          'Instância não encontrada ou você não tem acesso a ela',
        instanceName,
      });
    }

    // Verifica se a instância está conectada (opcional, dependendo da regra de negócio)
    if (instance.connectionStatus !== 'OPEN') {
      // Corrigido: era 'open', agora 'OPEN'
      instanceLogger.warn(
        `Tentativa de uso de instância desconectada: ${instanceName}`,
      );
      return res.status(400).json({
        error: 'Instância não está conectada',
        instanceName,
        status: instance.connectionStatus,
      });
    }

    // Adiciona informações da instância ao request
    req.instance = {
      id: instance.id,
      instanceName: instance.instanceName,
      connectionStatus: instance.connectionStatus,
      userId: instance.userId,
    };

    instanceLogger.info(
      `Acesso à instância validado: ${instanceName} para usuário ${userId}`,
    );
    return next();
  } catch (error) {
    instanceLogger.error('Erro ao validar acesso à instância', error);
    return res.status(500).json({
      error: 'Erro interno ao validar acesso à instância',
    });
  }
};

export const requireInstanceConnection = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    const instanceName = req.params.instanceName;

    if (!instanceName) {
      return next();
    }

    const instance = await prisma.instance.findFirst({
      where: {
        instanceName: instanceName,
        userId: req.user?.id,
      },
      select: {
        connectionStatus: true,
      },
    });

    if (!instance || instance.connectionStatus !== 'OPEN') {
      // Corrigido: era 'open', agora 'OPEN'
      return res.status(400).json({
        error:
          'Instância deve estar conectada para realizar esta operação',
        instanceName,
        currentStatus: instance?.connectionStatus || 'not_found',
      });
    }

    return next();
  } catch (error) {
    instanceLogger.error(
      'Erro ao verificar conexão da instância',
      error,
    );
    return res.status(500).json({
      error: 'Erro interno ao verificar conexão da instância',
    });
  }
};
