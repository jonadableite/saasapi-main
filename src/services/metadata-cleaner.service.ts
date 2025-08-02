// src/services/metadata-cleaner.service.ts
import { spawn } from 'child_process';
import { existsSync, unlinkSync, writeFileSync } from 'fs';

import { join } from 'path';
import sharp from 'sharp';
import { logger } from '../utils/logger';

export interface CleanedMedia {
  data: string; // Base64 da mídia limpa
  fileName: string;
  mimetype: string;
  size: number;
}

export interface MetadataCleanerResult {
  success: boolean;
  cleanedMedia?: CleanedMedia;
  error?: string;
  originalSize: number;
  cleanedSize: number;
}

export class MetadataCleanerService {
  private tempDir: string;

  constructor() {
    this.tempDir = join(process.cwd(), 'temp');
  }

  /**
   * Remove metadados de uma imagem
   */
  public async cleanImageMetadata(
    base64Data: string,
    fileName: string,
    mimetype: string,
  ): Promise<MetadataCleanerResult> {
    try {
      const cleanerLogger = logger.setContext('MetadataCleaner');
      cleanerLogger.info(
        `Iniciando limpeza de metadados para imagem: ${fileName}`,
      );

      // Remover prefixo data:image/...;base64, se existir
      const cleanBase64 = base64Data.replace(
        /^data:image\/[a-zA-Z]+;base64,/,
        '',
      );
      const originalSize = Buffer.from(cleanBase64, 'base64').length;

      let cleanedBuffer: Buffer;

      // Usar Sharp para processar a imagem (mais eficiente)
      cleanedBuffer = await sharp(Buffer.from(cleanBase64, 'base64'))
        .removeAlpha() // Remove canal alpha se existir
        .jpeg({ quality: 90, progressive: true }) // Re-codifica como JPEG sem metadados
        .toBuffer();

      cleanerLogger.info(`Imagem processada com Sharp: ${fileName}`);

      const cleanedSize = cleanedBuffer.length;
      const cleanedBase64 = cleanedBuffer.toString('base64');

      cleanerLogger.info(
        `Metadados removidos com sucesso: ${fileName}`,
        {
          originalSize,
          cleanedSize,
          reduction: originalSize - cleanedSize,
        },
      );

      return {
        success: true,
        cleanedMedia: {
          data: cleanedBase64,
          fileName: this.generateCleanFileName(fileName, 'jpg'),
          mimetype: 'image/jpeg',
          size: cleanedSize,
        },
        originalSize,
        cleanedSize,
      };
    } catch (error) {
      const errorLogger = logger.setContext('MetadataCleanerError');
      errorLogger.error(
        `Erro ao limpar metadados da imagem ${fileName}:`,
        error,
      );

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido',
        originalSize: 0,
        cleanedSize: 0,
      };
    }
  }

  /**
   * Remove metadados de um vídeo usando FFmpeg
   */
  public async cleanVideoMetadata(
    base64Data: string,
    fileName: string,
    mimetype: string,
  ): Promise<MetadataCleanerResult> {
    try {
      const cleanerLogger = logger.setContext('MetadataCleaner');
      cleanerLogger.info(
        `Iniciando limpeza de metadados para vídeo: ${fileName}`,
      );

      // Remover prefixo data:video/...;base64, se existir
      const cleanBase64 = base64Data.replace(
        /^data:video\/[a-zA-Z]+;base64,/,
        '',
      );
      const originalSize = Buffer.from(cleanBase64, 'base64').length;

      // Criar arquivos temporários
      const inputPath = join(this.tempDir, `input_${Date.now()}.mp4`);
      const outputPath = join(
        this.tempDir,
        `output_${Date.now()}.mp4`,
      );

      // Garantir que o diretório temp existe
      if (!existsSync(this.tempDir)) {
        const fs = require('fs');
        fs.mkdirSync(this.tempDir, { recursive: true });
      }

      // Salvar arquivo de entrada
      writeFileSync(inputPath, Buffer.from(cleanBase64, 'base64'));

      // Processar com FFmpeg
      const cleanedBuffer = await this.processVideoWithFFmpeg(
        inputPath,
        outputPath,
      );

      // Limpar arquivos temporários
      try {
        unlinkSync(inputPath);
        if (existsSync(outputPath)) {
          unlinkSync(outputPath);
        }
      } catch (cleanupError) {
        cleanerLogger.warn(
          'Erro ao limpar arquivos temporários:',
          cleanupError,
        );
      }

      const cleanedSize = cleanedBuffer.length;
      const cleanedBase64 = cleanedBuffer.toString('base64');

      cleanerLogger.info(
        `Metadados removidos com sucesso: ${fileName}`,
        {
          originalSize,
          cleanedSize,
          reduction: originalSize - cleanedSize,
        },
      );

      return {
        success: true,
        cleanedMedia: {
          data: cleanedBase64,
          fileName: this.generateCleanFileName(fileName, 'mp4'),
          mimetype: 'video/mp4',
          size: cleanedSize,
        },
        originalSize,
        cleanedSize,
      };
    } catch (error) {
      const errorLogger = logger.setContext('MetadataCleanerError');
      errorLogger.error(
        `Erro ao limpar metadados do vídeo ${fileName}:`,
        error,
      );

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido',
        originalSize: 0,
        cleanedSize: 0,
      };
    }
  }

  /**
   * Remove metadados de um áudio usando FFmpeg
   */
  public async cleanAudioMetadata(
    base64Data: string,
    fileName: string,
    mimetype: string,
  ): Promise<MetadataCleanerResult> {
    try {
      const cleanerLogger = logger.setContext('MetadataCleaner');
      cleanerLogger.info(
        `Iniciando limpeza de metadados para áudio: ${fileName}`,
      );

      // Remover prefixo data:audio/...;base64, se existir
      const cleanBase64 = base64Data.replace(
        /^data:audio\/[a-zA-Z]+;base64,/,
        '',
      );
      const originalSize = Buffer.from(cleanBase64, 'base64').length;

      // Criar arquivos temporários
      const inputPath = join(this.tempDir, `input_${Date.now()}.mp3`);
      const outputPath = join(
        this.tempDir,
        `output_${Date.now()}.mp3`,
      );

      // Garantir que o diretório temp existe
      if (!existsSync(this.tempDir)) {
        const fs = require('fs');
        fs.mkdirSync(this.tempDir, { recursive: true });
      }

      // Salvar arquivo de entrada
      writeFileSync(inputPath, Buffer.from(cleanBase64, 'base64'));

      // Processar com FFmpeg
      const cleanedBuffer = await this.processAudioWithFFmpeg(
        inputPath,
        outputPath,
      );

      // Limpar arquivos temporários
      try {
        unlinkSync(inputPath);
        if (existsSync(outputPath)) {
          unlinkSync(outputPath);
        }
      } catch (cleanupError) {
        cleanerLogger.warn(
          'Erro ao limpar arquivos temporários:',
          cleanupError,
        );
      }

      const cleanedSize = cleanedBuffer.length;
      const cleanedBase64 = cleanedBuffer.toString('base64');

      cleanerLogger.info(
        `Metadados removidos com sucesso: ${fileName}`,
        {
          originalSize,
          cleanedSize,
          reduction: originalSize - cleanedSize,
        },
      );

      return {
        success: true,
        cleanedMedia: {
          data: cleanedBase64,
          fileName: this.generateCleanFileName(fileName, 'mp3'),
          mimetype: 'audio/mpeg',
          size: cleanedSize,
        },
        originalSize,
        cleanedSize,
      };
    } catch (error) {
      const errorLogger = logger.setContext('MetadataCleanerError');
      errorLogger.error(
        `Erro ao limpar metadados do áudio ${fileName}:`,
        error,
      );

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido',
        originalSize: 0,
        cleanedSize: 0,
      };
    }
  }

  /**
   * Processa vídeo com FFmpeg para remover metadados
   */
  private async processVideoWithFFmpeg(
    inputPath: string,
    outputPath: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i',
        inputPath,
        '-map_metadata',
        '-1', // Remove todos os metadados
        '-c:v',
        'libx264', // Codec de vídeo
        '-c:a',
        'aac', // Codec de áudio
        '-preset',
        'fast', // Preset para codificação mais rápida
        '-crf',
        '23', // Qualidade do vídeo
        '-y', // Sobrescrever arquivo de saída
        outputPath,
      ]);

      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          try {
            const fs = require('fs');
            const buffer = fs.readFileSync(outputPath);
            resolve(buffer);
          } catch (error) {
            reject(
              new Error(`Erro ao ler arquivo processado: ${error}`),
            );
          }
        } else {
          reject(
            new Error(`FFmpeg falhou com código ${code}: ${stderr}`),
          );
        }
      });

      ffmpeg.on('error', (error) => {
        reject(
          new Error(`Erro ao executar FFmpeg: ${error.message}`),
        );
      });
    });
  }

  /**
   * Processa áudio com FFmpeg para remover metadados
   */
  private async processAudioWithFFmpeg(
    inputPath: string,
    outputPath: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i',
        inputPath,
        '-map_metadata',
        '-1', // Remove todos os metadados
        '-c:a',
        'mp3', // Codec de áudio
        '-b:a',
        '128k', // Bitrate
        '-y', // Sobrescrever arquivo de saída
        outputPath,
      ]);

      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          try {
            const fs = require('fs');
            const buffer = fs.readFileSync(outputPath);
            resolve(buffer);
          } catch (error) {
            reject(
              new Error(`Erro ao ler arquivo processado: ${error}`),
            );
          }
        } else {
          reject(
            new Error(`FFmpeg falhou com código ${code}: ${stderr}`),
          );
        }
      });

      ffmpeg.on('error', (error) => {
        reject(
          new Error(`Erro ao executar FFmpeg: ${error.message}`),
        );
      });
    });
  }

  /**
   * Gera nome de arquivo limpo
   */
  private generateCleanFileName(
    originalName: string,
    extension: string,
  ): string {
    const timestamp = Date.now();
    const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `clean_${cleanName}_${timestamp}.${extension}`;
  }

  /**
   * Limpa metadados baseado no tipo de mídia
   */
  public async cleanMediaMetadata(
    base64Data: string,
    fileName: string,
    mimetype: string,
  ): Promise<MetadataCleanerResult> {
    const cleanerLogger = logger.setContext('MetadataCleaner');
    cleanerLogger.info(
      `Iniciando limpeza de metadados: ${fileName} (${mimetype})`,
    );

    if (mimetype.startsWith('image/')) {
      return this.cleanImageMetadata(base64Data, fileName, mimetype);
    } else if (mimetype.startsWith('video/')) {
      return this.cleanVideoMetadata(base64Data, fileName, mimetype);
    } else if (mimetype.startsWith('audio/')) {
      return this.cleanAudioMetadata(base64Data, fileName, mimetype);
    } else {
      const errorLogger = logger.setContext('MetadataCleanerError');
      errorLogger.warn(`Tipo de mídia não suportado: ${mimetype}`);

      return {
        success: false,
        error: `Tipo de mídia não suportado: ${mimetype}`,
        originalSize: 0,
        cleanedSize: 0,
      };
    }
  }
}

export const metadataCleanerService = new MetadataCleanerService();
