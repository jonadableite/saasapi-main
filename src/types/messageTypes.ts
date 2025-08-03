// src/types/messageTypes.ts
export type MessageType =
  | 'text'
  | 'audio'
  | 'image'
  | 'video'
  | 'sticker'
  | 'reaction'
  | 'media'
  | 'document'
  | 'location'
  | 'contact'
  | 'poll'
  | 'status'
  | 'profile'
  | 'group_action'
  | 'typing'
  | 'online_status'
  | 'read_receipt';

export type MessageStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export type GroupActionType =
  | 'join'
  | 'leave'
  | 'invite'
  | 'message'
  | 'reaction';

export type ProfileActionType = 'name' | 'bio' | 'status' | 'photo';
