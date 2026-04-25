import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmModal } from '../../components/ConfirmModal';
import { GuideModal } from '../../components/GuideModal';
import {
  EmptyState,
  FieldLabel,
  GhostButton,
  IconButton,
  InlineActions,
  InputGroup,
  Panel,
  Stack,
  StatusText,
} from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { Contact } from '../../types';
import {
  ContactListsSection,
  ContactsHeader,
  ContactsList,
  ContactsPagination,
  ContactsSelectionBar,
  ContactsToolbar,
} from './components';
import {
  ContactsSection,
  CreateListForm,
  GroupCard,
  GroupGrid,
  GroupList,
  GroupPanel,
  HeroHeader,
  HeroPanel,
  HiddenFileInput,
  ModalCard,
  ModalHeader,
  ModalOverlay,
  SelectedBanner,
} from './styled';

type ContactModalMode = 'create' | 'edit' | 'bulk-edit';

interface ConfirmState {
  title: string;
  description: string;
  confirmLabel: string;
  action: 'delete-selected' | 'delete-contact' | 'delete-selected-lists';
  contact?: Contact;
}

const emptyDraft = {
  name: '',
  phone: '',
  paciente: '',
  profissional: '',
  data: '',
  hora: '',
  notes: '',
};

function normalizeWhatsAppNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 11);
}

