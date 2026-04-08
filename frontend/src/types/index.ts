export type UserRole = 'user' | 'admin';

export interface AuthUser {
  matricula: string;
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
}

export interface Device {
  id: string;
  name: string;
  description?: string;
  status: string;
  lastKnownStatus?: string;
  connectedNumber?: string;
  qrCode?: string;
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

export interface AdminUser {
  matricula: string;
  role: UserRole;
  dataExpiracao: string;
  password?: string;
}

export interface CampaignItem {
  id: string;
  campaignId?: string | null;
  campaignName?: string;
  deviceId: string;
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
}

export interface CampaignGroup {
  key: string;
  campaignId: string | null;
  campaignName: string;
  deviceId: string;
  scheduleAt: string;
  updatedAt: string;
  message: string;
  delaySeconds: number;
  items: CampaignItem[];
}

export interface ContactGroup {
  listName: string;
  contacts: Contact[];
}

export interface ComposeRecipient {
  name: string;
  number: string;
  listName?: string;
  paciente?: string;
  profissional?: string;
  data?: string;
  hora?: string;
}

export interface ComposePayload {
  endpoint: '/api/queue' | '/api/messages/send';
  deviceId: string;
  campaignName: string;
  message: string;
  scheduleAt: string | null;
  delaySeconds: string;
  recipients: ComposeRecipient[];
  files: File[];
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
