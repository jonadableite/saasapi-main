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
 * @route   POST /api/groups/create/:instanceName
 * @desc    Criar novo grupo
 * @access  Private
 * @rateLimit 5 requests per 5 minutes
 */
router.post(
  '/create/:instanceName',
  validateInstanceAccess,
  createGroupRateLimit,
  grupoController.createGroup.bind(grupoController),
);

/**
 * @route   GET /api/groups/fetchAllGroups/:instanceName
 * @desc    Listar todos os grupos de uma instância
 * @access  Private
 * @query   ?getParticipants=true|false
 */
router.get(
  '/fetchAllGroups/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.fetchAllGroups.bind(grupoController),
);

/**
 * @route   GET /api/groups/findGroupInfos/:instanceName
 * @desc    Buscar informações específicas de um grupo
 * @access  Private
 * @query   ?groupJid=GROUP_JID
 */
router.get(
  '/findGroupInfos/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.findGroupInfo.bind(grupoController),
);

// ========================================
// ROTAS DE GERENCIAMENTO DE PARTICIPANTES
// ========================================

/**
 * @route   GET /api/groups/participants/:instanceName
 * @desc    Listar participantes de um grupo
 * @access  Private
 * @query   ?groupJid=GROUP_JID
 */
router.get(
  '/participants/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.findParticipants.bind(grupoController),
);

/**
 * @route   POST /api/groups/updateParticipant/:instanceName
 * @desc    Gerenciar participantes (adicionar, remover, promover, rebaixar)
 * @access  Private
 * @query   ?groupJid=GROUP_JID
 * @body    { action, participants[] }
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
 * @route   POST /api/groups/updateGroupPicture/:instanceName
 * @desc    Atualizar foto do grupo
 * @access  Private
 * @query   ?groupJid=GROUP_JID
 * @body    { image }
 */
router.post(
  '/updateGroupPicture/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.updateGroupPicture.bind(grupoController),
);

/**
 * @route   POST /api/groups/updateGroupSubject/:instanceName
 * @desc    Atualizar nome/assunto do grupo
 * @access  Private
 * @query   ?groupJid=GROUP_JID
 * @body    { subject }
 */
router.post(
  '/updateGroupSubject/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.updateGroupSubject.bind(grupoController),
);

/**
 * @route   POST /api/groups/updateGroupDescription/:instanceName
 * @desc    Atualizar descrição do grupo
 * @access  Private
 * @query   ?groupJid=GROUP_JID
 * @body    { description }
 */
router.post(
  '/updateGroupDescription/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.updateGroupDescription.bind(grupoController),
);

/**
 * @route   POST /api/groups/updateSetting/:instanceName
 * @desc    Atualizar configurações do grupo
 * @access  Private
 * @query   ?groupJid=GROUP_JID
 * @body    { action }
 */
router.post(
  '/updateSetting/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.updateGroupSetting.bind(grupoController),
);

/**
 * @route   POST /api/groups/toggleEphemeral/:instanceName
 * @desc    Configurar mensagens efêmeras
 * @access  Private
 * @query   ?groupJid=GROUP_JID
 * @body    { expiration }
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
 * @route   GET /api/groups/inviteCode/:instanceName
 * @desc    Obter código de convite do grupo
 * @access  Private
 * @query   ?groupJid=GROUP_JID
 */
router.get(
  '/inviteCode/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.fetchInviteCode.bind(grupoController),
);

/**
 * @route   POST /api/groups/revokeInviteCode/:instanceName
 * @desc    Revogar código de convite do grupo
 * @access  Private
 * @query   ?groupJid=GROUP_JID
 */
router.post(
  '/revokeInviteCode/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.revokeInviteCode.bind(grupoController),
);

/**
 * @route   POST /api/groups/sendInvite/:instanceName
 * @desc    Enviar convite para participar do grupo
 * @access  Private
 * @body    { groupJid, description, numbers[] }
 * @rateLimit 10 requests per 2 minutes
 */
router.post(
  '/sendInvite/:instanceName',
  validateInstanceAccess,
  inviteRateLimit,
  grupoController.sendInvite.bind(grupoController),
);

/**
 * @route   GET /api/groups/inviteInfo/:instanceName
 * @desc    Buscar informações de grupo por código de convite
 * @access  Private
 * @query   ?inviteCode=INVITE_CODE
 */
router.get(
  '/inviteInfo/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.findGroupByInviteCode.bind(grupoController),
);

// ========================================
// ROTAS DE AÇÕES ESPECIAIS
// ========================================

/**
 * @route   DELETE /api/groups/leaveGroup/:instanceName
 * @desc    Sair do grupo
 * @access  Private
 * @query   ?groupJid=GROUP_JID
 */
router.delete(
  '/leaveGroup/:instanceName',
  validateInstanceAccess,
  groupRateLimit,
  grupoController.leaveGroup.bind(grupoController),
);

export default router;
