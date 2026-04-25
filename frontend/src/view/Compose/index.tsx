import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { GuideModal } from '../../components/GuideModal';
import {
  Badge,
  EmptyState,
  GhostButton,
  InlineActions,
  InputGroup,
  PaginationRow,
  PanelHeading,
  StatusText,
} from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import {
  AttachmentHint,
  AttachmentItem,
  AttachmentList,
  AttachmentMeta,
  AttachmentPreview,
  ContactPreviewCard,
  ContactPreviewHeader,
  ContactPreviewMeta,
  ContactsPreviewList,
  ComposeCard,
  ComposeForm,
  ComposeHeader,
  ComposeStack,
  FooterGrid,
  HeroPanel,
  HiddenFileInput,
  ListItem,
  ListCardBadges,
  ListItemHeader,
  ListCardMain,
  ListCardTitleRow,
  ListMeta,
  ListsStrip,
  ListsSection,
  ListsToolbar,
  ListsToolbarActions,
  ModalCard,
  ModalOverlay,
  PlaceholderChip,
  PlaceholderRow,
  PaginationSummary,
  SearchField,
  SelectionBar,
  SelectionSummary,
  SectionLabel,
  SpreadsheetDropzone,
  SpreadsheetSummary,
  SubmitPanel,
  UploadDropzone,
  UploadPanel,
} from './styled';

const placeholderTokens = ['{nome}', '{paciente}', '{profissional}', '{data}', '{hora}'];
const duplicateAllowedNumbers = new Set(['88997000530', '88999351235']);

