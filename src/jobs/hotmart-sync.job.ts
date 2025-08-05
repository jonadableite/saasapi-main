// src/jobs/hotmart-sync.job.ts
import cron from 'node-cron';
import { hotmartService } from '../services/hotmart.service';
import { logger } from '../utils/logger';

const jobLogger = logger.setContext('HotmartSyncJob');

/**
 * Job para sincronização automática com a Hotmart
 * Executa diariamente às 2h da manhã
 */
export const scheduleHotmartSync = () => {
  cron.schedule('0 2 * * *', async () => {
    jobLogger.info('Iniciando sincronização automática com Hotmart');

    try {
      const result = await hotmartService.syncWithHotmart();

      jobLogger.info('Sincronização automática concluída', {
        syncedCount: result.syncedCount,
        errorCount: result.errorCount,
      });
    } catch (error) {
      jobLogger.error('Erro na sincronização automática com Hotmart:', error);
    }
  });

  jobLogger.info('Job de sincronização Hotmart agendado para execução diária às 2h');
};

/**
 * Job para processar eventos pendentes
 * Executa a cada 30 minutos
 */
export const scheduleEventProcessing = () => {
  cron.schedule('*/30 * * * *', async () => {
    jobLogger.info('Processando eventos Hotmart pendentes');

    try {
      // Buscar eventos pendentes
      const pendingEvents = await hotmartService.getPendingEvents();

      if (pendingEvents.length > 0) {
        jobLogger.info(`Processando ${pendingEvents.length} eventos pendentes`);

        for (const event of pendingEvents) {
          try {
            await hotmartService.processPendingEvent(event.id);
            jobLogger.info(`Evento ${event.id} processado com sucesso`);
          } catch (error) {
            jobLogger.error(`Erro ao processar evento ${event.id}:`, error);

            // Incrementar contador de tentativas
            await hotmartService.incrementEventRetryCount(event.id);
          }
        }
      }
    } catch (error) {
      jobLogger.error('Erro ao processar eventos pendentes:', error);
    }
  });

  jobLogger.info('Job de processamento de eventos agendado para execução a cada 30 minutos');
};

/**
 * Job para análise de churn
 * Executa semanalmente aos domingos às 3h
 */
export const scheduleChurnAnalysis = () => {
  cron.schedule('0 3 * * 0', async () => {
    jobLogger.info('Iniciando análise de churn');

    try {
      const churnAnalysis = await hotmartService.analyzeChurn();

      jobLogger.info('Análise de churn concluída', {
        totalCustomers: churnAnalysis.totalCustomers,
        churnedCustomers: churnAnalysis.churnedCustomers,
        churnRate: churnAnalysis.churnRate,
        atRiskCustomers: churnAnalysis.atRiskCustomers,
      });
    } catch (error) {
      jobLogger.error('Erro na análise de churn:', error);
    }
  });

  jobLogger.info('Job de análise de churn agendado para execução semanal aos domingos às 3h');
};

/**
 * Job para limpeza de dados antigos
 * Executa mensalmente no primeiro dia do mês às 4h
 */
export const scheduleDataCleanup = () => {
  cron.schedule('0 4 1 * *', async () => {
    jobLogger.info('Iniciando limpeza de dados antigos');

    try {
      const cleanupResult = await hotmartService.cleanupOldData();

      jobLogger.info('Limpeza de dados concluída', {
        deletedEvents: cleanupResult.deletedEvents,
        deletedTransactions: cleanupResult.deletedTransactions,
        archivedCustomers: cleanupResult.archivedCustomers,
      });
    } catch (error) {
      jobLogger.error('Erro na limpeza de dados:', error);
    }
  });

  jobLogger.info('Job de limpeza de dados agendado para execução mensal no primeiro dia às 4h');
};

/**
 * Inicializa todos os jobs do Hotmart
 */
export const initializeHotmartJobs = () => {
  try {
    scheduleHotmartSync();
    scheduleEventProcessing();
    scheduleChurnAnalysis();
    scheduleDataCleanup();

    jobLogger.info('Todos os jobs do Hotmart foram inicializados com sucesso');
  } catch (error) {
    jobLogger.error('Erro ao inicializar jobs do Hotmart:', error);
  }
};