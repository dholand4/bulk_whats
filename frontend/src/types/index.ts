export type UserRole = 'user' | 'admin';

export interface AuthUser {
  email: string;
  role: UserRole;
  dataExpiracao?: string;
  mustChangePassword?: boolean;
}

export interface Summary {
  connectedDevices: number;
  pendingQueue: number;
  completedSends: number;
  recentFailures: number;
}

export interface DeviceRuntime {
  initializing?: boolean;
  lastError?: string;
  hasClient?: boolean;
}

export interface Device {
  id: string;
  name: string;
  description?: string;
  status: string;
  lastKnownStatus?: string;
  connectedNumber?: string;
  qrCode?: string;
  pairingCode?: string;
  createdAt?: string;
  runtime?: DeviceRuntime;
}

export interface Contact {
  id: string;
  listName?: string;
  name: string;
  phone: string;
  paciente?: string;
  profissional?: string;
  data?: string;
  hora?: string;
  notes?: string;
}

export interface WhatsAppGroup {
  id: string;
  name: string;
  whatsappGroupId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageTemplateVariant {
  id: string;
  templateId: string;
  body: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageTemplate {
  id: string;
  ownerEmail?: string;
  name: string;
  description?: string;
  active: boolean;
  variants: MessageTemplateVariant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageTemplateDraft {
  name: string;
  description: string;
  active: boolean;
}

export interface MessageTemplateVariantDraft {
  body: string;
  active: boolean;
}

export interface AdminUser {
  email: string;
  role: UserRole;
  dataExpiracao: string;
  password?: string;
}

export interface CampaignItem {
  id: string;
  campaignId?: string | null;
  campaignName?: string;
  deviceId: string;
  recipientType?: 'contact' | 'group';
  recipientId?: string;
  recipientNumber: string;
  contactName?: string;
  status: string;
  scheduleAt: string;
  updatedAt: string;
  message?: string;
  errorMessage?: string;
  paciente?: string;
  data?: string;
  hora?: string;
  delaySeconds?: number;
  sentAt?: string | null;
}

export interface CampaignGroup {
  key: string;
  campaignId: string | null;
  campaignName: string;
  deviceId: string;
  scheduleAt: string;
  updatedAt: string;
  message: string;
  items: CampaignItem[];
}

export interface ContactGroup {
  listName: string;
  contacts: Contact[];
}

export interface ComposeRecipient {
  type?: 'contact' | 'group';
  id?: string;
  name: string;
  number?: string;
  listName?: string;
  paciente?: string;
  profissional?: string;
  data?: string;
  hora?: string;
}

export interface SpreadsheetParseResult {
  recipients: ComposeRecipient[];
  skippedRows: number;
}

export interface ComposePayload {
  endpoint: '/api/queue' | '/api/messages/send';
  deviceId: string;
  campaignName: string;
  message: string;
  templateId?: string | null;
  scheduleAt: string | null;
  recipients: ComposeRecipient[];
  files: File[];
}

export interface CreateWhatsAppGroupPayload {
  name: string;
  contactIds: string[];
}

export interface ContactDraft {
  listName: string;
  name: string;
  phone: string;
  paciente: string;
  profissional: string;
  data: string;
  hora: string;
  notes: string;
}