export function ComposeView() {
  const {
    devices,
    contacts,
    whatsappGroups,
    templates,
    contactGroups,
    selectedContactListNames,
    toggleComposeList,
    selectAllComposeLists,
    clearComposeLists,
    submitCompose,
    refreshWhatsAppGroups,
    parseComposeRecipientsFromSpreadsheet,
  } = useApp();
  const [guideOpen, setGuideOpen] = useState(false);
  const [previewListName, setPreviewListName] = useState('');
  const [listsPage, setListsPage] = useState(1);
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [deviceId, setDeviceId] = useState(devices[0]?.id || '');
  const [templateId, setTemplateId] = useState('');
  const [message, setMessage] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [selectedWhatsAppGroupIds, setSelectedWhatsAppGroupIds] = useState<Set<string>>(new Set());
  const [spreadsheetRecipients, setSpreadsheetRecipients] = useState<Array<{
    name: string;
    number: string;
    paciente?: string;
    profissional?: string;
    data?: string;
    hora?: string;
  }>>([]);
  const [spreadsheetFileName, setSpreadsheetFileName] = useState('');
  const [spreadsheetSkippedRows, setSpreadsheetSkippedRows] = useState(0);
  const [excludedContactIds, setExcludedContactIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messageSelectionRef = useRef({ start: 0, end: 0 });

  useEffect(() => {
    if (!deviceId && devices.length > 0) {
      setDeviceId(devices[0].id);
    }
  }, [deviceId, devices]);

  useEffect(() => {
    setExcludedContactIds((current) => new Set(
      Array.from(current).filter((contactId) => contacts.some((contact) => contact.id === contactId)),
    ));
  }, [contacts]);

  useEffect(() => {
    if (previewListName && !contactGroups.some((group) => group.listName === previewListName)) {
      setPreviewListName('');
    }
  }, [contactGroups, previewListName]);

  useEffect(() => {
    setSelectedWhatsAppGroupIds((current) => new Set(
      Array.from(current).filter((groupId) => whatsappGroups.some((group) => group.whatsappGroupId === groupId)),
    ));
  }, [whatsappGroups]);

  const selectedGroups = useMemo(
    () => contactGroups.filter((group) => selectedContactListNames.has(group.listName)),
    [contactGroups, selectedContactListNames],
  );

  const pageSize = 6;

  const filteredContactGroups = useMemo(() => {
    const normalizedSearch = listSearchTerm.trim().toLocaleLowerCase('pt-BR');

    if (!normalizedSearch) {
      return contactGroups;
    }

    return contactGroups.filter((group) => group.listName.toLocaleLowerCase('pt-BR').includes(normalizedSearch));
  }, [contactGroups, listSearchTerm]);

  const listsPageCount = Math.max(1, Math.ceil(Math.max(filteredContactGroups.length, 1) / pageSize));
  const pagedContactGroups = filteredContactGroups.slice((listsPage - 1) * pageSize, listsPage * pageSize);

  const recipientsFromLists = useMemo(
    () =>
      selectedGroups
        .flatMap((group) =>
          group.contacts
            .filter((contact) => !excludedContactIds.has(contact.id))
            .map((contact) => ({
              name: contact.name,
              number: contact.phone,
              listName: contact.listName,
              paciente: contact.paciente,
              profissional: contact.profissional,
              data: contact.data,
              hora: contact.hora,
            })),
        ),
    [excludedContactIds, selectedGroups],
  );

  const selectedWhatsAppGroups = useMemo(
    () => whatsappGroups.filter((group) => selectedWhatsAppGroupIds.has(group.whatsappGroupId)),
    [selectedWhatsAppGroupIds, whatsappGroups],
  );

  const recipientsFromWhatsAppGroups = useMemo(
    () => selectedWhatsAppGroups.map((group) => ({
      type: 'group' as const,
      id: group.whatsappGroupId,
      name: group.name,
      number: group.whatsappGroupId,
    })),
    [selectedWhatsAppGroups],
  );

  const recipients = useMemo(() => {
    const uniqueRecipients = new Map<string, {
      type?: 'contact' | 'group';
      id?: string;
      name: string;
      number?: string;
      listName?: string;
      paciente?: string;
      profissional?: string;
      data?: string;
      hora?: string;
    }>();
    const allowedDuplicateRecipients: Array<{
      name: string;
      number: string;
      listName?: string;
      paciente?: string;
      profissional?: string;
      data?: string;
      hora?: string;
    }> = [];

    [...recipientsFromLists, ...spreadsheetRecipients].forEach((recipient) => {
      const normalizedNumber = String(recipient.number || '').replace(/\D/g, '');
      if (!normalizedNumber) {
        return;
      }

      if (duplicateAllowedNumbers.has(normalizedNumber)) {
        allowedDuplicateRecipients.push({
          ...recipient,
          number: normalizedNumber,
        });
        return;
      }

      if (uniqueRecipients.has(normalizedNumber)) {
        return;
      }

      uniqueRecipients.set(normalizedNumber, {
        type: 'contact',
        ...recipient,
        number: normalizedNumber,
      });
    });

    recipientsFromWhatsAppGroups.forEach((group) => {
      if (!group.id || uniqueRecipients.has(group.id)) {
        return;
      }

      uniqueRecipients.set(group.id, group);
    });

    return [...Array.from(uniqueRecipients.values()), ...allowedDuplicateRecipients];
  }, [recipientsFromLists, spreadsheetRecipients, recipientsFromWhatsAppGroups]);

  const previewGroup = useMemo(
    () => contactGroups.find((group) => group.listName === previewListName) || null,
    [contactGroups, previewListName],
  );

  const usableTemplates = useMemo(
    () => templates.filter((template) =>
      template.active && template.variants.some((variant) => variant.active && variant.body.trim()),
    ),
    [templates],
  );

  const selectedTemplate = useMemo(
    () => usableTemplates.find((template) => template.id === templateId) || null,
    [templateId, usableTemplates],
  );

  useEffect(() => {
    setListsPage((current) => Math.min(current, listsPageCount));
  }, [listsPageCount]);

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files || []));
  }

  function formatFileSize(size: number) {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleSpreadsheetUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      setStatus('Lendo contatos da planilha...');
      const result = await parseComposeRecipientsFromSpreadsheet(file);
      setSpreadsheetRecipients(result.recipients);
      setSpreadsheetFileName(file.name);
      setSpreadsheetSkippedRows(result.skippedRows);
      setStatus(
        result.skippedRows > 0
          ? `${result.recipients.length} contato(s) carregado(s) da planilha. ${result.skippedRows} linha(s) foram ignoradas.`
          : `${result.recipients.length} contato(s) carregado(s) da planilha para envio temporario.`,
      );
    } catch (error) {
      setSpreadsheetRecipients([]);
      setSpreadsheetFileName('');
      setSpreadsheetSkippedRows(0);
      setStatus(error instanceof Error ? error.message : 'Falha ao ler a planilha.');
    }
  }

  function clearSpreadsheetRecipients() {
    setSpreadsheetRecipients([]);
    setSpreadsheetFileName('');
    setSpreadsheetSkippedRows(0);
  }

  function handleToggleList(listName: string, checked: boolean) {
    toggleComposeList(listName, checked);
    if (!checked && previewListName === listName) {
      setPreviewListName('');
    }
  }

  function handleClearComposeLists() {
    clearComposeLists();
    setExcludedContactIds(new Set());
    setPreviewListName('');
  }

  function toggleWhatsAppGroupSelection(groupId: string, checked: boolean) {
    setSelectedWhatsAppGroupIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(groupId);
      } else {
        next.delete(groupId);
      }
      return next;
    });
  }

  function toggleExcludedContact(contactId: string) {
    setExcludedContactIds((current) => {
      const next = new Set(current);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  }

  function clearExcludedFromList(listName: string) {
    const group = contactGroups.find((item) => item.listName === listName);
    if (!group) {
      return;
    }

    setExcludedContactIds((current) => {
      const next = new Set(current);
      group.contacts.forEach((contact) => next.delete(contact.id));
      return next;
    });
  }

  function syncMessageSelection() {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    messageSelectionRef.current = {
      start: textarea.selectionStart || 0,
      end: textarea.selectionEnd || 0,
    };
  }

  function insertPlaceholder(token: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessage((current) => `${current}${token}`);
      return;
    }

    const isTextareaFocused = document.activeElement === textarea;
    const start = isTextareaFocused ? (textarea.selectionStart || 0) : messageSelectionRef.current.start;
    const end = isTextareaFocused ? (textarea.selectionEnd || 0) : messageSelectionRef.current.end;
    const nextValue = `${message.slice(0, start)}${token}${message.slice(end)}`;
    setMessage(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + token.length;
      textarea.setSelectionRange(cursor, cursor);
      messageSelectionRef.current = { start: cursor, end: cursor };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!deviceId || recipients.length === 0 || (!templateId && !message.trim() && files.length === 0)) {
      setStatus('Selecione o dispositivo, ao menos uma lista e informe a mensagem, template ou anexo.');
      return;
    }

    try {
      setStatus('Enviando anexos e criando itens...');
      const responseMessage = await submitCompose({
        endpoint: '/api/queue',
        deviceId,
        campaignName: campaignName.trim(),
        message: message.trim(),
        templateId: templateId || null,
        scheduleAt: scheduleAt || null,
        recipients,
        files,
      });
      setStatus(responseMessage);
      setCampaignName('');
      setMessage('');
      setTemplateId('');
      setScheduleAt('');
      setFiles([]);
      clearSpreadsheetRecipients();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao criar campanha.');
    }
  }

  async function handleSendNow() {
    if (!deviceId || recipients.length === 0 || (!templateId && !message.trim() && files.length === 0)) {
      setStatus('Selecione o dispositivo, ao menos uma lista e informe a mensagem, template ou anexo.');
      return;
    }

    try {
      setStatus('Enviando anexos e criando itens...');
      const responseMessage = await submitCompose({
        endpoint: '/api/messages/send',
        deviceId,
        campaignName: campaignName.trim(),
        message: message.trim(),
        templateId: templateId || null,
        scheduleAt: scheduleAt || null,
        recipients,
        files,
      });
      setStatus(responseMessage);
      clearSpreadsheetRecipients();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao enviar campanha.');
    }
  }

  async function handleRefreshWhatsAppGroups() {
    try {
      setStatus('Sincronizando grupos do WhatsApp...');
      await refreshWhatsAppGroups();
      setStatus('Grupos do WhatsApp atualizados com sucesso.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao atualizar grupos do WhatsApp.');
    }
  }

  return (
    <>
      <HeroPanel>
        <div>
          <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.18em', fontSize: 11, color: 'var(--muted)' }}>
            Mensagens
          </p>
          <h2 style={{ margin: '8px 0 4px' }}>Envio de Mensagens</h2>
          <p style={{ margin: 0, color: 'var(--muted)' }}>Monte a campanha com ritmo automatico e pausas aleatorias entre os envios.</p>
        </div>
        <GhostButton type="button" onClick={() => setGuideOpen(true)}>
          Guia rapido
        </GhostButton>
      </HeroPanel>

      <ComposeForm onSubmit={handleSubmit}>
        <ComposeStack>
          <ComposeCard>
            <ComposeHeader>
              <div>
                <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.18em' }}>
                  Origem
                </p>
                <h3 style={{ margin: '6px 0 0' }}>Dispositivo</h3>
              </div>
            </ComposeHeader>
            <InputGroup>
              <span>Dispositivo</span>
              <select value={deviceId} onChange={(event) => setDeviceId(event.target.value)} required>
                {devices.length === 0 ? (
                  <option value="">Dispositivo do usuario indisponivel</option>
                ) : (
                  devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name} ({device.status})
                    </option>
                  ))
                )}
              </select>
            </InputGroup>
          </ComposeCard>

          <ComposeCard>
            <ComposeHeader>
              <div>
                <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.18em' }}>
                  Campanha
                </p>
                <h3 style={{ margin: '6px 0 0' }}>Nome da campanha</h3>
              </div>
            </ComposeHeader>
            <InputGroup>
              <span>Nome da campanha</span>
              <input
                type="text"
                maxLength={80}
                placeholder="Ex.: Convite evento"
                value={campaignName}
                onChange={(event) => setCampaignName(event.target.value)}
              />
            </InputGroup>
          </ComposeCard>

          <ComposeCard>
            <ComposeHeader>
              <div>
                <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.18em' }}>
                  Destinatarios
                </p>
                <h3 style={{ margin: '6px 0 0' }}>Listas selecionadas</h3>
              </div>
              <InlineActions>
                <GhostButton type="button" onClick={selectAllComposeLists}>
                  Selecionar todas
                </GhostButton>
              </InlineActions>
            </ComposeHeader>

            <UploadPanel>
              <ListsSection>
                <div>
                  <SectionLabel>Listas disponiveis</SectionLabel>
                  <p style={{ margin: 0, color: 'var(--muted)' }}>
                    {selectedContactListNames.size
                      ? `${selectedContactListNames.size} lista(s) selecionada(s).`
                      : 'Nenhuma lista selecionada.'}
                  </p>
                  {selectedContactListNames.size ? (
                    <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>
                      {recipientsFromLists.length} contato(s) seguirao para este envio apos os ajustes.
                    </p>
                  ) : null}
                </div>

                <ListsToolbar>
                  <SearchField style={{ flex: 1 }}>
                    <span>Buscar lista</span>
                    <input
                      type="text"
                      placeholder="Pesquisar pelo nome da lista"
                      value={listSearchTerm}
                      onChange={(event) => {
                        setListSearchTerm(event.target.value);
                        setListsPage(1);
                      }}
                    />
                  </SearchField>
                </ListsToolbar>

                {selectedContactListNames.size > 0 ? (
                  <SelectionBar>
                    <SelectionSummary>{selectedContactListNames.size} lista(s) selecionada(s)</SelectionSummary>
                    <InlineActions>
                      <GhostButton type="button" onClick={handleClearComposeLists}>
                        Limpar selecao
                      </GhostButton>
                    </InlineActions>
                  </SelectionBar>
                ) : null}

                {contactGroups.length === 0 ? (
                  spreadsheetRecipients.length > 0 ? (
                    <EmptyState>
                      Sua planilha ja esta pronta para uso. Se quiser, voce ainda pode combinar esse envio com listas salvas.
                    </EmptyState>
                  ) : (
                    <EmptyState>Cadastre listas e contatos na aba Contatos para montar campanhas.</EmptyState>
                  )
                ) : filteredContactGroups.length === 0 ? (
                  <EmptyState>Nenhuma lista encontrada para essa busca.</EmptyState>
                ) : (
                  <>
                    <ListsStrip>
                      {pagedContactGroups.map((group) => {
                        const active = selectedContactListNames.has(group.listName);
                        const excludedCount = group.contacts.filter((contact) => excludedContactIds.has(contact.id)).length;
                        const includedCount = group.contacts.length - excludedCount;

                        return (
                          <ListItem
                            key={group.listName}
                            $active={active}
                            onClick={() => handleToggleList(group.listName, !active)}
                          >
                            <ListItemHeader>
                              <ListCardMain>
                                <ListCardTitleRow>
                                  <strong>{group.listName}</strong>
                                </ListCardTitleRow>
                                <ListMeta>{group.contacts.length} contato(s)</ListMeta>
                                <ListMeta>
                                  {active
                                    ? `${includedCount} contato(s) usados neste envio.`
                                    : 'Clique para usar esta lista no envio.'}
                                </ListMeta>
                              </ListCardMain>

                              <ListCardBadges>
                                <Badge>{group.contacts.length}</Badge>
                                {excludedCount > 0 ? <Badge>{excludedCount} removido(s)</Badge> : null}
                                {active ? <Badge>Selecionada</Badge> : null}
                                <GhostButton
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (!active) {
                                      handleToggleList(group.listName, true);
                                    }
                                    setPreviewListName(group.listName);
                                  }}
                                >
                                  Ver contatos
                                </GhostButton>
                              </ListCardBadges>
                            </ListItemHeader>
                            {active && excludedCount > 0 ? (
                              <InlineActions>
                                <GhostButton
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    clearExcludedFromList(group.listName);
                                  }}
                                >
                                  Restaurar lista
                                </GhostButton>
                              </InlineActions>
                            ) : null}
                          </ListItem>
                        );
                      })}
                    </ListsStrip>

                    <PaginationRow>
                      <GhostButton type="button" onClick={() => setListsPage((current) => Math.max(1, current - 1))}>
                        Anterior
                      </GhostButton>
                      <PaginationSummary>Pagina {listsPage} de {listsPageCount}</PaginationSummary>
                      <GhostButton
                        type="button"
                        onClick={() => setListsPage((current) => Math.min(listsPageCount, current + 1))}
                      >
                        Proxima
                      </GhostButton>
                    </PaginationRow>
                  </>
                )}
              </ListsSection>
            </UploadPanel>
          </ComposeCard>

          <ComposeCard>
            <ComposeHeader>
              <div>
                <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.18em' }}>
                  Grupos
                </p>
                <h3 style={{ margin: '6px 0 0' }}>Grupos do WhatsApp</h3>
              </div>
              <InlineActions>
                <GhostButton type="button" onClick={() => void handleRefreshWhatsAppGroups()}>
                  Atualizar grupos
                </GhostButton>
              </InlineActions>
            </ComposeHeader>

            <UploadPanel>
              <div>
                <SectionLabel>Grupos sincronizados</SectionLabel>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  Selecione aqui apenas os grupos que ja existem no WhatsApp. O envio usa sempre o ID `@g.us`.
                </p>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>
                  {selectedWhatsAppGroupIds.size
                    ? `${selectedWhatsAppGroupIds.size} grupo(s) selecionado(s) para esta campanha.`
                    : 'Nenhum grupo selecionado ainda.'}
                </p>
              </div>

              {whatsappGroups.length === 0 ? (
                <EmptyState>Conecte o WhatsApp e clique em Atualizar grupos para carregar os grupos disponiveis.</EmptyState>
              ) : (
                <ListsStrip>
                  {whatsappGroups.map((group) => {
                    const active = selectedWhatsAppGroupIds.has(group.whatsappGroupId);

                    return (
                      <ListItem
                        key={group.whatsappGroupId}
                        $active={active}
                        onClick={() => toggleWhatsAppGroupSelection(group.whatsappGroupId, !active)}
                      >
                        <ListItemHeader>
                          <ListCardMain>
                            <ListCardTitleRow>
                              <strong>{group.name}</strong>
                            </ListCardTitleRow>
                            <ListMeta>{group.whatsappGroupId}</ListMeta>
                            <ListMeta>
                              {active ? 'Grupo incluido nesta campanha.' : 'Clique para incluir este grupo no envio.'}
                            </ListMeta>
                          </ListCardMain>

                          <ListCardBadges>
                            {active ? <Badge>Selecionado</Badge> : null}
                          </ListCardBadges>
                        </ListItemHeader>
                      </ListItem>
                    );
                  })}
                </ListsStrip>
              )}

              <div>
                <SectionLabel>Cadastro de grupos</SectionLabel>
                <p style={{ margin: 0, color: 'var(--muted)' }}>Apenas grupos sincronizados aparecem aqui para selecao.</p>
              </div>
            </UploadPanel>
          </ComposeCard>

          <ComposeCard>
            <ComposeHeader>
              <div>
                <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.18em' }}>
                  Planilha
                </p>
                <h3 style={{ margin: '6px 0 0' }}>Envio por Planilha</h3>
              </div>
            </ComposeHeader>

            <UploadPanel>
              <div>
                <SectionLabel>Planilha avulsa</SectionLabel>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  Suba uma planilha `.xlsx`, `.xls` ou `.csv` e envie sem salvar esses contatos no banco.
                </p>
                  <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>
                    {spreadsheetRecipients.length > 0
                      ? `${spreadsheetRecipients.length} contato(s) temporario(s) pronto(s) para este envio.`
                      : 'Nenhuma planilha carregada ainda.'}
                  </p>
                  {selectedWhatsAppGroupIds.size > 0 ? (
                    <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>
                      {selectedWhatsAppGroupIds.size} grupo(s) tambem serao incluidos nesta campanha.
                    </p>
                  ) : null}
                </div>

              <SpreadsheetDropzone>
                <strong>{spreadsheetFileName || 'Selecionar planilha para envio temporario'}</strong>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                  Colunas aceitas: nome, telefone, paciente, profissional, data e hora.
                </span>
                <HiddenFileInput type="file" accept=".xlsx,.xls,.csv" onChange={handleSpreadsheetUpload} />
              </SpreadsheetDropzone>

              {spreadsheetRecipients.length > 0 ? (
                <SpreadsheetSummary>
                  <Badge>{spreadsheetRecipients.length} contato(s) da planilha</Badge>
                  {spreadsheetSkippedRows > 0 ? <Badge>{spreadsheetSkippedRows} linha(s) ignorada(s)</Badge> : null}
                  <GhostButton type="button" onClick={clearSpreadsheetRecipients}>
                    Remover planilha
                  </GhostButton>
                </SpreadsheetSummary>
              ) : null}

              {spreadsheetRecipients.length > 0 ? (
                <EmptyState>
                  Esses contatos entram apenas neste disparo e não ficam cadastrados em listas.
                </EmptyState>
              ) : null}
            </UploadPanel>
          </ComposeCard>

          <ComposeCard>
            <ComposeHeader>
              <div>
                <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.18em' }}>
                  Envio
                </p>
                <h3 style={{ margin: '6px 0 0' }}>Dados de envio</h3>
              </div>
            </ComposeHeader>

            <InputGroup>
              <span>Template</span>
              <select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
                <option value="">Sem template, usar mensagem manual</option>
                {usableTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.variants.filter((variant) => variant.active).length} variacao(oes))
                  </option>
                ))}
              </select>
            </InputGroup>

            {selectedTemplate ? (
              <UploadPanel>
                <div>
                  <SectionLabel>{selectedTemplate.name}</SectionLabel>
                  <p style={{ margin: 0, color: 'var(--muted)' }}>
                    Uma das {selectedTemplate.variants.filter((variant) => variant.active).length} variacao(oes) ativas sera sorteada para cada destinatario.
                  </p>
                </div>
              </UploadPanel>
            ) : null}

            <InputGroup>
              <span>Mensagem</span>
              <textarea
                ref={textareaRef}
                rows={10}
                placeholder={templateId ? 'Opcional quando um template esta selecionado.' : 'Use {nome}, {paciente}, {profissional}, {data}, {hora}.'}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onSelect={syncMessageSelection}
                onClick={syncMessageSelection}
                onKeyUp={syncMessageSelection}
              />
            </InputGroup>

            <PlaceholderRow>
              {placeholderTokens.map((token) => (
                <PlaceholderChip
                  key={token}
                  onMouseDown={(event) => event.preventDefault()}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => insertPlaceholder(token)}
                >
                  {token}
                </PlaceholderChip>
              ))}
            </PlaceholderRow>

            <UploadPanel>
              <div>
                <SectionLabel>Arquivos da campanha</SectionLabel>
                <p style={{ margin: 0, color: 'var(--muted)' }}>A legenda vai no primeiro anexo, inclusive em envios para grupos.</p>
              </div>

              <UploadDropzone>
                <strong>{files.length ? `${files.length} arquivo(s) selecionado(s)` : 'Selecionar arquivos da campanha'}</strong>
                <AttachmentHint>
                  Envie imagens, documentos, audios ou videos. Voce pode selecionar varios arquivos de uma vez.
                </AttachmentHint>
                <HiddenFileInput type="file" multiple onChange={handleFiles} />
              </UploadDropzone>

              <AttachmentPreview>
                {files.length ? (
                  <AttachmentList>
                    {files.map((file) => (
                      <AttachmentItem key={`${file.name}-${file.size}-${file.lastModified}`}>
                        <strong>{file.name}</strong>
                        <AttachmentMeta>{formatFileSize(file.size)}</AttachmentMeta>
                      </AttachmentItem>
                    ))}
                  </AttachmentList>
                ) : (
                  <AttachmentHint>Nenhum anexo selecionado.</AttachmentHint>
                )}
              </AttachmentPreview>
            </UploadPanel>
          </ComposeCard>
        </ComposeStack>

        <SubmitPanel>
          <ComposeHeader>
            <div>
              <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.18em' }}>
                Entrega
              </p>
              <h3 style={{ margin: '6px 0 0' }}>Quando enviar</h3>
            </div>
          </ComposeHeader>

          <FooterGrid>
            <InputGroup>
              <span>Agendar para</span>
              <input type="datetime-local" value={scheduleAt} onChange={(event) => setScheduleAt(event.target.value)} />
            </InputGroup>

            <InputGroup>
              <span>Ritmo do envio</span>
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                Automatico: 15-30 segundos entre mensagens e pausas aleatorias de 1-3 minutos a cada 5-15 destinatarios.
              </p>
            </InputGroup>
          </FooterGrid>

          <InlineActions>
            <GhostButton type="button" onClick={() => void handleSendNow()}>
              Enviar agora
            </GhostButton>
            <button type="submit">Adicionar na fila</button>
          </InlineActions>

          {status ? <StatusText>{status}</StatusText> : null}
        </SubmitPanel>
      </ComposeForm>

      <GuideModal open={guideOpen} onClose={() => setGuideOpen(false)} variant="compose" />

      {previewGroup ? (
        <ModalOverlay onClick={() => setPreviewListName('')}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <PanelHeading>
              <div>
                <h3 style={{ margin: 0 }}>{previewGroup.listName}</h3>
                <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
                  Remova contatos apenas deste envio. A lista original continua salva normalmente.
                </p>
              </div>
              <GhostButton type="button" onClick={() => setPreviewListName('')}>
                Fechar
              </GhostButton>
            </PanelHeading>

            <InlineActions>
              <Badge>{previewGroup.contacts.length} contato(s)</Badge>
              <Badge>
                {previewGroup.contacts.filter((contact) => !excludedContactIds.has(contact.id)).length} ativo(s) no envio
              </Badge>
              <Badge>
                {previewGroup.contacts.filter((contact) => excludedContactIds.has(contact.id)).length} removido(s)
              </Badge>
            </InlineActions>

            {previewGroup.contacts.length === 0 ? (
              <EmptyState>Essa lista ainda nao possui contatos.</EmptyState>
            ) : (
              <ContactsPreviewList>
                {previewGroup.contacts.map((contact) => {
                  const excluded = excludedContactIds.has(contact.id);
                  return (
                    <ContactPreviewCard key={contact.id} $excluded={excluded}>
                      <ContactPreviewHeader>
                        <div>
                          <strong>{contact.name}</strong>
                          <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>{contact.phone}</p>
                        </div>
                        <GhostButton type="button" onClick={() => toggleExcludedContact(contact.id)}>
                          {excluded ? 'Reincluir no envio' : 'Remover deste envio'}
                        </GhostButton>
                      </ContactPreviewHeader>

                      <ContactPreviewMeta>
                        <span><strong>Paciente:</strong> {contact.paciente || '-'}</span>
                        <span><strong>Profissional:</strong> {contact.profissional || '-'}</span>
                        <span><strong>Data:</strong> {contact.data || '-'}</span>
                        <span><strong>Hora:</strong> {contact.hora || '-'}</span>
                        <span><strong>Status:</strong> {excluded ? 'Removido deste envio' : 'Incluido neste envio'}</span>
                      </ContactPreviewMeta>
                    </ContactPreviewCard>
                  );
                })}
              </ContactsPreviewList>
            )}
          </ModalCard>
        </ModalOverlay>
      ) : null}
    </>
  );
}
