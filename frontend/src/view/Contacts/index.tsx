import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmModal } from '../../components/ConfirmModal';
import { GuideModal } from '../../components/GuideModal';
import {
  Badge,
  DangerButton,
  EmptyState,
  FieldLabel,
  GhostButton,
  IconButton,
  InlineActions,
  InputGroup,
  MiniButton,
  Panel,
  PanelHeading,
  PaginationRow,
  Stack,
  StatusText,
} from '../../components/AppShell/styled';
import { Contact } from '../../types';
import { useApp } from '../../providers/AppProvider';
import {
  CardHeader,
  CardMeta,
  ContactCard,
  ContactsGrid,
  CreateListForm,
  HeroHeader,
  HeroPanel,
  HiddenFileInput,
  ListButton,
  ListsOverview,
  ModalCard,
  ModalOverlay,
  SearchField,
  SelectedBanner,
} from './styled';

type ContactModalMode = 'create' | 'edit' | 'bulk-edit';

interface ConfirmState {
  title: string;
  description: string;
  confirmLabel: string;
  action: 'delete-list' | 'delete-selected' | 'delete-contact' | 'delete-selected-lists';
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

export function ContactsView() {
  const {
    contactGroups,
    activeContactListName,
    activeListContacts,
    selectedContactIds,
    createDraftList,
    setActiveContactListName,
    removeContactList,
    saveContact,
    bulkUpdateContacts,
    deleteContact,
    deleteContacts,
    importContactsFromSpreadsheet,
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


  const pageSize = 10;
  const filteredContactGroups = useMemo(() => {
    const normalizedSearch = listSearchTerm.trim().toLocaleLowerCase('pt-BR');

    if (!normalizedSearch) {
      return contactGroups;
    }

    return contactGroups.filter((group) => group.listName.toLocaleLowerCase('pt-BR').includes(normalizedSearch));
  }, [contactGroups, listSearchTerm]);

  const listsPageCount = Math.max(1, Math.ceil(Math.max(filteredContactGroups.length, 1) / pageSize));
  const pagedLists = filteredContactGroups.slice((contactListsPage - 1) * pageSize, contactListsPage * pageSize);

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

  const contactsPageCount = Math.max(1, Math.ceil(Math.max(filteredContacts.length, 1) / pageSize));
  const pageItems = filteredContacts.slice((contactsPage - 1) * pageSize, contactsPage * pageSize);

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
      phone: contact.phone || '',
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

  function handleRemoveList() {
    if (selectedListNames.size === 0) {
      return;
    }

    setConfirmState({
      title: 'Apagar listas selecionadas',
      description: `Tem certeza que deseja apagar ${selectedListNames.size} lista(s) selecionada(s)? Essa acao remove as listas e todos os contatos delas.`,
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
              Crie uma lista primeiro e depois adicione contatos manualmente ou por planilha.
            </p>
          </div>
          <InlineActions>
            <GhostButton type="button" onClick={() => setGuideOpen(true)}>
              Guia rapido
            </GhostButton>
            <IconButton type="button" onClick={() => setCreateListOpen((current) => !current)}>
              {createListOpen ? '×' : '+'}
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

      <Panel>
        <PanelHeading>
          <div>
            <h3>Suas Listas</h3>
          </div>
          <InlineActions>
            <GhostButton
              type="button"
              onClick={() => {
                setSelectedListNames(new Set(filteredContactGroups.map((group) => group.listName)));
                setActiveContactListName('');
                setContactSearchTerm('');
                setContactsPage(1);
                clearSelectedContacts();
                setCreateListOpen(false);
              }}
            >
              Selecionar Todas
            </GhostButton>
            <GhostButton
              type="button"
              onClick={() => {
                setSelectedListNames(new Set());
                setActiveContactListName('');
                setContactSearchTerm('');
                setContactsPage(1);
                clearSelectedContacts();
              }}
            >
              Limpar Seleção
            </GhostButton>
            <DangerButton type="button" onClick={() => void handleRemoveList()}>
              Apagar Selecionadas
            </DangerButton>
          </InlineActions>
        </PanelHeading>

        <SearchField style={{ marginBottom: 18 }}>
          <span>Buscar lista</span>
          <input
            type="text"
            placeholder="Pesquisar pelo nome da lista"
            value={listSearchTerm}
            onChange={(event) => {
              setListSearchTerm(event.target.value);
              setContactListsPage(1);
            }}
          />
        </SearchField>

        {contactGroups.length === 0 && !createListOpen ? (
          <EmptyState>Nenhuma lista criada ainda. Use o botao + para comecar.</EmptyState>
        ) : filteredContactGroups.length === 0 ? (
          <EmptyState>Nenhuma lista encontrada para essa busca.</EmptyState>
        ) : (
          <ListsOverview>
            {pagedLists.map((group) => (
              <ListButton
                key={group.listName}
                type="button"
                $active={
                  group.listName === activeContactListName
                  || selectedListNames.has(group.listName)
                }
                onClick={() => {
                  setSelectedListNames((current) => {
                    const next = new Set(current);
                    if (next.has(group.listName)) {
                      next.delete(group.listName);
                    } else {
                      next.add(group.listName);
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
              >
                <div>
                  <strong>{group.listName}</strong>
                  <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>{group.contacts.length} contato(s)</p>
                </div>
                <InlineActions>
                  <Badge>{group.contacts.length}</Badge>
                  {selectedListNames.has(group.listName) ? <Badge>Selecionada</Badge> : null}
                </InlineActions>
              </ListButton>
            ))}
          </ListsOverview>
        )}

        <PaginationRow>
          <GhostButton type="button" onClick={() => setContactListsPage((current) => Math.max(1, current - 1))}>
            Anterior
          </GhostButton>
          <span style={{ color: 'var(--muted)' }}>Pagina {contactListsPage} de {listsPageCount}</span>
          <GhostButton
            type="button"
            onClick={() => setContactListsPage((current) => Math.min(listsPageCount, current + 1))}
          >
            Proxima
          </GhostButton>
        </PaginationRow>
      </Panel>

      <Panel>
        {!activeContactListName ? (
          <EmptyState>Selecione uma lista para ver os contatos, cadastrar novos itens e importar planilhas.</EmptyState>
        ) : (
          <>
            <PanelHeading>
              <div>
                <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.18em' }}>
                  Lista ativa
                </p>
                <h3 style={{ margin: '8px 0 4px' }}>{activeContactListName}</h3>
                <p style={{ margin: 0, color: 'var(--muted)' }}>{activeListContacts.length} contato(s) nesta lista.</p>
              </div>
              <InlineActions>
                <GhostButton type="button" onClick={openCreateContact}>
                  Novo Contato
                </GhostButton>
                <GhostButton type="button" onClick={() => fileInputRef.current?.click()}>
                  Importar Contatos
                </GhostButton>
              </InlineActions>
            </PanelHeading>

            <SelectedBanner>
              <FieldLabel>Resumo da lista</FieldLabel>
              <strong>{activeContactListName}</strong>
              <span style={{ color: 'var(--muted)' }}>
                {filteredContacts.length} de {activeListContacts.length} contato(s) visivel(is).
              </span>
              <InlineActions>
                <GhostButton type="button" onClick={() => selectContactIds(pageItems.map((contact) => contact.id))}>
                  Selecionar todos
                </GhostButton>
                <GhostButton type="button" onClick={clearSelectedContacts}>
                  Limpar selecao
                </GhostButton>
                <GhostButton type="button" onClick={openBulkEdit}>
                  Editar selecionados
                </GhostButton>
                <DangerButton type="button" onClick={() => void handleDeleteSelectedContacts()}>
                  Excluir selecionados
                </DangerButton>
              </InlineActions>

              <SearchField>
                <span>Filtrar contatos</span>
                <input
                  type="text"
                  placeholder="Pesquisar por nome, numero, paciente..."
                  value={contactSearchTerm}
                  onChange={(event) => {
                    setContactSearchTerm(event.target.value);
                    setContactsPage(1);
                  }}
                />
              </SearchField>
            </SelectedBanner>

            <div style={{ marginTop: 18 }}>
              {filteredContacts.length === 0 ? (
                <EmptyState>Lista criada. Agora adicione os contatos manualmente ou por planilha.</EmptyState>
              ) : (
                <ContactsGrid>
                  {pageItems.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      $selected={selectedContactIds.has(contact.id)}
                      onClick={() => toggleContactSelection(contact.id)}
                    >
                      <CardHeader>
                        <div>
                          <strong>{contact.name}</strong>
                          <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>{contact.phone}</p>
                        </div>
                        <InlineActions>
                          <MiniButton
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditContact(contact);
                            }}
                          >
                            Editar
                          </MiniButton>
                          <DangerButton
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDeleteContact(contact);
                            }}
                          >
                            Excluir
                          </DangerButton>
                        </InlineActions>
                      </CardHeader>

                      <CardMeta>
                        <span><strong>Paciente:</strong> {contact.paciente || '-'}</span>
                        <span><strong>Profissional:</strong> {contact.profissional || '-'}</span>
                        <span><strong>Data:</strong> {contact.data || '-'}</span>
                        <span><strong>Hora:</strong> {contact.hora || '-'}</span>
                        <span><strong>Observacoes:</strong> {contact.notes || '-'}</span>
                      </CardMeta>
                    </ContactCard>
                  ))}
                </ContactsGrid>
              )}
            </div>

            <PaginationRow>
              <GhostButton type="button" onClick={() => setContactsPage((current) => Math.max(1, current - 1))}>
                Anterior
              </GhostButton>
              <span style={{ color: 'var(--muted)' }}>Pagina {contactsPage} de {contactsPageCount}</span>
              <GhostButton
                type="button"
                onClick={() => setContactsPage((current) => Math.min(contactsPageCount, current + 1))}
              >
                Proxima
              </GhostButton>
            </PaginationRow>
          </>
        )}

        <HiddenFileInput ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} />
        {importStatus ? <StatusText style={{ marginTop: 16 }}>{importStatus}</StatusText> : null}
      </Panel>

      {contactModalOpen ? (
        <ModalOverlay onClick={() => setContactModalOpen(false)}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <PanelHeading>
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
                    : 'Os dados serao adicionados na lista ativa.'}
                </p>
              </div>
              <GhostButton type="button" onClick={() => setContactModalOpen(false)}>
                Fechar
              </GhostButton>
            </PanelHeading>

            <form onSubmit={handleSaveContact}>
              <Stack>
                <SelectedBanner>
                  <FieldLabel>Lista selecionada</FieldLabel>
                  <strong>{activeContactListName || 'Nenhuma lista selecionada'}</strong>
                </SelectedBanner>

                {contactModalMode === 'bulk-edit' ? (
                  <EmptyState>
                    Na edicao em lote, voce pode alterar apenas data e observacoes para todos os contatos selecionados.
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
                      <span>Numero WhatsApp</span>
                      <input
                        type="text"
                        value={draft.phone}
                        onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))}
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

      <GuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
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
