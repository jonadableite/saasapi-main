// src/controllers/grupo.controller.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { EvolutionApiService } from '../services/evolution-api.service';
import { grupoService } from '../services/grupo.service';
import { logger } from '../utils/logger';

const controllerLogger = logger.setContext('GroupController');

// Schemas de validação (mantidos inalterados)
const createGroupSchema = z.object({
  instanceName: z.string().min(1, 'Nome da instância é obrigatório'),
  subject: z
    .string()
    .min(1, 'Nome do grupo é obrigatório')
    .max(100, 'Nome muito longo'),
  description: z.string().optional(),
  participants: z
    .array(z.string())
    .min(1, 'Pelo menos um participante é necessário'),
});

const updateParticipantSchema = z.object({
  instanceName: z.string().min(1, 'Nome da instância é obrigatório'),
  groupJid: z.string().min(1, 'JID do grupo é obrigatório'),
  action: z.enum(['add', 'remove', 'promote', 'demote']),
  participants: z
    .array(z.string())
    .min(1, 'Lista de participantes não pode estar vazia'),
});

const updateGroupPictureSchema = z.object({
  instanceName: z.string().min(1, 'Nome da instância é obrigatório'),
  groupJid: z.string().min(1, 'JID do grupo é obrigatório'),
  image: z.string().url('URL da imagem inválida'),
});

const updateGroupSubjectSchema = z.object({
  instanceName: z.string().min(1, 'Nome da instância é obrigatório'),
  groupJid: z.string().min(1, 'JID do grupo é obrigatório'),
  subject: z
    .string()
    .min(1, 'Nome do grupo é obrigatório')
    .max(100, 'Nome muito longo'),
});

const updateGroupDescriptionSchema = z.object({
  instanceName: z.string().min(1, 'Nome da instância é obrigatório'),
  groupJid: z.string().min(1, 'JID do grupo é obrigatório'),
  description: z.string().max(500, 'Descrição muito longa'),
});

const updateGroupSettingSchema = z.object({
  instanceName: z.string().min(1, 'Nome da instância é obrigatório'),
  groupJid: z.string().min(1, 'JID do grupo é obrigatório'),
  action: z.enum([
    'announcement',
    'not_announcement',
    'locked',
    'unlocked',
  ]),
});

const toggleEphemeralSchema = z.object({
  instanceName: z.string().min(1, 'Nome da instância é obrigatório'),
  groupJid: z.string().min(1, 'JID do grupo é obrigatório'),
  expiration: z
    .enum(['0', '86400', '604800', '7776000'])
    .transform(Number),
});

