// src/controllers/metadata-cleaner.controller.ts
import { Request, Response } from 'express';
import { metadataCleanerService } from '../services/metadata-cleaner.service';
import { logger } from '../utils/logger';

export class MetadataCleanerController {
  /**
   * Testa a limpeza de metadados de uma mídia
   */
  public async testMetadataCleaning(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { base64Data, fileName, mimetype } = req.body;

      if (!base64Data || !fileName || !mimetype) {
        res.status(400).json({
          success: false,
          error: 'Dados obrigatórios: base64Data, fileName, mimetype',
        });
        return;
      }

      const cleanerLogger = logger.setContext(
        'MetadataCleanerController',
      );
      cleanerLogger.info(
        `Iniciando teste de limpeza: ${fileName} (${mimetype})`,
      );

      const result = await metadataCleanerService.cleanMediaMetadata(
        base64Data,
        fileName,
        mimetype,
      );

      if (result.success) {
        cleanerLogger.info(
          `Teste concluído com sucesso: ${fileName}`,
          {
            originalSize: result.originalSize,
            cleanedSize: result.cleanedSize,
            reduction: result.originalSize - result.cleanedSize,
          },
        );

        res.json({
          success: true,
          message: 'Metadados removidos com sucesso',
          data: {
            originalSize: result.originalSize,
            cleanedSize: result.cleanedSize,
            reduction: result.originalSize - result.cleanedSize,
            reductionPercentage: Math.round(
              ((result.originalSize - result.cleanedSize) /
                result.originalSize) *
                100,
            ),
            cleanedMedia: {
              fileName: result.cleanedMedia?.fileName,
              mimetype: result.cleanedMedia?.mimetype,
              size: result.cleanedMedia?.size,
            },
          },
        });
      } else {
        cleanerLogger.error(`Teste falhou: ${fileName}`, {
          error: result.error,
        });

        res.status(500).json({
          success: false,
          error: result.error,
          data: {
            originalSize: result.originalSize,
            cleanedSize: result.cleanedSize,
          },
        });
      }
    } catch (error) {
      const errorLogger = logger.setContext(
        'MetadataCleanerControllerError',
      );
      errorLogger.error(
        'Erro no teste de limpeza de metadados:',
        error,
      );

      res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro interno do servidor',
      });
    }
  }

  /**
   * Retorna informações sobre os tipos de mídia suportados
   */
  public async getSupportedMediaTypes(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          supportedTypes: [
            {
              type: 'image',
              mimetypes: [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
              ],
              description: 'Imagens com metadados EXIF removidos',
            },
            {
              type: 'video',
              mimetypes: [
                'video/mp4',
                'video/avi',
                'video/mov',
                'video/wmv',
              ],
              description: 'Vídeos com metadados removidos',
            },
            {
              type: 'audio',
              mimetypes: [
                'audio/mpeg',
                'audio/wav',
                'audio/ogg',
                'audio/mp3',
              ],
              description: 'Áudios com metadados ID3 removidos',
            },
          ],
          features: [
            'Remoção automática de metadados EXIF de imagens',
            'Remoção de metadados de vídeos (data, localização, dispositivo)',
            'Remoção de tags ID3 de áudios',
            'Re-codificação para formatos otimizados',
            'Redução de tamanho de arquivo',
            'Preservação da qualidade visual/auditiva',
          ],
        },
      });
    } catch (error) {
      const errorLogger = logger.setContext(
        'MetadataCleanerControllerError',
      );
      errorLogger.error('Erro ao obter tipos suportados:', error);

      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }
}

export const metadataCleanerController =
  new MetadataCleanerController();
