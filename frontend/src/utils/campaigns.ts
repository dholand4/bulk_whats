import { CampaignGroup, CampaignItem, Contact, ContactGroup } from '../types';

const campaignStatusLabels: Record<string, string> = {
  pending: 'Pendente',
  queued: 'Na fila',
  scheduled: 'Agendado',
  processing: 'Processando',
  sending: 'Enviando',
  sent: 'Enviado',
  delivered: 'Enviado',
  success: 'Enviado',
  completed: 'Enviado',
  error: 'Erro',
  failed: 'Erro',
  failure: 'Erro',
  canceled: 'Cancelado',
  cancelled: 'Cancelado',
};

export function formatCampaignStatus(status: string) {
  const normalized = status.trim().toLowerCase();

  if (!normalized) {
    return 'Sem status';
  }

  return campaignStatusLabels[normalized] || `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
}

export function getContactGroups(contacts: Contact[], draftContactLists: string[]): ContactGroup[] {
  const groups = contacts.reduce<Record<string, Contact[]>>((accumulator, contact) => {
    const listName = contact.listName || 'Geral';
    accumulator[listName] = accumulator[listName] || [];
    accumulator[listName].push(contact);
    return accumulator;
  }, {});

  draftContactLists.forEach((listName) => {
    groups[listName] = groups[listName] || [];
  });

  return Object.entries(groups)
    .map(([listName, listContacts]) => ({
      listName,
      contacts: [...listContacts].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR')),
    }))
    .sort((left, right) => left.listName.localeCompare(right.listName, 'pt-BR'));
}

export function getActiveListContacts(contacts: Contact[], activeContactListName: string) {
  return contacts
    .filter((contact) => (contact.listName || 'Geral') === activeContactListName)
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
}

export function groupCampaignItems(items: CampaignItem[], type: 'queue' | 'history'): CampaignGroup[] {
  const groups = new Map<string, CampaignGroup>();

  items.forEach((item) => {
    const key = item.campaignId || `${type}-${item.id}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        campaignId: item.campaignId || null,
        campaignName: item.campaignName || 'Envio sem nome',
        deviceId: item.deviceId,
        scheduleAt: item.scheduleAt,
        updatedAt: item.updatedAt,
        message: item.message || '',
        items: [],
      });
    }

    const group = groups.get(key)!;
    group.items.push(item);

    if (new Date(item.scheduleAt) < new Date(group.scheduleAt)) {
      group.scheduleAt = item.scheduleAt;
    }

    if (new Date(item.updatedAt) > new Date(group.updatedAt)) {
      group.updatedAt = item.updatedAt;
    }

    if (!group.message && item.message) {
      group.message = item.message;
    }
  });

  return Array.from(groups.values()).sort((a, b) => {
    const left = type === 'history' ? a.updatedAt : a.scheduleAt;
    const right = type === 'history' ? b.updatedAt : b.scheduleAt;
    return new Date(right).getTime() - new Date(left).getTime();
  });
}

export function buildStatusSummary(items: CampaignItem[]) {
  const counters = items.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.status] = (accumulator[item.status] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counters)
    .map(([status, count]) => `${count} ${formatCampaignStatus(status)}`)
    .join(' | ');
}

export function getCampaignRecipientLabel(item: CampaignItem) {
  if (item.recipientType === 'group') {
    return item.contactName || 'Grupo';
  }

  return item.contactName || 'Contato';
}

export function getCampaignRecipientValue(item: CampaignItem) {
  if (item.recipientType === 'group') {
    return item.recipientId || item.recipientNumber;
  }

  return item.recipientNumber;
}
