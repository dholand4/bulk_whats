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
  login: (matricula: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshData: (overrideToken?: string) => Promise<void>;
  connectDevice: (deviceId: string) => Promise<void>;
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
  saveAdminUser: (payload: AdminUser, currentMatricula?: string | null) => Promise<void>;
  deleteAdminUser: (matricula: string) => Promise<void>;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem('authToken') || '');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [queue, setQueue] = useState<CampaignItem[]>([]);
  const [history, setHistory] = useState<CampaignItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [draftContactLists, setDraftContactLists] = useState<string[]>([]);
  const [selectedContactListNames, setSelectedContactListNames] = useState<Set<string>>(new Set());
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);
  const [activeContactListName, setActiveContactListName] = useState('');
  const [loginStatus, setLoginStatus] = useState('');
  const authPrefetchRef = useRef<Set<string>>(new Set());

  const contactGroups = getContactGroups(contacts, draftContactLists);
  const activeListContacts = getActiveListContacts(contacts, activeContactListName);
  const queueGroups = groupCampaignItems(queue, 'queue');
  const historyGroups = groupCampaignItems(history, 'history');

  useEffect(() => {
    if (!activeContactListName && contactGroups.length > 0) {
      setActiveContactListName(contactGroups[0].listName);
      return;
    }

    if (activeContactListName && !contactGroups.some((group) => group.listName === activeContactListName)) {
      setActiveContactListName(contactGroups[0]?.listName || '');
    }
  }, [activeContactListName, contactGroups]);

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
    if (!token || devices.length !== 1) {
      return;
    }

    const [device] = devices;
    setExpandedDeviceId(device.id);

    if (authPrefetchRef.current.has(device.id)) {
      return;
    }

    if (['connected', 'authenticated', 'initializing', 'qr_ready'].includes(device.status)) {
      return;
    }

    authPrefetchRef.current.add(device.id);

    void apiRequest<{ device: Device }>(`/api/devices/${device.id}/auth`, {}, token)
      .then((response) => {
        setDevices((current) => {
          const index = current.findIndex((item) => item.id === response.device.id);
          if (index === -1) {
            return [response.device, ...current];
          }

          const next = [...current];
          next[index] = response.device;
          return next;
        });
      })
      .catch((error: Error) => {
        console.error(error);
      })
      .finally(() => {
        authPrefetchRef.current.delete(device.id);
      });
  }, [devices, token]);

  async function refreshData(overrideToken?: string) {
    const authToken = overrideToken || token;
    if (!authToken) {
      return;
    }

    try {
      const [me, summaryData, devicesData, queueData, historyData, contactsData] = await Promise.all([
        apiRequest<{ user: AuthUser }>('/api/auth/me', {}, authToken),
        apiRequest<{ summary: Summary }>('/api/dashboard/summary', {}, authToken),
        apiRequest<{ devices: Device[] }>('/api/devices', {}, authToken),
        apiRequest<{ items: CampaignItem[] }>('/api/queue', {}, authToken),
        apiRequest<{ items: CampaignItem[] }>('/api/history', {}, authToken),
        apiRequest<{ contacts: Contact[] }>('/api/contacts', {}, authToken),
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
      setUsers(usersData?.users || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar dados.';

      if (message.includes('Sessao invalida')) {
        await logout();
        return;
      }

      console.error(error);
    }
  }

  async function login(matricula: string) {
    setLoginStatus('Validando acesso...');

    try {
      const response = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricula }),
      });

      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('authToken', response.token);
      await apiRequest('/api/devices', { method: 'POST' }, response.token);
      setLoginStatus('');
      await refreshData(response.token);
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
    setSummary(null);
    setDevices([]);
    setQueue([]);
    setHistory([]);
    setContacts([]);
    setUsers([]);
    setDraftContactLists([]);
    setSelectedContactListNames(new Set());
    setSelectedContactIds(new Set());
    setExpandedDeviceId(null);
    setActiveContactListName('');
    setLoginStatus('');
    localStorage.removeItem('authToken');
  }

  async function connectDevice(deviceId: string) {
    const currentDevice = devices.find((device) => device.id === deviceId);
    setExpandedDeviceId(deviceId);

    if (currentDevice?.status === 'connected') {
      window.alert('Dispositivo autenticado e pronto para enviar mensagens.');
      await refreshData();
      return;
    }

    await apiRequest(`/api/devices/${deviceId}/connect`, { method: 'POST' }, token);
    await apiRequest(`/api/devices/${deviceId}/auth`, {}, token);
    await refreshData();
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
    const attachments = await uploadAttachments(payload.files);
    const response = await apiRequest<{ message: string }>(
      payload.endpoint,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: payload.deviceId,
          campaignName: payload.campaignName,
          recipients: payload.recipients,
          message: payload.message,
          attachments,
          scheduleAt: payload.scheduleAt || null,
          delaySeconds: payload.delaySeconds,
        }),
      },
      token,
    );

    await refreshData();
    return response.message;
  }

  async function cancelQueueItem(itemId: string) {
    await apiRequest(`/api/queue/${itemId}/cancel`, { method: 'POST' }, token);
    await refreshData();
  }

  async function cancelCampaign(groupKey: string) {
    const group = queueGroups.find((item) => item.key === groupKey);
    if (!group) {
      return;
    }

    await Promise.all(
      group.items
        .filter((item) => ['pending', 'processing'].includes(item.status))
        .map((item) => apiRequest(`/api/queue/${item.id}/cancel`, { method: 'POST' }, token)),
    );

    await refreshData();
  }

  function createDraftList(listName: string) {
    const normalized = listName.trim();
    if (!normalized) {
      return '';
    }

    setActiveContactListName(normalized);
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

    await apiRequest(`/api/contact-lists/${encodeURIComponent(listName)}`, { method: 'DELETE' }, token);
    setSelectedContactListNames((current) => {
      const next = new Set(current);
      next.delete(listName);
      return next;
    });
    await refreshData();
  }

  async function saveContact(draft: ContactDraft, contactId?: string) {
    const path = contactId ? `/api/contacts/${contactId}` : '/api/contacts';
    const method = contactId ? 'PUT' : 'POST';

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
  }

  async function bulkUpdateContacts(contactIds: string[], data: string, notes: string) {
    const shouldUpdateData = Boolean(data.trim());
    const shouldUpdateNotes = Boolean(notes.trim());

    if (!shouldUpdateData && !shouldUpdateNotes) {
      throw new Error('Preencha ao menos um campo para atualizar em lote.');
    }

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
  }

  async function deleteContact(contactId: string) {
    await apiRequest(`/api/contacts/${contactId}`, { method: 'DELETE' }, token);
    await refreshData();
  }

  async function deleteContacts(contactIds: string[]) {
    await Promise.all(contactIds.map((contactId) => apiRequest(`/api/contacts/${contactId}`, { method: 'DELETE' }, token)));
    setSelectedContactIds(new Set());
    await refreshData();
  }

  async function importContactsFromSpreadsheet(file: File) {
    if (!activeContactListName) {
      throw new Error('Selecione uma lista antes de importar.');
    }

    const rows = await readSpreadsheet(file);
    const importedContacts = rows
      .map((row) => ({
        listName: activeContactListName,
        name: row[0] || '',
        phone: row[1] || '',
        paciente: row[2] || '',
        profissional: row[3] || '',
        data: row[4] || '',
        hora: row[5] || '',
        notes: row[6] || '',
      }))
      .filter((item) => item.name && item.phone);

    const response = await apiRequest<{ message: string }>(
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
    return response.message;
  }

  async function saveAdminUser(payload: AdminUser, currentMatricula?: string | null) {
    const path = currentMatricula ? `/api/admin/users/${currentMatricula}` : '/api/admin/users';
    const method = currentMatricula ? 'PUT' : 'POST';

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
  }

  async function deleteAdminUser(matricula: string) {
    await apiRequest(`/api/admin/users/${matricula}`, { method: 'DELETE' }, token);
    await refreshData();
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
        login,
        logout,
        refreshData,
        connectDevice,
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