function formatWhatsAppNumber(value: string) {
  const digits = normalizeWhatsAppNumber(value);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : '';
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function ContactsView() {
  const {
    contactGroups,
    activeContactListName,
    activeListContacts,
    selectedContactIds,
    whatsappGroups,
    createDraftList,
    setActiveContactListName,
    removeContactList,
    saveContact,
    bulkUpdateContacts,
    deleteContact,
    deleteContacts,
    importContactsFromSpreadsheet,
    refreshWhatsAppGroups,
    syncWhatsAppGroupsSilently,
    createWhatsAppGroup,
    toggleContactSelection,
    selectContactIds,
    clearSelectedContacts,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [createListOpen, setCreateListOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [createListStatus, setCreateListStatus] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const [groupStatus, setGroupStatus] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [contactListsPage, setContactListsPage] = useState(1);
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [selectedListNames, setSelectedListNames] = useState<Set<string>>(new Set());
  const [contactsPage, setContactsPage] = useState(1);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactModalMode, setContactModalMode] = useState<ContactModalMode>('create');
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactStatus, setContactStatus] = useState('');
  const [draft, setDraft] = useState(emptyDraft);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const hasSyncedGroupsOnOpenRef = useRef(false);

  const listPageSize = 6;
  const contactsPageSize = 10;

  const filteredContactGroups = useMemo(() => {
    const normalizedSearch = listSearchTerm.trim().toLocaleLowerCase('pt-BR');

    if (!normalizedSearch) {
      return contactGroups;
    }

    return contactGroups.filter((group) => group.listName.toLocaleLowerCase('pt-BR').includes(normalizedSearch));
  }, [contactGroups, listSearchTerm]);

  const listsPageCount = Math.max(1, Math.ceil(Math.max(filteredContactGroups.length, 1) / listPageSize));
  const pagedLists = filteredContactGroups.slice(
    (contactListsPage - 1) * listPageSize,
    contactListsPage * listPageSize,
  );

  const filteredContacts = useMemo(() => {
    const normalizedSearch = contactSearchTerm.trim().toLocaleLowerCase('pt-BR');

    if (!normalizedSearch) {
      return activeListContacts;
    }

    return activeListContacts.filter((contact) =>
      [
        contact.name,
        contact.phone,
        contact.paciente,
        contact.profissional,
        contact.data,
        contact.hora,
        contact.notes,
      ]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(normalizedSearch),
    );
  }, [activeListContacts, contactSearchTerm]);

  const contactsPageCount = Math.max(1, Math.ceil(Math.max(filteredContacts.length, 1) / contactsPageSize));
  const pageItems = filteredContacts.slice(
    (contactsPage - 1) * contactsPageSize,
    contactsPage * contactsPageSize,
  );
  const allVisibleContactsSelected = pageItems.length > 0 && pageItems.every((contact) => selectedContactIds.has(contact.id));

  useEffect(() => {
    setContactListsPage((current) => Math.min(current, listsPageCount));
  }, [listsPageCount]);

  useEffect(() => {
    setContactsPage((current) => Math.min(current, contactsPageCount));
  }, [contactsPageCount]);

  useEffect(() => {
    setSelectedListNames((current) => new Set(
      Array.from(current).filter((listName) => contactGroups.some((group) => group.listName === listName)),
    ));
  }, [contactGroups]);

  useEffect(() => {
    if (hasSyncedGroupsOnOpenRef.current) {
      return;
    }

    hasSyncedGroupsOnOpenRef.current = true;
    setGroupStatus('Atualizando grupos do WhatsApp...');

    void refreshWhatsAppGroups()
      .then(() => {
        setGroupStatus('Grupos do WhatsApp atualizados com sucesso.');
      })
      .catch((error) => {
        setGroupStatus(error instanceof Error ? error.message : 'Falha ao atualizar grupos do WhatsApp.');
      });
  }, [refreshWhatsAppGroups]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void syncWhatsAppGroupsSilently().catch(() => {
        // Mantem a tela utilizavel se a sincronizacao em segundo plano falhar.
      });
    }, 8000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [syncWhatsAppGroupsSilently]);

  function resetDraft() {
    setDraft(emptyDraft);
    setEditingContactId(null);
    setContactStatus('');
  }

  function openCreateContact() {
    if (!activeContactListName) {
      return;
    }

    resetDraft();
    setContactModalMode('create');
    setContactModalOpen(true);
  }

  function openEditContact(contact: Contact) {
    setEditingContactId(contact.id);
    setContactModalMode('edit');
    setDraft({
      name: contact.name || '',
      phone: formatWhatsAppNumber(contact.phone || ''),
      paciente: contact.paciente || '',
      profissional: contact.profissional || '',
      data: contact.data || '',
      hora: contact.hora || '',
      notes: contact.notes || '',
    });
    setContactStatus('');
    setContactModalOpen(true);
  }

  function openBulkEdit() {
    if (selectedContactIds.size === 0) {
      return;
    }

    setContactModalMode('bulk-edit');
    setEditingContactId(null);
    setDraft(emptyDraft);
    setContactStatus('');
    setContactModalOpen(true);
  }

  async function handleSaveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (contactModalMode === 'bulk-edit') {
        await bulkUpdateContacts(Array.from(selectedContactIds), draft.data, draft.notes);
        setContactStatus('Contatos atualizados com sucesso.');
      } else {
        await saveContact(
          {
            listName: activeContactListName.trim(),
            ...draft,
            phone: normalizeWhatsAppNumber(draft.phone),
          },
          editingContactId || undefined,
        );
        setContactStatus('Contato salvo com sucesso.');
      }

      setContactModalOpen(false);
      resetDraft();
    } catch (error) {
      setContactStatus(error instanceof Error ? error.message : 'Falha ao salvar contato.');
    }
  }

  async function handleCreateList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = createDraftList(newListName);
    if (!normalized) {
      setCreateListStatus('Informe um nome para a lista.');
      return;
    }

    setCreateListOpen(false);
    setCreateListStatus('Lista preparada. Agora adicione o primeiro contato para salva-la.');
    setNewListName('');
    setContactSearchTerm('');
    setContactsPage(1);
    clearSelectedContacts();
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const message = await importContactsFromSpreadsheet(file);
      setImportStatus(message);
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : 'Falha ao importar contatos.');
    }
  }

  async function handleRefreshGroups() {
    try {
      setGroupStatus('Atualizando grupos do WhatsApp...');
      await refreshWhatsAppGroups();
      setGroupStatus('Grupos do WhatsApp atualizados com sucesso.');
    } catch (error) {
      setGroupStatus(error instanceof Error ? error.message : 'Falha ao atualizar grupos do WhatsApp.');
    }
  }

  async function handleCreateGroupFromActiveList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeContactListName) {
      setGroupStatus('Selecione uma lista antes de cadastrar um grupo.');
      return;
    }

    if (!newGroupName.trim()) {
      setGroupStatus('Informe o nome do grupo.');
      return;
    }

    const sourceContacts = selectedContactIds.size > 0
      ? activeListContacts.filter((contact) => selectedContactIds.has(contact.id))
      : activeListContacts;

    if (sourceContacts.length === 0) {
      setGroupStatus('Essa lista não possui contatos para criar o grupo.');
      return;
    }

    try {
      setGroupStatus('Criando grupo no WhatsApp...');
      const message = await createWhatsAppGroup({
        name: newGroupName.trim(),
        contactIds: sourceContacts.map((contact) => contact.id),
      });
      setNewGroupName('');
      setGroupStatus(message);
    } catch (error) {
      setGroupStatus(error instanceof Error ? error.message : 'Falha ao criar grupo.');
    }
  }

  function handleRemoveList() {
    if (selectedListNames.size === 0) {
      return;
    }

    setConfirmState({
      title: 'Apagar listas selecionadas',
      description: `Tem certeza que deseja apagar ${selectedListNames.size} lista(s) selecionada(s)? Essa ação remove as listas e todos os contatos delas.`,
      confirmLabel: 'Apagar listas',
      action: 'delete-selected-lists',
    });
  }

  function handleDeleteSelectedContacts() {
    if (selectedContactIds.size === 0) {
      return;
    }

    setConfirmState({
      title: 'Apagar contatos selecionados',
      description: `Tem certeza que deseja apagar ${selectedContactIds.size} contato(s) selecionado(s)?`,
      confirmLabel: 'Apagar contatos',
      action: 'delete-selected',
    });
  }

  function handleDeleteContact(contact: Contact) {
    setConfirmState({
      title: 'Apagar contato',
      description: `Tem certeza que deseja apagar o contato "${contact.name}"?`,
      confirmLabel: 'Apagar contato',
      action: 'delete-contact',
      contact,
    });
  }

  async function handleConfirmAction() {
    if (!confirmState) {
      return;
    }

    setConfirmBusy(true);

    try {
      if (confirmState.action === 'delete-selected') {
        await deleteContacts(Array.from(selectedContactIds));
      }

      if (confirmState.action === 'delete-selected-lists') {
        for (const listName of selectedListNames) {
          await removeContactList(listName);
        }
        setSelectedListNames(new Set());
      }

      if (confirmState.action === 'delete-contact' && confirmState.contact) {
        await deleteContact(confirmState.contact.id);
      }

      setConfirmState(null);
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <>
      <HeroPanel>
        <HeroHeader>
          <div>
            <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.18em' }}>
              Contatos
            </p>
            <h2 style={{ margin: '8px 0 4px' }}>Listas de contatos</h2>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Crie listas, cadastre contatos e tambem gerencie grupos do WhatsApp a partir daqui.
            </p>
          </div>
          <InlineActions>
            <GhostButton type="button" onClick={() => setGuideOpen(true)}>
              Guia rapido
            </GhostButton>
            <IconButton type="button" onClick={() => setCreateListOpen((current) => !current)}>
              {createListOpen ? 'x' : '+'}
            </IconButton>
          </InlineActions>
        </HeroHeader>

        {createListOpen ? (
          <CreateListForm onSubmit={handleCreateList}>
            <InputGroup>
              <span>Nome da nova lista</span>
              <input
                type="text"
                value={newListName}
                maxLength={80}
                placeholder="Ex.: Pacientes da segunda"
                onChange={(event) => setNewListName(event.target.value)}
                required
              />
            </InputGroup>
            <InlineActions>
              <button type="submit">Criar lista</button>
              <GhostButton type="button" onClick={() => setCreateListOpen(false)}>
                Cancelar
              </GhostButton>
            </InlineActions>
          </CreateListForm>
        ) : null}

        {createListStatus ? <StatusText>{createListStatus}</StatusText> : null}
      </HeroPanel>

      <GroupPanel>
        <HeroHeader>
          <div>
            <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.18em' }}>
              Grupos
            </p>
            <h3 style={{ margin: '8px 0 4px' }}>Grupos do WhatsApp</h3>
          </div>
          <InlineActions>
            <GhostButton type="button" onClick={() => void handleRefreshGroups()}>
              Atualizar grupos
            </GhostButton>
          </InlineActions>
        </HeroHeader>

        <GroupGrid>
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <FieldLabel>Grupos sincronizados</FieldLabel>
              <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
                {whatsappGroups.length > 0
          ? `${whatsappGroups.length} grupo(s) encontrados na sessão conectada.`
                  : 'Nenhum grupo sincronizado ainda.'}
              </p>
            </div>

            <GroupList>
              {whatsappGroups.length === 0 ? (
                <EmptyState>Conecte o WhatsApp no menu Dispositivo e clique em Atualizar grupos.</EmptyState>
              ) : whatsappGroups.map((group) => (
                <GroupCard key={group.whatsappGroupId}>
                  <strong>{group.name}</strong>
                  <span>{group.whatsappGroupId}</span>
                </GroupCard>
              ))}
            </GroupList>
          </div>

          <form onSubmit={handleCreateGroupFromActiveList} style={{ display: 'grid', gap: 14 }}>
            <div>
              <FieldLabel>Cadastrar novo grupo</FieldLabel>
              <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
            O grupo será criado com os contatos da lista ativa. Se houver contatos selecionados nessa lista, uso apenas eles.
              </p>
            </div>

            <SelectedBanner>
              <FieldLabel>Origem dos participantes</FieldLabel>
              <strong>{activeContactListName || 'Nenhuma lista selecionada'}</strong>
              <span>
                {activeContactListName
                  ? `${selectedContactIds.size > 0 ? activeListContacts.filter((contact) => selectedContactIds.has(contact.id)).length : activeListContacts.length} contato(s) prontos para entrar no grupo.`
                  : 'Selecione uma lista abaixo para habilitar o cadastro.'}
              </span>
            </SelectedBanner>

            <InputGroup>
              <span>Nome do grupo</span>
              <input
                type="text"
                value={newGroupName}
                maxLength={80}
                placeholder="Ex.: Equipe Comercial"
                onChange={(event) => setNewGroupName(event.target.value)}
              />
            </InputGroup>

            <InlineActions>
              <button type="submit">Cadastrar grupo no WhatsApp</button>
            </InlineActions>
          </form>
        </GroupGrid>

        {groupStatus ? <StatusText>{groupStatus}</StatusText> : null}
      </GroupPanel>

      <Panel>
        {contactGroups.length === 0 && !createListOpen ? (
          <EmptyState>Nenhuma lista criada ainda. Use o botao + para comecar.</EmptyState>
        ) : (
          <ContactListsSection
            groups={pagedLists}
            selectedListNames={selectedListNames}
            activeContactListName={activeContactListName}
            searchTerm={listSearchTerm}
            page={contactListsPage}
            pageCount={listsPageCount}
            onSearchChange={(value) => {
              setListSearchTerm(value);
              setContactListsPage(1);
            }}
            onToggleList={(listName) => {
              setSelectedListNames((current) => {
                const next = new Set(current);
                if (next.has(listName)) {
                  next.delete(listName);
                } else {
                  next.add(listName);
                }

                const nextSelectedNames = Array.from(next);
                const nextActiveListName = nextSelectedNames.length === 1 ? nextSelectedNames[0] : '';

                setActiveContactListName(nextActiveListName);
                setContactsPage(1);
                setContactSearchTerm('');
                clearSelectedContacts();
                setCreateListOpen(false);

                return next;
              });
            }}
            onSelectAll={() => {
              const nextSelectedNames = filteredContactGroups.map((group) => group.listName);
              setSelectedListNames(new Set(nextSelectedNames));
              setActiveContactListName(nextSelectedNames.length === 1 ? nextSelectedNames[0] : '');
              setContactSearchTerm('');
              setContactsPage(1);
              clearSelectedContacts();
              setCreateListOpen(false);
            }}
            onClearSelection={() => {
              setSelectedListNames(new Set());
              setActiveContactListName('');
              setContactSearchTerm('');
              setContactsPage(1);
              clearSelectedContacts();
            }}
            onDeleteSelected={() => void handleRemoveList()}
            onPrevPage={() => setContactListsPage((current) => Math.max(1, current - 1))}
            onNextPage={() => setContactListsPage((current) => Math.min(listsPageCount, current + 1))}
          />
        )}
      </Panel>

      <Panel>
        {!activeContactListName ? (
          <EmptyState>Selecione uma lista para ver os contatos, cadastrar novos itens e importar planilhas.</EmptyState>
        ) : (
          <ContactsSection>
            <ContactsHeader
              listName={activeContactListName}
              totalContacts={activeListContacts.length}
              onCreateContact={openCreateContact}
              onImportContacts={() => fileInputRef.current?.click()}
            />

            <ContactsToolbar
              searchTerm={contactSearchTerm}
              allVisibleSelected={allVisibleContactsSelected}
              visibleCount={pageItems.length}
              onSearchChange={(value) => {
                setContactSearchTerm(value);
                setContactsPage(1);
              }}
              onToggleSelectAll={(checked) => {
                if (checked) {
                  selectContactIds(pageItems.map((contact) => contact.id));
                  return;
                }

                clearSelectedContacts();
              }}
            />

            <ContactsSelectionBar
              selectedCount={selectedContactIds.size}
              onClearSelection={clearSelectedContacts}
              onBulkEdit={openBulkEdit}
              onDeleteSelected={() => void handleDeleteSelectedContacts()}
            />

            <ContactsList
              contacts={pageItems}
              selectedContactIds={selectedContactIds}
              onToggleContact={toggleContactSelection}
              onEditContact={openEditContact}
              onDeleteContact={(contact) => void handleDeleteContact(contact)}
            />

            <ContactsPagination
              page={contactsPage}
              pageCount={contactsPageCount}
              onPrev={() => setContactsPage((current) => Math.max(1, current - 1))}
              onNext={() => setContactsPage((current) => Math.min(contactsPageCount, current + 1))}
            />
          </ContactsSection>
        )}

        <HiddenFileInput ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} />
        {importStatus ? <StatusText style={{ marginTop: 16 }}>{importStatus}</StatusText> : null}
      </Panel>

      {contactModalOpen ? (
        <ModalOverlay onClick={() => setContactModalOpen(false)}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <div>
                <h3 style={{ margin: 0 }}>
                  {contactModalMode === 'bulk-edit'
                    ? 'Editar contatos selecionados'
                    : contactModalMode === 'edit'
                      ? 'Editar contato'
                      : 'Novo contato'}
                </h3>
                <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
                  {contactModalMode === 'bulk-edit'
                    ? `${selectedContactIds.size} contato(s) serao atualizados em lote.`
                : 'Os dados serão adicionados na lista ativa.'}
                </p>
              </div>
              <GhostButton type="button" onClick={() => setContactModalOpen(false)}>
                Fechar
              </GhostButton>
            </ModalHeader>

            <form onSubmit={handleSaveContact}>
              <Stack>
                <SelectedBanner>
                  <FieldLabel>Lista selecionada</FieldLabel>
                  <strong>{activeContactListName || 'Nenhuma lista selecionada'}</strong>
                </SelectedBanner>

                {contactModalMode === 'bulk-edit' ? (
                  <EmptyState>
              Na edição em lote, você pode alterar apenas data e observações para todos os contatos selecionados.
                  </EmptyState>
                ) : (
                  <>
                    <InputGroup>
                      <span>Nome</span>
                      <input
                        type="text"
                        value={draft.name}
                        onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                        required
                      />
                    </InputGroup>
                    <InputGroup>
                  <span>Número do WhatsApp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={15}
                        placeholder="(99) 99999-9999"
                        value={draft.phone}
                        onChange={(event) => setDraft((current) => ({
                          ...current,
                          phone: formatWhatsAppNumber(event.target.value),
                        }))}
                        required
                      />
                    </InputGroup>
                    <InputGroup>
                      <span>Paciente</span>
                      <input
                        type="text"
                        value={draft.paciente}
                        onChange={(event) => setDraft((current) => ({ ...current, paciente: event.target.value }))}
                      />
                    </InputGroup>
                    <InputGroup>
                      <span>Profissional</span>
                      <input
                        type="text"
                        value={draft.profissional}
                        onChange={(event) => setDraft((current) => ({ ...current, profissional: event.target.value }))}
                      />
                    </InputGroup>
                  </>
                )}

                <InputGroup>
                  <span>Data</span>
                  <input
                    type="text"
                    placeholder="10/04/2026"
                    value={draft.data}
                    onChange={(event) => setDraft((current) => ({ ...current, data: event.target.value }))}
                  />
                </InputGroup>

                {contactModalMode !== 'bulk-edit' ? (
                  <InputGroup>
                    <span>Hora</span>
                    <input
                      type="text"
                      placeholder="14:00"
                      value={draft.hora}
                      onChange={(event) => setDraft((current) => ({ ...current, hora: event.target.value }))}
                    />
                  </InputGroup>
                ) : null}

                <InputGroup>
                  <span>Observacoes</span>
                  <textarea
                    rows={4}
                    value={draft.notes}
                    onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                  />
                </InputGroup>

                <InlineActions>
                  <button type="submit">Salvar contato</button>
                  <GhostButton
                    type="button"
                    onClick={() => {
                      setContactModalOpen(false);
                      resetDraft();
                    }}
                  >
                    Cancelar
                  </GhostButton>
                </InlineActions>

                {contactStatus ? <StatusText>{contactStatus}</StatusText> : null}
              </Stack>
            </form>
          </ModalCard>
        </ModalOverlay>
      ) : null}

      <GuideModal open={guideOpen} onClose={() => setGuideOpen(false)} variant="contacts" />
      <ConfirmModal
        open={Boolean(confirmState)}
        title={confirmState?.title || ''}
        description={confirmState?.description || ''}
        confirmLabel={confirmState?.confirmLabel || 'Confirmar'}
        busy={confirmBusy}
        onConfirm={handleConfirmAction}
        onClose={() => {
          if (!confirmBusy) {
            setConfirmState(null);
          }
        }}
      />
    </>
  );
}