const sendInviteSchema = z.object({
  instanceName: z.string().min(1, 'Nome da instância é obrigatório'),
  groupJid: z.string().min(1, 'JID do grupo é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  numbers: z
    .array(z.string())
    .min(1, 'Lista de números não pode estar vazia'),
});

export class GrupoController {
  private evolutionService: EvolutionApiService; // Declaração da propriedade

  constructor() {
    this.evolutionService = new EvolutionApiService(); // Inicialização da propriedade
  }

  // Criar grupo
  async createGroup(req: Request, res: Response) {
    try {
      const validatedData = createGroupSchema.parse(req.body);

      controllerLogger.info('Creating group request', {
        instanceName: validatedData.instanceName,
        subject: validatedData.subject,
        participantsCount: validatedData.participants.length,
      });

      // Formatar números de telefone
      const formattedParticipants = validatedData.participants.map(
        (number) => grupoService.formatPhoneNumber(number),
      );

      const result = await grupoService.createGroup(
        validatedData.instanceName,
        {
          subject: validatedData.subject,
          description: validatedData.description,
          participants: formattedParticipants,
        },
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao criar grupo',
          error: result.error,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Grupo criado com sucesso',
        data: result.data,
      });
    } catch (error: any) {
      controllerLogger.error('Error creating group', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // Listar grupos
  async fetchAllGroups(req: Request, res: Response) {
    try {
      const { instanceName } = req.params;
      const getParticipants = req.query.getParticipants === 'true';

      if (!instanceName) {
        return res.status(400).json({
          success: false,
          message: 'Nome da instância é obrigatório',
        });
      }

      controllerLogger.info('Fetching all groups', {
        instanceName,
        getParticipants,
      });

      const result = await grupoService.fetchAllGroups(
        instanceName,
        getParticipants,
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao buscar grupos',
          error: result.error,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Grupos buscados com sucesso',
        data: result.data,
      });
    } catch (error: any) {
      controllerLogger.error('Error fetching all groups', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // Buscar informações do grupo
  async findGroupInfo(req: Request, res: Response) {
    try {
      const { instanceName } = req.params;
      const { groupJid } = req.query;

      if (!instanceName || !groupJid) {
        return res.status(400).json({
          success: false,
          message:
            'Nome da instância e JID do grupo são obrigatórios',
        });
      }

      if (!grupoService.isValidGroupJid(groupJid as string)) {
        return res.status(400).json({
          success: false,
          message: 'JID do grupo inválido',
        });
      }

      controllerLogger.info('Finding group info', {
        instanceName,
        groupJid,
      });

      const result = await grupoService.findGroupInfo(
        instanceName,
        groupJid as string,
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao buscar informações do grupo',
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Informações do grupo encontradas',
        data: result.data,
      });
    } catch (error: any) {
      controllerLogger.error('Error finding group info', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // Buscar participantes
  async findParticipants(req: Request, res: Response) {
    try {
      const { instanceName } = req.params;
      const { groupJid } = req.query;

      if (!instanceName || !groupJid) {
        return res.status(400).json({
          success: false,
          message:
            'Nome da instância e JID do grupo são obrigatórios',
        });
      }

      controllerLogger.info('Finding participants', {
        instanceName,
        groupJid,
      });

      const result = await grupoService.findParticipants(
        instanceName,
        groupJid as string,
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao buscar participantes',
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Participantes encontrados',
        data: result.data,
      });
    } catch (error: any) {
      controllerLogger.error('Error finding participants', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // Atualizar participante
  async updateParticipant(req: Request, res: Response) {
    try {
      const { instanceName } = req.params;
      const validatedData = updateParticipantSchema.parse({
        instanceName,
        ...req.body,
      });

      controllerLogger.info('Updating participant', {
        instanceName: validatedData.instanceName,
        groupJid: validatedData.groupJid,
        action: validatedData.action,
        participantsCount: validatedData.participants.length,
      });

      // Formatar números de telefone
      const formattedParticipants = validatedData.participants.map(
        (number) => grupoService.formatPhoneNumber(number),
      );

      const result = await grupoService.updateParticipant(
        validatedData.instanceName,
        {
          groupJid: validatedData.groupJid,
          action: validatedData.action,
          participants: formattedParticipants,
        },
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao atualizar participante',
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Participante atualizado com sucesso',
        data: result.data,
      });
    } catch (error: any) {
      controllerLogger.error('Error updating participant', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // Atualizar foto do grupo
  async updateGroupPicture(req: Request, res: Response) {
    try {
      const { instanceName } = req.params;
      const validatedData = updateGroupPictureSchema.parse({
        instanceName,
        ...req.body,
      });

      controllerLogger.info('Updating group picture', {
        instanceName: validatedData.instanceName,
        groupJid: validatedData.groupJid,
      });

      const result = await grupoService.updateGroupPicture(
        validatedData.instanceName,
        {
          groupJid: validatedData.groupJid,
          image: validatedData.image,
        },
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao atualizar foto do grupo',
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Foto do grupo atualizada com sucesso',
        data: result.data,
      });
    } catch (error: any) {
      controllerLogger.error('Error updating group picture', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // Atualizar nome do grupo
  async updateGroupSubject(req: Request, res: Response) {
    try {
      const { instanceName } = req.params;
      const validatedData = updateGroupSubjectSchema.parse({
        instanceName,
        ...req.body,
      });

      controllerLogger.info('Updating group subject', {
        instanceName: validatedData.instanceName,
        groupJid: validatedData.groupJid,
        subject: validatedData.subject,
      });

      const result = await grupoService.updateGroupSubject(
        validatedData.instanceName,
        {
          groupJid: validatedData.groupJid,
          subject: validatedData.subject,
        },
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao atualizar nome do grupo',
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Nome do grupo atualizado com sucesso',
        data: result.data,
      });
    } catch (error: any) {
      controllerLogger.error('Error updating group subject', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // Atualizar descrição do grupo
  async updateGroupDescription(req: Request, res: Response) {
    try {
      const { instanceName } = req.params;
      const validatedData = updateGroupDescriptionSchema.parse({
        instanceName,
        ...req.body,
      });

      controllerLogger.info('Updating group description', {
        instanceName: validatedData.instanceName,
        groupJid: validatedData.groupJid,
      });

      const result = await grupoService.updateGroupDescription(
        validatedData.instanceName,
        {
          groupJid: validatedData.groupJid,
          description: validatedData.description,
        },
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao atualizar descrição do grupo',
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Descrição do grupo atualizada com sucesso',
        data: result.data,
      });
    } catch (error: any) {
      controllerLogger.error(
        'Error updating group description',
        error,
      );

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // Atualizar configurações do grupo
  async updateGroupSetting(req: Request, res: Response) {
    try {
      const { instanceName } = req.params;
      const validatedData = updateGroupSettingSchema.parse({
        instanceName,
        ...req.body,
      });

      controllerLogger.info('Updating group setting', {
        instanceName: validatedData.instanceName,
        groupJid: validatedData.groupJid,
        action: validatedData.action,
      });

      const result = await grupoService.updateGroupSetting(
        validatedData.instanceName,
        {
          groupJid: validatedData.groupJid,
          action: validatedData.action,
        },
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao atualizar configurações do grupo',
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Configurações do grupo atualizadas com sucesso',
        data: result.data,
      });
    } catch (error: any) {
      controllerLogger.error('Error updating group setting', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // Alternar mensagens efêmeras
  async toggleEphemeral(req: Request, res: Response) {
    try {
      const { instanceName } = req.params;
      const validatedData = toggleEphemeralSchema.parse({
        instanceName,
        ...req.body,
      });

      controllerLogger.info('Toggling ephemeral messages', {
        instanceName: validatedData.instanceName,
        groupJid: validatedData.groupJid,
        expiration: validatedData.expiration,
      });

      const result = await grupoService.toggleEphemeral(
        validatedData.instanceName,
        {
          groupJid: validatedData.groupJid,
          expiration: validatedData.expiration as
            | 0
            | 86400
            | 604800
            | 7776000,
        },
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao alterar mensagens efêmeras',
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Mensagens efêmeras configuradas com sucesso',
        data: result.data,
      });
    } catch (error: any) {
      controllerLogger.error(
        'Error toggling ephemeral messages',
        error,
      );

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // Obter código de convite
  async fetchInviteCode(req: Request, res: Response) {
    try {
      const { instanceName } = req.params;
      const { groupJid } = req.query;

      if (!instanceName || !groupJid) {
        return res.status(400).json({
          success: false,
          message:
            'Nome da instância e JID do grupo são obrigatórios',
        });
      }

      controllerLogger.info('Fetching invite code', {
        instanceName,
        groupJid,
      });

      const result = await grupoService.fetchInviteCode(
        instanceName,
        groupJid as string,
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao obter código de convite',
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Código de convite obtido com sucesso',
        data: result.data,
      });
    } catch (error: any) {
      controllerLogger.error('Error fetching invite code', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // Revogar código de convite
  async revokeInviteCode(req: Request, res: Response) {
    try {
      const { instanceName } = req.params;
      const { groupJid } = req.query;

      if (!instanceName || !groupJid) {
        return res.status(400).json({
          success: false,
          message:
            'Nome da instância e JID do grupo são obrigatórios',
        });
      }

      controllerLogger.info('Revoking invite code', {
        instanceName,
        groupJid,
      });

      const result = await grupoService.revokeInviteCode(
        instanceName,
        groupJid as string,
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao revogar código de convite',
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Código de convite revogado com sucesso',
        data: result.data,
      });
    } catch (error: any) {
      controllerLogger.error('Error revoking invite code', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // Enviar convite
  async sendInvite(req: Request, res: Response) {
    try {
      const { instanceName } = req.params;
      const validatedData = sendInviteSchema.parse({
        instanceName,
        ...req.body,
      });

      controllerLogger.info('Sending invite', {
        instanceName: validatedData.instanceName,
        groupJid: validatedData.groupJid,
        numbersCount: validatedData.numbers.length,
      });

      // Formatar números de telefone
      const formattedNumbers = validatedData.numbers.map((number) =>
        grupoService.formatPhoneNumber(number),
      );

      const result = await grupoService.sendInvite(
        validatedData.instanceName,
        {
          groupJid: validatedData.groupJid,
          description: validatedData.description,
          numbers: formattedNumbers,
        },
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao enviar convite',
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Convite enviado com sucesso',
        data: result.data,
      });
    } catch (error: any) {
      controllerLogger.error('Error sending invite', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // Buscar grupo por código de convite
  async findGroupByInviteCode(req: Request, res: Response) {
    try {
      const { instanceName } = req.params;
      const { inviteCode } = req.query;

      if (!instanceName || !inviteCode) {
        return res.status(400).json({
          success: false,
          message:
            'Nome da instância e código de convite são obrigatórios',
        });
      }

      controllerLogger.info('Finding group by invite code', {
        instanceName,
        inviteCode,
      });

      const result = await grupoService.findGroupByInviteCode(
        instanceName,
        inviteCode as string,
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao buscar grupo por código de convite',
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Grupo encontrado',
        data: result.data,
      });
    } catch (error: any) {
      controllerLogger.error(
        'Error finding group by invite code',
        error,
      );
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  // Sair do grupo
  async leaveGroup(req: Request, res: Response) {
    try {
      const { instanceName } = req.params;
      const { groupJid } = req.query;

      if (!instanceName || !groupJid) {
        return res.status(400).json({
          success: false,
          message:
            'Nome da instância e JID do grupo são obrigatórios',
        });
      }

      controllerLogger.info('Leaving group', {
        instanceName,
        groupJid,
      });

      const result = await grupoService.leaveGroup(
        instanceName,
        groupJid as string,
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'Erro ao sair do grupo',
          error: result.error,
        });
      }

      res.json({
        success: true,
        message: 'Saiu do grupo com sucesso',
        data: result.data,
      });
    } catch (error: any) {
      controllerLogger.error('Error leaving group', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }

  async sendTextToGroup(req: Request, res: Response) {
    const { instanceName } = req.params;
    const {
      groupJid,
      text,
      delay,
      quoted,
      linkPreview,
      mentionsEveryOne,
      mentioned,
    } = req.body;

    if (!groupJid || !text) {
      return res.status(400).json({
        success: false,
        error: 'groupJid e text são obrigatórios.',
      });
    }

    try {
      const result = await this.evolutionService.sendTextToGroup({
        instanceName,
        groupJid,
        text,
        delay,
        quoted,
        linkPreview,
        mentionsEveryOne,
        mentioned,
      });
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(500).json(result);
    } catch (error: any) {
      console.error('Erro no controlador sendTextToGroup:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Falha ao enviar texto para o grupo.',
      });
    }
  }

  async sendMediaToGroup(req: Request, res: Response) {
    const { instanceName } = req.params;
    const {
      groupJid,
      mediatype,
      mimetype,
      media,
      caption,
      fileName,
      delay,
      quoted,
      mentionsEveryOne,
      mentioned,
    } = req.body;

    if (!groupJid || !mediatype || !mimetype || !media) {
      return res.status(400).json({
        success: false,
        error:
          'groupJid, mediatype, mimetype e media são obrigatórios.',
      });
    }

    try {
      const result = await this.evolutionService.sendMediaToGroup({
        instanceName,
        groupJid,
        mediatype,
        mimetype,
        media,
        caption,
        fileName,
        delay,
        quoted,
        mentionsEveryOne,
        mentioned,
      });
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(500).json(result);
    } catch (error: any) {
      console.error('Erro no controlador sendMediaToGroup:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Falha ao enviar mídia para o grupo.',
      });
    }
  }

  async sendStickerToGroup(req: Request, res: Response) {
    const { instanceName } = req.params;
    const {
      groupJid,
      sticker,
      delay,
      quoted,
      mentionsEveryOne,
      mentioned,
    } = req.body;

    if (!groupJid || !sticker) {
      return res.status(400).json({
        success: false,
        error: 'groupJid e sticker são obrigatórios.',
      });
    }

    try {
      const result = await this.evolutionService.sendStickerToGroup({
        instanceName,
        groupJid,
        sticker,
        delay,
        quoted,
        mentionsEveryOne,
        mentioned,
      });
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(500).json(result);
    } catch (error: any) {
      console.error('Erro no controlador sendStickerToGroup:', error);
      return res.status(500).json({
        success: false,
        error:
          error.message || 'Falha ao enviar figurinha para o grupo.',
      });
    }
  }

  async sendAudioToGroup(req: Request, res: Response) {
    const { instanceName } = req.params;
    const {
      groupJid,
      audio,
      delay,
      quoted,
      mentionsEveryOne,
      mentioned,
      encoding,
    } = req.body;

    if (!groupJid || !audio) {
      return res.status(400).json({
        success: false,
        error: 'groupJid e audio são obrigatórios.',
      });
    }

    try {
      const result = await this.evolutionService.sendAudioToGroup({
        instanceName,
        groupJid,
        audio,
        delay,
        quoted,
        mentionsEveryOne,
        mentioned,
        encoding,
      });
      if (result.success) {
        return res.status(200).json(result);
      }
      return res.status(500).json(result);
    } catch (error: any) {
      console.error('Erro no controlador sendAudioToGroup:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Falha ao enviar áudio para o grupo.',
      });
    }
  }
}

export const grupoController = new GrupoController();
