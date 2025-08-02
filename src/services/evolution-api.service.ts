// src/services/evolution-api.service.ts
import { logger } from '@/utils/logger';
import axios from 'axios';

const evolutionLogger = logger.setContext('EvolutionApiService');

export class EvolutionApiService {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl =
      process.env.EVOLUTION_API_URL || 'https://evo.whatlead.com.br';
    this.apiKey = process.env.EVOLUTION_API_KEY || '';
  }

  private async makeRequest(
    endpoint: string,
    method: string,
    data: any,
  ): Promise<any> {
    try {
      const response = await axios({
        method,
        url: `${this.apiUrl}${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
        },
        data,
      });
      return {
        success: true,
        messageId: response.data?.id || response.data?.messageId,
        data: response.data,
      };
    } catch (error: any) {
      evolutionLogger.error(
        `Erro na requisição: ${endpoint}`,
        error.response?.data || error.message,
      );
      return {
        success: false,
        error:
          error.response?.data?.message ||
          error.message ||
          'Erro desconhecido',
      };
    }
  }

  async sendMessage(params: {
    instanceName: string;
    number: string;
    text: string;
    options?: any;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest(
        `/message/sendText/${params.instanceName}`,
        'POST',
        {
          number: params.number,
          text: params.text,
          ...params.options,
        },
      );
      return response;
    } catch (error: any) {
      evolutionLogger.error(
        `Erro ao enviar mensagem de texto para ${params.number}`,
        error,
      );
      return {
        success: false,
        error: error.message || 'Falha ao enviar mensagem de texto',
      };
    }
  }

  async sendMedia(params: {
    instanceName: string;
    number: string;
    mediatype: string;
    media: string;
    caption?: string;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest(
        `/message/sendMedia/${params.instanceName}`,
        'POST',
        {
          number: params.number,
          mediatype: params.mediatype,
          media: params.media,
          caption: params.caption,
        },
      );
      return response;
    } catch (error: any) {
      evolutionLogger.error(
        `Erro ao enviar mídia para ${params.number}`,
        error,
      );
      return { success: false, error: 'Falha ao enviar mídia' };
    }
  }

  async sendButton(params: {
    instanceName: string;
    number: string;
    text: string;
    buttons: Array<{ id: string; text: string }>;
    title?: string;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest(
        `/message/sendButton/${params.instanceName}`,
        'POST',
        {
          number: params.number,
          text: params.text,
          buttons: params.buttons,
          title: params.title,
        },
      );
      return response;
    } catch (error: any) {
      evolutionLogger.error(
        `Erro ao enviar botões para ${params.number}`,
        error,
      );
      return { success: false, error: 'Falha ao enviar botões' };
    }
  }

  async sendList(params: {
    instanceName: string;
    number: string;
    title: string;
    text: string;
    buttonText: string;
    sections: Array<{
      title: string;
      rows: Array<{
        rowId: string;
        title: string;
        description: string;
      }>;
    }>;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest(
        `/message/sendList/${params.instanceName}`,
        'POST',
        {
          number: params.number,
          title: params.title,
          text: params.text,
          buttonText: params.buttonText,
          sections: params.sections,
        },
      );
      return response;
    } catch (error: any) {
      evolutionLogger.error(
        `Erro ao enviar lista para ${params.number}`,
        error,
      );
      return { success: false, error: 'Falha ao enviar lista' };
    }
  }

  async sendReaction(params: {
    instanceName: string;
    number: string;
    messageId: string;
    emoji: string;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest(
        `/message/sendReaction/${params.instanceName}`,
        'POST',
        {
          number: params.number,
          messageId: params.messageId,
          emoji: params.emoji,
        },
      );
      return response;
    } catch (error: any) {
      evolutionLogger.error(
        `Erro ao enviar reação para ${params.number}`,
        error,
      );
      return { success: false, error: 'Falha ao enviar reação' };
    }
  }

  async findChats(instanceName: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/chat/findChats/${instanceName}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar chats:', error);
      throw error;
    }
  }

  async findMessages(
    instanceName: string,
    remoteJid: string,
    page: number = 1,
    offset: number = 50,
  ) {
    try {
      const response = await this.makeRequest(
        `/chat/findMessages/${instanceName}`,
        'POST',
        {
          where: {
            key: {
              remoteJid: remoteJid,
            },
          },
          page: page,
          offset: offset,
        },
      );
      return response;
    } catch (error: any) {
      evolutionLogger.error(
        `Erro ao buscar mensagens para ${remoteJid}`,
        error,
      );
      return {
        success: false,
        error: error.message || 'Falha ao buscar mensagens',
      };
    }
  }

  async fetchProfilePicture(
    instanceName: string,
    number: string,
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const response = await this.makeRequest(
        `/chat/fetchProfilePictureUrl/${instanceName}`,
        'POST',
        {
          number: number,
        },
      );
      return {
        success: true,
        url: response.data,
      };
    } catch (error: any) {
      evolutionLogger.error(
        `Erro ao buscar foto de perfil para ${number}`,
        error,
      );
      return {
        success: false,
        error: error.message || 'Falha ao buscar foto de perfil',
      };
    }
  }

  async findContacts(
    instanceName: string,
    contactId?: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const data: any = { where: {} };
      if (contactId) {
        data.where.id = contactId;
      }

      const response = await this.makeRequest(
        `/chat/findContacts/${instanceName}`,
        'POST',
        data,
      );
      return response;
    } catch (error: any) {
      evolutionLogger.error('Erro ao buscar contatos', error);
      return {
        success: false,
        error: error.message || 'Falha ao buscar contatos',
      };
    }
  }

  async configureWebhook(
    instanceName: string,
    webhookUrl: string,
    token: string,
    events: string[] = [
      'messages.upsert',
      'messages.update',
      'chats.upsert',
    ],
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.makeRequest(
        `/webhook/set/${instanceName}`,
        'POST',
        {
          webhook: {
            enabled: true,
            url: webhookUrl,
            headers: {
              authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            byEvents: false,
            base64: false,
            events: events,
          },
        },
      );

      evolutionLogger.log(
        `Webhook configurado com sucesso para ${instanceName}`,
      );
      return response;
    } catch (error: any) {
      evolutionLogger.error(
        `Erro ao configurar webhook para instância ${instanceName}`,
        error,
      );
      return {
        success: false,
        error: error.message || 'Falha ao configurar webhook',
      };
    }
  }

  // NOVOS MÉTODOS PARA ENVIO DE MENSAGENS PARA GRUPOS

  /**
   * Envia uma mensagem de texto para um grupo.
   * @param params.instanceName Nome da instância.
   * @param params.groupJid O JID do grupo (ex: '120363396737082338@g.us').
   * @param params.text O conteúdo da mensagem de texto.
   * @param params.delay Atraso em milissegundos antes do envio (opcional).
   * @param params.quoted Objeto com dados da mensagem a ser respondida (opcional).
   * @param params.linkPreview Habilita/desabilita preview de link (opcional).
   * @param params.mentionsEveryOne Menciona todos os participantes (opcional).
   * @param params.mentioned Array de JIDs/números a serem mencionados (opcional).
   */
  async sendTextToGroup(params: {
    instanceName: string;
    groupJid: string;
    text: string;
    delay?: number;
    quoted?: any;
    linkPreview?: boolean;
    mentionsEveryOne?: boolean;
    mentioned?: string[];
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest(
        `/message/sendText/${params.instanceName}`,
        'POST',
        {
          number: params.groupJid, // O JID do grupo é passado como 'number'
          text: params.text,
          delay: params.delay,
          quoted: params.quoted,
          linkPreview: params.linkPreview,
          mentionsEveryOne: params.mentionsEveryOne,
          mentioned: params.mentioned,
        },
      );
      return response;
    } catch (error: any) {
      evolutionLogger.error(
        `Erro ao enviar texto para o grupo ${params.groupJid}`,
        error,
      );
      return {
        success: false,
        error: 'Falha ao enviar texto para o grupo',
      };
    }
  }

  /**
   * Envia uma mídia (imagem, vídeo, documento) para um grupo.
   * @param params.instanceName Nome da instância.
   * @param params.groupJid O JID do grupo.
   * @param params.mediatype Tipo da mídia ('image', 'video', 'document').
   * @param params.mimetype MIME type da mídia (ex: 'image/png').
   * @param params.media URL ou Base64 da mídia.
   * @param params.caption Legenda da mídia (opcional).
   * @param params.fileName Nome do arquivo (opcional).
   * @param params.delay Atraso em milissegundos antes do envio (opcional).
   * @param params.quoted Objeto com dados da mensagem a ser respondida (opcional).
   * @param params.mentionsEveryOne Menciona todos os participantes (opcional).
   * @param params.mentioned Array de JIDs/números a serem mencionados (opcional).
   */
  async sendMediaToGroup(params: {
    instanceName: string;
    groupJid: string;
    mediatype: 'image' | 'video' | 'document';
    mimetype: string;
    media: string; // url or base64
    caption?: string;
    fileName?: string;
    delay?: number;
    quoted?: any;
    mentionsEveryOne?: boolean;
    mentioned?: string[];
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest(
        `/message/sendMedia/${params.instanceName}`,
        'POST',
        {
          number: params.groupJid, // O JID do grupo é passado como 'number'
          mediatype: params.mediatype,
          mimetype: params.mimetype,
          caption: params.caption,
          media: params.media,
          fileName: params.fileName,
          delay: params.delay,
          quoted: params.quoted,
          mentionsEveryOne: params.mentionsEveryOne,
          mentioned: params.mentioned,
        },
      );
      return response;
    } catch (error: any) {
      evolutionLogger.error(
        `Erro ao enviar mídia para o grupo ${params.groupJid}`,
        error,
      );
      return {
        success: false,
        error: 'Falha ao enviar mídia para o grupo',
      };
    }
  }

  /**
   * Envia uma figurinha para um grupo.
   * @param params.instanceName Nome da instância.
   * @param params.groupJid O JID do grupo.
   * @param params.sticker URL ou Base64 da figurinha.
   * @param params.delay Atraso em milissegundos antes do envio (opcional).
   * @param params.quoted Objeto com dados da mensagem a ser respondida (opcional).
   * @param params.mentionsEveryOne Menciona todos os participantes (opcional).
   * @param params.mentioned Array de JIDs/números a serem mencionados (opcional).
   */
  async sendStickerToGroup(params: {
    instanceName: string;
    groupJid: string;
    sticker: string; // url or base64
    delay?: number;
    quoted?: any;
    mentionsEveryOne?: boolean;
    mentioned?: string[];
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest(
        `/message/sendSticker/${params.instanceName}`,
        'POST',
        {
          number: params.groupJid, // O JID do grupo é passado como 'number'
          sticker: params.sticker,
          delay: params.delay,
          quoted: params.quoted,
          mentionsEveryOne: params.mentionsEveryOne,
          mentioned: params.mentioned,
        },
      );
      return response;
    } catch (error: any) {
      evolutionLogger.error(
        `Erro ao enviar figurinha para o grupo ${params.groupJid}`,
        error,
      );
      return {
        success: false,
        error: 'Falha ao enviar figurinha para o grupo',
      };
    }
  }

  /**
   * Envia um áudio narrado para um grupo.
   * @param params.instanceName Nome da instância.
   * @param params.groupJid O JID do grupo.
   * @param params.audio URL ou Base64 do áudio.
   * @param params.delay Atraso em milissegundos antes do envio (opcional).
   * @param params.quoted Objeto com dados da mensagem a ser respondida (opcional).
   * @param params.mentionsEveryOne Menciona todos os participantes (opcional).
   * @param params.mentioned Array de JIDs/números a serem mencionados (opcional).
   * @param params.encoding Habilita/desabilita encoding (opcional).
   */
  async sendAudioToGroup(params: {
    instanceName: string;
    groupJid: string;
    audio: string; // url or base64
    delay?: number;
    quoted?: any;
    mentionsEveryOne?: boolean;
    mentioned?: string[];
    encoding?: boolean;
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const response = await this.makeRequest(
        `/message/sendWhatsAppAudio/${params.instanceName}`,
        'POST',
        {
          number: params.groupJid, // O JID do grupo é passado como 'number'
          audio: params.audio,
          delay: params.delay,
          quoted: params.quoted,
          mentionsEveryOne: params.mentionsEveryOne,
          mentioned: params.mentioned,
          encoding: params.encoding,
        },
      );
      return response;
    } catch (error: any) {
      evolutionLogger.error(
        `Erro ao enviar áudio para o grupo ${params.groupJid}`,
        error,
      );
      return {
        success: false,
        error: 'Falha ao enviar áudio para o grupo',
      };
    }
  }
}
