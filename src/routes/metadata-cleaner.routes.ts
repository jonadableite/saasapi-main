// src/routes/metadata-cleaner.routes.ts
import { Router } from 'express';
import { metadataCleanerController } from '../controllers/metadata-cleaner.controller';

const router = Router();

/**
 * @route POST /api/metadata-cleaner/test
 * @desc Testa a limpeza de metadados de uma mídia
 * @access Public
 */
router.post('/test', metadataCleanerController.testMetadataCleaning);

/**
 * @route GET /api/metadata-cleaner/supported-types
 * @desc Retorna informações sobre os tipos de mídia suportados
 * @access Public
 */
router.get(
  '/supported-types',
  metadataCleanerController.getSupportedMediaTypes,
);

export default router;
