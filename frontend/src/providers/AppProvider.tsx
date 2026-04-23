import { ReactNode, createContext, useContext, useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { apiRequest } from '../services/api';
import {
  AdminUser,
  AuthUser,
  CampaignGroup,
  CampaignItem,
  ComposePayload,
  Contact,
  ContactDraft,
  ContactGroup,
  Device,
  MessageTemplate,
  MessageTemplateDraft,
  MessageTemplateVariantDraft,
  SpreadsheetParseResult,
  Summary,
} from '../types';
import { getActiveListContacts, getContactGroups, groupCampaignItems } from '../utils/campaigns';

interface AppContextValue {
  token: string;
  user: AuthUser | null;
  summary: Summary | null;
  devices: Device[];
  queue: CampaignItem[];
  history: CampaignItem[];
  contacts: Contact[];
  templates: MessageTemplate[];
  users: AdminUser[];
  draftContactLists: string[];
  selectedContactListNames: Set<string>;
  selectedContactIds: Set<string>;
  expandedDeviceId: string | null;
  activeContactListName: string;
  contactGroups: ContactGroup[];
  activeListContacts: Contact[];
  queueGroups: CampaignGroup[];
  historyGroups: CampaignGroup[];
  loginStatus: string;
  isAuthChecking: boolean;
  isGlobalLoading: boolean;
  globalLoadingMessage: string;
  login: (email: string, password: string) => Promise<void>;
  changeOwnPassword: (currentPassword: string, newPassword: string) => Promise<string>;
  logout: () => Promise<void>;
  refreshData: (overrideToken?: string) => Promise<void>;
  connectDevice: (deviceId: string) => Promise<void>;
  disconnectDevice: (deviceId: string) => Promise<string>;
  submitCompose: (payload: ComposePayload) => Promise<string>;
  cancelQueueItem: (itemId: string) => Promise<void>;
  cancelCampaign: (groupKey: string) => Promise<void>;
  createDraftList: (listName: string) => string;
  removeContactList: (listName: string) => Promise<void>;
  setActiveContactListName: (listName: string) => void;
  saveContact: (draft: ContactDraft, contactId?: string) => Promise<void>;
  bulkUpdateContacts: (contactIds: string[], data: string, notes: string) => Promise<void>;
  deleteContact: (contactId: string) => Promise<void>;
  deleteContacts: (contactIds: string[]) => Promise<void>;
  importContactsFromSpreadsheet: (file: File) => Promise<string>;
  parseComposeRecipientsFromSpreadsheet: (file: File) => Promise<SpreadsheetParseResult>;
  saveTemplate: (draft: MessageTemplateDraft, templateId?: string) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  saveTemplateVariant: (templateId: string, draft: MessageTemplateVariantDraft, variantId?: string) => Promise<void>;
  deleteTemplateVariant: (templateId: string, variantId: string) => Promise<void>;
  saveAdminUser: (payload: AdminUser, currentEmail?: string | null) => Promise<void>;
  deleteAdminUser: (email: string) => Promise<void>;
  toggleComposeList: (listName: string, checked: boolean) => void;
  selectAllComposeLists: () => void;
  clearComposeLists: () => void;
  toggleContactSelection: (contactId: string) => void;
  clearSelectedContacts: () => void;
  selectContactIds: (contactIds: string[]) => void;
  setExpandedDeviceId: (deviceId: string | null) => void;
  setLoginStatus: (status: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

async function readSpreadsheet(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1, raw: false });
}

function normalizeSpreadsheetHeader(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

function findSpreadsheetColumnIndex(headers: string[], aliases: string[]) {
  const normalizedAliases = aliases.map((alias) => normalizeSpreadsheetHeader(alias));
  return headers.findIndex((header) => normalizedAliases.includes(normalizeSpreadsheetHeader(header)));
}

function parseSpreadsheetRecipients(rows: string[][]) {
  const sanitizedRows = rows
    .map((row) => Array.isArray(row)
      ? row.map((cell) => String(cell || '').trim())
      : [])
    .filter((row) => row.some((cell) => cell));

  if (sanitizedRows.length === 0) {
    return {
      recipients: [],
      skippedRows: 0,
    };
  }

  const firstRow = sanitizedRows[0];
  const hasHeader = [
    'nome',
    'telefone',
    'numero',
    'whatsapp',
    'paciente',
    'profissional',
    'data',
    'hora',
  ].some((keyword) => firstRow.some((cell) => normalizeSpreadsheetHeader(cell).includes(keyword)));

  const dataRows = hasHeader ? sanitizedRows.slice(1) : sanitizedRows;
  const headers = hasHeader ? firstRow : [];

  const columnMap = hasHeader
    ? {
      name: findSpreadsheetColumnIndex(headers, ['nome', 'name', 'contato']),
      number: findSpreadsheetColumnIndex(headers, ['telefone', 'fone', 'celular', 'numero', 'numero whatsapp', 'whatsapp']),
      paciente: findSpreadsheetColumnIndex(headers, ['paciente']),
      profissional: findSpreadsheetColumnIndex(headers, ['profissional', 'medico', 'doutor', 'dr']),
      data: findSpreadsheetColumnIndex(headers, ['data', 'dia']),
      hora: findSpreadsheetColumnIndex(headers, ['hora', 'horario']),
    }
    : {
      name: 0,
      number: 1,
      paciente: 2,
      profissional: 3,
      data: 4,
      hora: 5,
    };

  const recipients = dataRows
    .map((row) => ({
      name: row[columnMap.name] || '',
      number: row[columnMap.number] || '',
      paciente: columnMap.paciente >= 0 ? row[columnMap.paciente] || '' : '',
      profissional: columnMap.profissional >= 0 ? row[columnMap.profissional] || '' : '',
      data: columnMap.data >= 0 ? row[columnMap.data] || '' : '',
      hora: columnMap.hora >= 0 ? row[columnMap.hora] || '' : '',
    }))
    .filter((item) => item.name && item.number);

  return {
    recipients,
    skippedRows: dataRows.length - recipients.length,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || '');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [queue, setQueue] = useState<CampaignItem[]>([]);
  const [history, setHistory] = useState<CampaignItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [draftContactLists, setDraftContactLists] = useState<string[]>([]);
  const [selectedContactListNames, setSelectedContactListNames] = useState<Set<string>>(new Set());
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
  const [activeContactListName, setActiveContactListName] = useState('');
  const [loginStatus, setLoginStatus] = useState('');
  const [isAuthChecking, setIsAuthChecking] = useState(() => Boolean(localStorage.getItem('authToken')));
  const [globalLoadingCount, setGlobalLoadingCount] = useState(0);
  const [globalLoadingMessage, setGlobalLoadingMessage] = useState('');
  const authPrefetchRef = useRef<Set<string>>(new Set());
  const hasBootstrappedSessionRef = useRef(false);

  function mergeDevice(nextDevice: Device) {
    setDevices((current) => {
      const index = current.findIndex((item) => item.id === nextDevice.id);
      if (index === -1) {
        return [nextDevice, ...current];
      }

      const next = [...current];
      next[index] = nextDevice;
      return next;
    });
  }

  const contactGroups = getContactGroups(contacts, draftContactLists);
  const activeListContacts = getActiveListContacts(contacts, activeContactListName);
  const queueGroups = groupCampaignItems(queue, 'queue');
  const historyGroups = groupCampaignItems(history, 'history');
  const isGlobalLoading = globalLoadingCount > 0;

  async function runWithGlobalLoading<T>(message: string, task: () => Promise<T>) {
    setGlobalLoadingMessage(message);
    setGlobalLoadingCount((current) => current + 1);

    try {
      return await task();
    } finally {
      setGlobalLoadingCount((current) => Math.max(0, current - 1));
    }
  }

  useEffect(() => {
    if (activeContactListName && !contactGroups.some((group) => group.listName === activeContactListName)) {
      setActiveContactListName(contactGroups[0]?.listName || '');
    }
  }, [activeContactListName, contactGroups]);

  useEffect(() => {
    if (!isGlobalLoading) {
      setGlobalLoadingMessage('');
    }
  }, [isGlobalLoading]);

  useEffect(() => {
    setSelectedContactListNames((current) => new Set(
      Array.from(current).filter((listName) =>
        contacts.some((contact) => (contact.listName || 'Geral') === listName),
      ),
    ));
    setSelectedContactIds((current) => new Set(
      Array.from(current).filter((contactId) => contacts.some((contact) => contact.id === contactId)),
    ));
    setDraftContactLists((current) =>
      current.filter((listName) => !contacts.some((contact) => (contact.listName || 'Geral') === listName)),
    );
  }, [contacts]);

  useEffect(() => {
    if (!token) {
      hasBootstrappedSessionRef.current = false;
      return;
    }

    const pollingId = window.setInterval(() => {
      void refreshData();
    }, 5000);

    return () => {
      window.clearInterval(pollingId);
    };
  }, [token]);

  useEffect(() => {
    if (!token || hasBootstrappedSessionRef.current) {
      return;
    }

    hasBootstrappedSessionRef.current = true;
    void runWithGlobalLoading('Carregando seus dados...', async () => {
      await refreshData(token);
    });
  }, [token]);

  useEffect(() => {
    if (!token || devices.length !== 1) {
      return;
    }

    const [device] = devices;
    setExpandedDeviceId(device.id);

    if (authPrefetchRef.current.has(device.id)) {
      return;
    }

    if (
      ['connected', 'authenticated', 'initializing', 'qr_ready', 'resetting_session'].includes(device.status)
      && device.runtime?.hasClient !== false
    ) {
      return;
    }

    authPrefetchRef.current.add(device.id);

    void apiRequest<{ device: Device }>(`/api/devices/${device.id}/auth`, {}, token)
      .then((response) => {
        mergeDevice(response.device);
      })
      .catch((error: Error) => {
        console.error(error);
      })
      .finally(() => {
        authPrefetchRef.current.delete(device.id);
      });
  }, [devices, token]);

  useEffect(() => {
    if (!token || !expandedDeviceId) {
      return;
    }

    const activeDevice = devices.find((device) => device.id === expandedDeviceId);
    if (!activeDevice) {
      return;
    }

    if (
      !['initializing', 'resetting_session', 'qr_ready', 'pairing_code_ready', 'auth_failure', 'disconnected', 'error'].includes(activeDevice.status)
      && activeDevice.runtime?.hasClient !== false
    ) {
      return;
    }

    const pollId = window.setInterval(() => {
      void apiRequest<{ device: Device }>(`/api/devices/${expandedDeviceId}/auth`, {}, token)
        .then((response) => {
          mergeDevice(response.device);
        })
        .catch((error: Error) => {
          console.error(error);
        });
    }, 2000);

    return () => {
      window.clearInterval(pollId);
    };
  }, [devices, expandedDeviceId, token]);

  async function refreshData(overrideToken?: string) {
    const authToken = overrideToken || token;
    if (!authToken) {
      setIsAuthChecking(false);
      return;
    }

    try {
      const [me, summaryData, devicesData, queueData, historyData, contactsData, templatesData] = await Promise.all([
        apiRequest<{ user: AuthUser }>('/api/auth/me', {}, authToken),
        apiRequest<{ summary: Summary }>('/api/dashboard/summary', {}, authToken),
        apiRequest<{ devices: Device[] }>('/api/devices', {}, authToken),
        apiRequest<{ items: CampaignItem[] }>('/api/queue', {}, authToken),
        apiRequest<{ items: CampaignItem[] }>('/api/history', {}, authToken),
        apiRequest<{ contacts: Contact[] }>('/api/contacts', {}, authToken),
        apiRequest<{ templates: MessageTemplate[] }>('/api/templates', {}, authToken),
      ]);

      let usersData: { users: AdminUser[] } | null = null;

      if (me.user.role === 'admin') {
        usersData = await apiRequest<{ users: AdminUser[] }>('/api/admin/users', {}, authToken);
      }

      setUser(me.user);
      setSummary(summaryData.summary);
      setDevices(devicesData.devices);
      setQueue(queueData.items);
      setHistory(historyData.items);
      setContacts(contactsData.contacts);
      setTemplates(templatesData.templates);
      setUsers(usersData?.users || []);
      setIsAuthChecking(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar dados.';

      if (message.includes('Sessao invalida')) {
        await logout();
        return;
      }

      setIsAuthChecking(false);
      console.error(error);
    }
  }

  async function login(email: string, password: string) {
    setLoginStatus('Validando acesso...');

    try {
      const response = await runWithGlobalLoading('Entrando na sua conta...', () =>
        apiRequest<{ token: string; user: AuthUser }>(
          '/api/auth/login',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          },
        ),
      );

      hasBootstrappedSessionRef.current = true;
      setIsAuthChecking(false);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('authToken', response.token);
      await runWithGlobalLoading('Preparando seu ambiente...', async () => {
        await apiRequest('/api/devices', { method: 'POST' }, response.token);
        await refreshData(response.token);
      });
      setLoginStatus('');
    } catch (error) {
      setLoginStatus(error instanceof Error ? error.message : 'Falha ao autenticar.');
      throw error;
    }
  }

  async function logout() {
    try {
      if (token) {
        await apiRequest('/api/auth/logout', { method: 'POST' }, token);
      }
    } catch {
      // Ignora erro e limpa o estado local.
    }

    setToken('');
    setUser(null);
    setIsAuthChecking(false);
    setSummary(null);
    setDevices([]);
    setQueue([]);
    setHistory([]);
    setContacts([]);
    setTemplates([]);
    setUsers([]);
    setDraftContactLists([]);
    setSelectedContactListNames(new Set());
    setSelectedContactIds(new Set());
    setExpandedDeviceId(null);
    setActiveContactListName('');
    setLoginStatus('');
    setGlobalLoadingCount(0);
    setGlobalLoadingMessage('');
    localStorage.removeItem('authToken');
  }

  async function changeOwnPassword(currentPassword: string, newPassword: string) {
    const response = await runWithGlobalLoading('Atualizando sua senha...', () =>
      apiRequest<{ message: string; user: AuthUser }>(
        '/api/auth/change-password',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword }),
        },
        token,
      ),
    );

    setUser(response.user);
    return response.message;
  }

  async function connectDevice(deviceId: string) {
    const currentDevice = devices.find((device) => device.id === deviceId);
    setExpandedDeviceId(deviceId);

    if (currentDevice?.status === 'connected' && currentDevice.runtime?.hasClient !== false) {
      window.alert('Dispositivo autenticado e pronto para enviar mensagens.');
      await refreshData();
      return;
    }

    await runWithGlobalLoading('Conectando dispositivo...', async () => {
      await apiRequest(`/api/devices/${deviceId}/connect`, { method: 'POST' }, token);
      await apiRequest(`/api/devices/${deviceId}/auth`, {}, token);
      await refreshData();
    });
  }

  async function disconnectDevice(deviceId: string) {
    setExpandedDeviceId(deviceId);
    setDevices((current) => current.map((device) => (
      device.id === deviceId
        ? {
          ...device,
          status: 'resetting_session',
          lastKnownStatus: 'Aguarde, apagando ultimos registros para gerar um novo QR Code.',
          connectedNumber: null,
          qrCode: undefined,
          pairingCode: undefined,
          runtime: {
            ...device.runtime,
            hasClient: false,
            initializing: true,
            lastError: '',
          },
        }
        : device
    )));

    const response = await runWithGlobalLoading('Aguarde, apagando ultimos registros para gerar novo QR Code...', async () => {
      const data = await apiRequest<{ message: string }>(`/api/devices/${deviceId}/disconnect`, { method: 'POST' }, token);
      await apiRequest(`/api/devices/${deviceId}/auth`, {}, token);
      await refreshData();
      return data;
    });
    return response.message;
  }

  async function uploadAttachments(files: File[]) {
    if (files.length === 0) {
      return [];
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('media', file));
    const response = await apiRequest<{ files: unknown[] }>('/api/upload', { method: 'POST', body: formData }, token);
    return response.files || [];
  }

  async function submitCompose(payload: ComposePayload) {
    const response = await runWithGlobalLoading('Enviando campanha...', async () => {
      const attachments = await uploadAttachments(payload.files);
      const data = await apiRequest<{ message: string }>(
        payload.endpoint,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: payload.deviceId,
            campaignName: payload.campaignName,
            recipients: payload.recipients,
            message: payload.message,
            templateId: payload.templateId || null,
            attachments,
            scheduleAt: payload.scheduleAt || null,
          }),
        },
        token,
      );

      await refreshData();
      return data;
    });
    return response.message;
  }

  async function cancelQueueItem(itemId: string) {
    await runWithGlobalLoading('Cancelando item da fila...', async () => {
      await apiRequest(`/api/queue/${itemId}/cancel`, { method: 'POST' }, token);
      await refreshData();
    });
  }

  async function cancelCampaign(groupKey: string) {
    const group = queueGroups.find((item) => item.key === groupKey);
    if (!group) {
      return;
    }

    await runWithGlobalLoading('Cancelando campanha...', async () => {
      await Promise.all(
        group.items
          .filter((item) => ['pending', 'processing'].includes(item.status))
          .map((item) => apiRequest(`/api/queue/${item.id}/cancel`, { method: 'POST' }, token)),
      );

      await refreshData();
    });
  }

  function createDraftList(listName: string) {
    const normalized = listName.trim();
    if (!normalized) {
      return '';
    }

    setSelectedContactIds(new Set());

    if (!draftContactLists.includes(normalized) && !contacts.some((contact) => (contact.listName || 'Geral') === normalized)) {
      setDraftContactLists((current) => [...current, normalized]);
    }

    return normalized;
  }

  async function removeContactList(listName: string) {
    const isDraftList = draftContactLists.includes(listName)
      && !contacts.some((contact) => (contact.listName || 'Geral') === listName);

    if (isDraftList) {
      setDraftContactLists((current) => current.filter((item) => item !== listName));
      setSelectedContactListNames((current) => {
        const next = new Set(current);
        next.delete(listName);
        return next;
      });
      if (activeContactListName === listName) {
        setActiveContactListName('');
      }
      return;
    }

    await runWithGlobalLoading('Removendo lista...', async () => {
      await apiRequest(`/api/contact-lists/${encodeURIComponent(listName)}`, { method: 'DELETE' }, token);
      setSelectedContactListNames((current) => {
        const next = new Set(current);
        next.delete(listName);
        return next;
      });
      await refreshData();
    });
  }

  async function saveContact(draft: ContactDraft, contactId?: string) {
    const path = contactId ? `/api/contacts/${contactId}` : '/api/contacts';
    const method = contactId ? 'PUT' : 'POST';

    await runWithGlobalLoading(contactId ? 'Atualizando contato...' : 'Salvando contato...', async () => {
      await apiRequest(
        path,
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        },
        token,
      );

      setDraftContactLists((current) => current.filter((listName) => listName !== draft.listName));
      await refreshData();
    });
  }

  async function bulkUpdateContacts(contactIds: string[], data: string, notes: string) {
    const shouldUpdateData = Boolean(data.trim());
    const shouldUpdateNotes = Boolean(notes.trim());

    if (!shouldUpdateData && !shouldUpdateNotes) {
      throw new Error('Preencha ao menos um campo para atualizar em lote.');
    }

    await runWithGlobalLoading('Atualizando contatos...', async () => {
      await Promise.all(
        contactIds.map((contactId) => {
          const contact = contacts.find((item) => item.id === contactId);
          if (!contact) {
            return Promise.resolve();
          }

          return apiRequest(
            `/api/contacts/${contactId}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                listName: contact.listName || 'Geral',
                name: contact.name,
                phone: contact.phone,
                paciente: contact.paciente || '',
                profissional: contact.profissional || '',
                data: shouldUpdateData ? data : contact.data || '',
                hora: contact.hora || '',
                notes: shouldUpdateNotes ? notes : contact.notes || '',
              }),
            },
            token,
          );
        }),
      );

      await refreshData();
    });
  }

  async function deleteContact(contactId: string) {
    await runWithGlobalLoading('Excluindo contato...', async () => {
      await apiRequest(`/api/contacts/${contactId}`, { method: 'DELETE' }, token);
      await refreshData();
    });
  }

  async function deleteContacts(contactIds: string[]) {
    await runWithGlobalLoading('Excluindo contatos...', async () => {
      await Promise.all(contactIds.map((contactId) => apiRequest(`/api/contacts/${contactId}`, { method: 'DELETE' }, token)));
      setSelectedContactIds(new Set());
      await refreshData();
    });
  }

  async function importContactsFromSpreadsheet(file: File) {
    if (!activeContactListName) {
      throw new Error('Selecione uma lista antes de importar.');
    }

    const response = await runWithGlobalLoading('Importando contatos...', async () => {
      const rows = await readSpreadsheet(file);
      const importedContacts = parseSpreadsheetRecipients(rows).recipients.map((recipient) => ({
        listName: activeContactListName,
        name: recipient.name,
        phone: recipient.number,
        paciente: recipient.paciente || '',
        profissional: recipient.profissional || '',
        data: recipient.data || '',
        hora: recipient.hora || '',
        notes: '',
      }));

      const data = await apiRequest<{ message: string }>(
        '/api/contacts/import',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contacts: importedContacts }),
        },
        token,
      );

      setDraftContactLists((current) => current.filter((listName) => listName !== activeContactListName));
      await refreshData();
      return data;
    });
    return response.message;
  }

  async function parseComposeRecipientsFromSpreadsheet(file: File) {
    return runWithGlobalLoading('Lendo planilha...', async () => {
      const rows = await readSpreadsheet(file);
      const result = parseSpreadsheetRecipients(rows);

      if (result.recipients.length === 0) {
        throw new Error('Nenhum contato valido foi encontrado na planilha.');
      }

      return result;
    });
  }

  async function saveTemplate(draft: MessageTemplateDraft, templateId?: string) {
    const path = templateId ? `/api/templates/${templateId}` : '/api/templates';
    const method = templateId ? 'PUT' : 'POST';

    await runWithGlobalLoading(templateId ? 'Atualizando template...' : 'Salvando template...', async () => {
      await apiRequest(
        path,
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        },
        token,
      );

      await refreshData();
    });
  }

  async function deleteTemplate(templateId: string) {
    await runWithGlobalLoading('Excluindo template...', async () => {
      await apiRequest(`/api/templates/${templateId}`, { method: 'DELETE' }, token);
      await refreshData();
    });
  }

  async function saveTemplateVariant(templateId: string, draft: MessageTemplateVariantDraft, variantId?: string) {
    const path = variantId
      ? `/api/templates/${templateId}/variants/${variantId}`
      : `/api/templates/${templateId}/variants`;
    const method = variantId ? 'PUT' : 'POST';

    await runWithGlobalLoading(variantId ? 'Atualizando variacao...' : 'Salvando variacao...', async () => {
      await apiRequest(
        path,
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        },
        token,
      );

      await refreshData();
    });
  }

  async function deleteTemplateVariant(templateId: string, variantId: string) {
    await runWithGlobalLoading('Excluindo variacao...', async () => {
      await apiRequest(`/api/templates/${templateId}/variants/${variantId}`, { method: 'DELETE' }, token);
      await refreshData();
    });
  }

  async function saveAdminUser(payload: AdminUser, currentEmail?: string | null) {
    const path = currentEmail ? `/api/admin/users/${encodeURIComponent(currentEmail)}` : '/api/admin/users';
    const method = currentEmail ? 'PUT' : 'POST';

    await runWithGlobalLoading('Salvando usuario...', async () => {
      await apiRequest(
        path,
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        token,
      );

      await refreshData();
    });
  }

  async function deleteAdminUser(email: string) {
    await runWithGlobalLoading('Excluindo usuario...', async () => {
      await apiRequest(`/api/admin/users/${encodeURIComponent(email)}`, { method: 'DELETE' }, token);
      await refreshData();
    });
  }

  function toggleComposeList(listName: string, checked: boolean) {
    setSelectedContactListNames((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(listName);
      } else {
        next.delete(listName);
      }
      return next;
    });
  }

  function selectAllComposeLists() {
    setSelectedContactListNames(new Set(contactGroups.map((group) => group.listName)));
  }

  function clearComposeLists() {
    setSelectedContactListNames(new Set());
  }

  function toggleContactSelection(contactId: string) {
    setSelectedContactIds((current) => {
      const next = new Set(current);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  }

  function clearSelectedContacts() {
    setSelectedContactIds(new Set());
  }

  function selectContactIds(contactIds: string[]) {
    setSelectedContactIds((current) => {
      const next = new Set(current);
      contactIds.forEach((contactId) => next.add(contactId));
      return next;
    });
  }

  return (
    <AppContext.Provider
      value={{
        token,
        user,
        summary,
        devices,
        queue,
        history,
        contacts,
        templates,
        users,
        draftContactLists,
        selectedContactListNames,
        selectedContactIds,
        expandedDeviceId,
        activeContactListName,
        contactGroups,
        activeListContacts,
        queueGroups,
        historyGroups,
        loginStatus,
        isAuthChecking,
        isGlobalLoading,
        globalLoadingMessage,
        login,
        changeOwnPassword,
        logout,
        refreshData,
        connectDevice,
        disconnectDevice,
        submitCompose,
        cancelQueueItem,
        cancelCampaign,
        createDraftList,
        removeContactList,
        setActiveContactListName,
        saveContact,
        bulkUpdateContacts,
        deleteContact,
        deleteContacts,
        importContactsFromSpreadsheet,
        parseComposeRecipientsFromSpreadsheet,
        saveTemplate,
        deleteTemplate,
        saveTemplateVariant,
        deleteTemplateVariant,
        saveAdminUser,
        deleteAdminUser,
        toggleComposeList,
        selectAllComposeLists,
        clearComposeLists,
        toggleContactSelection,
        clearSelectedContacts,
        selectContactIds,
        setExpandedDeviceId,
        setLoginStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider.');
  }

  return context;
}
