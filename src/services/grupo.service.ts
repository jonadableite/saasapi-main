// src/services/grupo.service.ts

import axios, { AxiosResponse } from 'axios';
import { logger } from '../utils/logger';

const groupLogger = logger.setContext('GroupService');

export interface CreateGroupData {
  subject: string;
  description?: string;
  participants: string[];
}

export interface UpdateGroupPictureData {
  groupJid: string;
  image: string;
}

export interface UpdateGroupSubjectData {
  groupJid: string;
  subject: string;
}

export interface UpdateGroupDescriptionData {
  groupJid: string;
  description: string;
}

export interface UpdateParticipantData {
  groupJid: string;
  action: 'add' | 'remove' | 'promote' | 'demote';
  participants: string[];
}

export interface UpdateGroupSettingData {
  groupJid: string;
  action: 'announcement' | 'not_announcement' | 'locked' | 'unlocked';
}

export interface ToggleEphemeralData {
  groupJid: string;
  expiration: 0 | 86400 | 604800 | 7776000; // 0=Off, 24h, 7d, 90d
}

export interface SendInviteData {
  groupJid: string;
  description: string;
  numbers: string[];
}

export interface GroupParticipant {
  id: string;
  admin?: 'admin' | 'superadmin' | null;
}

export interface GroupInfo {
  id: string;
  subject: string;
  subjectOwner?: string;
  subjectTime?: number;
  creation?: number;
  owner?: string;
  desc?: string;
  descId?: string;
  descTime?: number;
  descOwner?: string;
  restrict?: boolean;
  announce?: boolean;
  size?: number;
  participants?: GroupParticipant[];
  ephemeralDuration?: number;
  inviteCode?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class GrupoService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.API_EVO_URL!;
    this.apiKey = process.env.EVO_API_KEY!;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      apikey: this.apiKey,
    };
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    params?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    try {
      const config = {
        method,
        url: `${this.apiUrl}${endpoint}`,
        headers: this.getHeaders(),
        data,
        params,
      };

      groupLogger.info(`Making ${method} request to ${endpoint}`, {
        endpoint,
        params,
        hasData: !!data,
      });

      const response: AxiosResponse<T> = await axios(config);

      groupLogger.info(`Request successful`, {
        endpoint,
        status: response.status,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      groupLogger.error(`Request failed for ${endpoint}`, error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Erro desconhecido';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Criar grupo
  async createGroup(
    instanceName: string,
    groupData: CreateGroupData,
  ): Promise<ApiResponse<any>> {
    groupLogger.info('Creating group', {
      instanceName,
      subject: groupData.subject,
    });

    return this.makeRequest(
      'POST',
      `/group/create/${instanceName}`,
      groupData,
    );
  }

  // Listar todos os grupos
  async fetchAllGroups(
    instanceName: string,
    getParticipants: boolean = false,
  ): Promise<ApiResponse<GroupInfo[]>> {
    groupLogger.info('Fetching all groups', {
      instanceName,
      getParticipants,
    });

    return this.makeRequest(
      'GET',
      `/group/fetchAllGroups/${instanceName}`,
      undefined,
      { getParticipants: getParticipants.toString() },
    );
  }

  // Buscar informações de um grupo específico
  async findGroupInfo(
    instanceName: string,
    groupJid: string,
  ): Promise<ApiResponse<GroupInfo>> {
    groupLogger.info('Finding group info', {
      instanceName,
      groupJid,
    });

    return this.makeRequest(
      'GET',
      `/group/findGroupInfos/${instanceName}`,
      undefined,
      { groupJid },
    );
  }

  // Buscar participantes do grupo
  async findParticipants(
    instanceName: string,
    groupJid: string,
  ): Promise<ApiResponse<GroupParticipant[]>> {
    groupLogger.info('Finding group participants', {
      instanceName,
      groupJid,
    });

    return this.makeRequest(
      'GET',
      `/group/participants/${instanceName}`,
      undefined,
      { groupJid },
    );
  }

  // Atualizar participantes (adicionar, remover, promover, rebaixar)
  async updateParticipant(
    instanceName: string,
    participantData: UpdateParticipantData,
  ): Promise<ApiResponse<any>> {
    groupLogger.info('Updating participant', {
      instanceName,
      groupJid: participantData.groupJid,
      action: participantData.action,
      participantsCount: participantData.participants.length,
    });

    const { groupJid, ...body } = participantData;

    return this.makeRequest(
      'POST',
      `/group/updateParticipant/${instanceName}`,
      body,
      { groupJid },
    );
  }

  // Atualizar foto do grupo
  async updateGroupPicture(
    instanceName: string,
    pictureData: UpdateGroupPictureData,
  ): Promise<ApiResponse<any>> {
    groupLogger.info('Updating group picture', {
      instanceName,
      groupJid: pictureData.groupJid,
    });

    const { groupJid, ...body } = pictureData;

    return this.makeRequest(
      'POST',
      `/group/updateGroupPicture/${instanceName}`,
      body,
      { groupJid },
    );
  }

  // Atualizar nome do grupo
  async updateGroupSubject(
    instanceName: string,
    subjectData: UpdateGroupSubjectData,
  ): Promise<ApiResponse<any>> {
    groupLogger.info('Updating group subject', {
      instanceName,
      groupJid: subjectData.groupJid,
      subject: subjectData.subject,
    });

    const { groupJid, ...body } = subjectData;

    return this.makeRequest(
      'POST',
      `/group/updateGroupSubject/${instanceName}`,
      body,
      { groupJid },
    );
  }

  // Atualizar descrição do grupo
  async updateGroupDescription(
    instanceName: string,
    descriptionData: UpdateGroupDescriptionData,
  ): Promise<ApiResponse<any>> {
    groupLogger.info('Updating group description', {
      instanceName,
      groupJid: descriptionData.groupJid,
    });

    const { groupJid, ...body } = descriptionData;

    return this.makeRequest(
      'POST',
      `/group/updateGroupDescription/${instanceName}`,
      body,
      { groupJid },
    );
  }

  // Atualizar configurações do grupo
  async updateGroupSetting(
    instanceName: string,
    settingData: UpdateGroupSettingData,
  ): Promise<ApiResponse<any>> {
    groupLogger.info('Updating group setting', {
      instanceName,
      groupJid: settingData.groupJid,
      action: settingData.action,
    });

    const { groupJid, ...body } = settingData;

    return this.makeRequest(
      'POST',
      `/group/updateSetting/${instanceName}`,
      body,
      { groupJid },
    );
  }

  // Alternar mensagens efêmeras
  async toggleEphemeral(
    instanceName: string,
    ephemeralData: ToggleEphemeralData,
  ): Promise<ApiResponse<any>> {
    groupLogger.info('Toggling ephemeral messages', {
      instanceName,
      groupJid: ephemeralData.groupJid,
      expiration: ephemeralData.expiration,
    });

    const { groupJid, ...body } = ephemeralData;

    return this.makeRequest(
      'POST',
      `/group/toggleEphemeral/${instanceName}`,
      body,
      { groupJid },
    );
  }

  // Obter código de convite
  async fetchInviteCode(
    instanceName: string,
    groupJid: string,
  ): Promise<ApiResponse<{ inviteCode: string }>> {
    groupLogger.info('Fetching invite code', {
      instanceName,
      groupJid,
    });

    return this.makeRequest(
      'GET',
      `/group/inviteCode/${instanceName}`,
      undefined,
      { groupJid },
    );
  }

  // Revogar código de convite
  async revokeInviteCode(
    instanceName: string,
    groupJid: string,
  ): Promise<ApiResponse<any>> {
    groupLogger.info('Revoking invite code', {
      instanceName,
      groupJid,
    });

    return this.makeRequest(
      'POST',
      `/group/revokeInviteCode/${instanceName}`,
      {},
      { groupJid },
    );
  }

  // Enviar convite por URL
  async sendInvite(
    instanceName: string,
    inviteData: SendInviteData,
  ): Promise<ApiResponse<any>> {
    groupLogger.info('Sending invite', {
      instanceName,
      groupJid: inviteData.groupJid,
      numbersCount: inviteData.numbers.length,
    });

    return this.makeRequest(
      'POST',
      `/group/sendInvite/${instanceName}`,
      inviteData,
    );
  }

  // Buscar grupo por código de convite
  async findGroupByInviteCode(
    instanceName: string,
    inviteCode: string,
  ): Promise<ApiResponse<GroupInfo>> {
    groupLogger.info('Finding group by invite code', {
      instanceName,
      inviteCode,
    });

    return this.makeRequest(
      'GET',
      `/group/inviteInfo/${instanceName}`,
      undefined,
      { inviteCode },
    );
  }

  // Sair do grupo
  async leaveGroup(
    instanceName: string,
    groupJid: string,
  ): Promise<ApiResponse<any>> {
    groupLogger.info('Leaving group', { instanceName, groupJid });

    return this.makeRequest(
      'DELETE',
      `/group/leaveGroup/${instanceName}`,
      undefined,
      { groupJid },
    );
  }

  // Método auxiliar para formatar número de telefone
  formatPhoneNumber(number: string): string {
    // Remove todos os caracteres não numéricos
    const cleaned = number.replace(/\D/g, '');

    // Se não começar com código do país, adiciona 55 (Brasil)
    if (!cleaned.startsWith('55') && cleaned.length <= 11) {
      return `55${cleaned}`;
    }

    return cleaned;
  }

  // Método auxiliar para validar JID do grupo
  isValidGroupJid(jid: string): boolean {
    return jid.includes('@g.us');
  }

  // Método auxiliar para extrair número do JID
  extractNumberFromJid(jid: string): string {
    return jid.split('@')[0];
  }
}

export const grupoService = new GrupoService();
