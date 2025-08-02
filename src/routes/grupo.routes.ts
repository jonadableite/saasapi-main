// src/routes/grupo.routes.ts
import { Router } from 'express';
import { grupoController } from '../controllers/grupo.controller';
import { authMiddleware } from '../middlewares/authenticate';
import { validateInstanceAccess } from '../middlewares/instanceAccess';
import { checkPlanLimits } from '../middlewares/planLimits';
import {
  createGroupRateLimit,
  groupRateLimit,
  inviteRateLimit,
} from '../middlewares/rateLimit';

const router = Router();

// Middlewares globais para todas as rotas de grupo
router.use(authMiddleware);
router.use(checkPlanLimits);

// ========================================
// ROTAS DE GERENCIAMENTO DE GRUPOS
// ========================================

/**
 * @route POST /api/groups/create/:instanceName
 * @desc Criar novo grupo
 * @access Private
 * @rateLimit 5 requests per 5 minutes
 */
router.post(
  '/create/:instanceName',
  validateInstanceAccess,
  createGroupRateLimit,
  grupoController.createGroup.bind(grupoController),
);

/**
 * @route GET /api/groups/fetchAllGroups/:instanceName
 * @desc Listar todos os grupos de uma instância
 * @access Private
 * @query ?getParticipants=true|false
 */
router.get(
  '/fetchAllGroups/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.fetchAllGroups.bind(grupoController),
);

/**
 * @route GET /api/groups/findGroupInfos/:instanceName
 * @desc Buscar informações específicas de um grupo
 * @access Private
 * @query ?groupJid=GROUP_JID
 */
router.get(
  '/findGroupInfos/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.findGroupInfo.bind(grupoController),
);

/**
 * @route DELETE /api/groups/leaveGroup/:instanceName
 * @desc Sair de um grupo
 * @access Private
 * @query ?groupJid=GROUP_JID
 */
router.delete(
  '/leaveGroup/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.leaveGroup.bind(grupoController),
);

// ========================================
// ROTAS DE GERENCIAMENTO DE PARTICIPANTES
// ========================================

/**
 * @route GET /api/groups/participants/:instanceName
 * @desc Listar participantes de um grupo
 * @access Private
 * @query ?groupJid=GROUP_JID
 */
router.get(
  '/participants/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.findParticipants.bind(grupoController),
);

/**
 * @route POST /api/groups/updateParticipant/:instanceName
 * @desc Gerenciar participantes (adicionar, remover, promover, rebaixar)
 * @access Private
 * @query ?groupJid=GROUP_JID
 * @body { action, participants[] }
 */
router.post(
  '/updateParticipant/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.updateParticipant.bind(grupoController),
);

// ========================================
// ROTAS DE CONFIGURAÇÕES DO GRUPO
// ========================================

/**
 * @route POST /api/groups/updateGroupPicture/:instanceName
 * @desc Atualizar foto do grupo
 * @access Private
 * @query ?groupJid=GROUP_JID
 * @body { image }
 */
router.post(
  '/updateGroupPicture/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.updateGroupPicture.bind(grupoController),
);

/**
 * @route POST /api/groups/updateGroupSubject/:instanceName
 * @desc Atualizar nome/assunto do grupo
 * @access Private
 * @query ?groupJid=GROUP_JID
 * @body { subject }
 */
router.post(
  '/updateGroupSubject/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.updateGroupSubject.bind(grupoController),
);

/**
 * @route POST /api/groups/updateGroupDescription/:instanceName
 * @desc Atualizar descrição do grupo
 * @access Private
 * @query ?groupJid=GROUP_JID
 * @body { description }
 */
router.post(
  '/updateGroupDescription/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.updateGroupDescription.bind(grupoController),
);

/**
 * @route POST /api/groups/updateSetting/:instanceName
 * @desc Atualizar configurações do grupo
 * @access Private
 * @query ?groupJid=GROUP_JID
 * @body { action }
 */
router.post(
  '/updateSetting/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.updateGroupSetting.bind(grupoController),
);

/**
 * @route POST /api/groups/toggleEphemeral/:instanceName
 * @desc Configurar mensagens efêmeras
 * @access Private
 * @query ?groupJid=GROUP_JID
 * @body { expiration }
 */
router.post(
  '/toggleEphemeral/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.toggleEphemeral.bind(grupoController),
);

// ========================================
// ROTAS DE CONVITES
// ========================================

/**
 * @route GET /api/groups/inviteCode/:instanceName
 * @desc Obter código de convite do grupo
 * @access Private
 * @query ?groupJid=GROUP_JID
 */
router.get(
  '/inviteCode/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.fetchInviteCode.bind(grupoController),
);

/**
 * @route POST /api/groups/revokeInviteCode/:instanceName
 * @desc Revogar código de convite do grupo
 * @access Private
 * @query ?groupJid=GROUP_JID
 */
router.post(
  '/revokeInviteCode/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.revokeInviteCode.bind(grupoController),
);

/**
 * @route POST /api/groups/sendInvite/:instanceName
 * @desc Enviar link de convite do grupo para números específicos
 * @access Private
 * @body { groupJid, description, numbers[] }
 */
router.post(
  '/sendInvite/:instanceName',
  validateInstanceAccess,
  inviteRateLimit, // Using inviteRateLimit as it's related to invites
  grupoController.sendInvite.bind(grupoController),
);

/**
 * @route GET /api/groups/inviteInfo/:instanceName
 * @desc Buscar informações de um grupo pelo código de convite
 * @access Private
 * @query ?inviteCode=INVITE_CODE
 */
router.get(
  '/inviteInfo/:instanceName',
  validateInstanceAccess,
  inviteRateLimit, // Using inviteRateLimit
  grupoController.findGroupByInviteCode.bind(grupoController),
);

// ========================================
// ROTAS DE ENVIO DE MENSAGENS PARA GRUPOS
// ========================================

/**
 * @route POST /api/groups/sendTextToGroup/:instanceName
 * @desc Enviar mensagem de texto para um grupo
 * @access Private
 * @body { groupJid, text, delay?, quoted?, linkPreview?, mentionsEveryOne?, mentioned?[] }
 */
router.post(
  '/sendTextToGroup/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.sendTextToGroup.bind(grupoController),
);

/**
 * @route POST /api/groups/sendMediaToGroup/:instanceName
 * @desc Enviar mídia (imagem, vídeo, documento) para um grupo
 * @access Private
 * @body { groupJid, mediatype, mimetype, media, caption?, fileName?, delay?, quoted?, mentionsEveryOne?, mentioned?[] }
 */
router.post(
  '/sendMediaToGroup/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.sendMediaToGroup.bind(grupoController),
);

/**
 * @route POST /api/groups/sendStickerToGroup/:instanceName
 * @desc Enviar figurinha para um grupo
 * @access Private
 * @body { groupJid, sticker, delay?, quoted?, mentionsEveryOne?, mentioned?[] }
 */
router.post(
  '/sendStickerToGroup/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.sendStickerToGroup.bind(grupoController),
);

/**
 * @route POST /api/groups/sendAudioToGroup/:instanceName
 * @desc Enviar áudio narrado para um grupo
 * @access Private
 * @body { groupJid, audio, delay?, quoted?, mentionsEveryOne?, mentioned?[], encoding? }
 */
router.post(
  '/sendAudioToGroup/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.sendAudioToGroup.bind(grupoController),
);

export default router;
