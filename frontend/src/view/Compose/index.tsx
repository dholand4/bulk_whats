import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { GuideModal } from '../../components/GuideModal';
import {
  Badge,
  EmptyState,
  GhostButton,
  InlineActions,
  InputGroup,
  PanelHeading,
  StatusText,
} from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import {
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
  HiddenCheckbox,
  ListItem,
  ListCardHeader,
  ListTitleButton,
  ListsStrip,
  ModalCard,
  ModalOverlay,
  PlaceholderChip,
  PlaceholderRow,
  SectionLabel,
  SubmitPanel,
  UploadPanel,
} from './styled';

const placeholderTokens = ['{nome}', '{paciente}', '{profissional}', '{data}', '{hora}'];

export function ComposeView() {
  const {
    devices,
    contacts,
    contactGroups,
    selectedContactListNames,
    toggleComposeList,
    selectAllComposeLists,
    clearComposeLists,
    submitCompose,
  } = useApp();
  const [guideOpen, setGuideOpen] = useState(false);
  const [previewListName, setPreviewListName] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [deviceId, setDeviceId] = useState(devices[0]?.id || '');
  const [message, setMessage] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [delaySeconds, setDelaySeconds] = useState('3');
  const [files, setFiles] = useState<File[]>([]);
  const [excludedContactIds, setExcludedContactIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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

  const selectedGroups = useMemo(
    () => contactGroups.filter((group) => selectedContactListNames.has(group.listName)),
    [contactGroups, selectedContactListNames],
  );

  const recipients = useMemo(
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

  const previewGroup = useMemo(
    () => contactGroups.find((group) => group.listName === previewListName) || null,
    [contactGroups, previewListName],
  );

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files || []));
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

  function insertPlaceholder(token: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMessage((current) => `${current}${token}`);
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const nextValue = `${message.slice(0, start)}${token}${message.slice(end)}`;
    setMessage(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + token.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!deviceId || recipients.length === 0 || (!message.trim() && files.length === 0)) {
      setStatus('Selecione o dispositivo, ao menos uma lista e informe a mensagem ou anexo.');
      return;
    }

    try {
      setStatus('Enviando anexos e criando itens...');
      const responseMessage = await submitCompose({
        endpoint: '/api/queue',
        deviceId,
        campaignName: campaignName.trim(),
        message: message.trim(),
        scheduleAt: scheduleAt || null,
        delaySeconds,
        recipients,
        files,
      });
      setStatus(responseMessage);
      setCampaignName('');
      setMessage('');
      setScheduleAt('');
      setDelaySeconds('3');
      setFiles([]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao criar campanha.');
    }
  }

  async function handleSendNow() {
    if (!deviceId || recipients.length === 0 || (!message.trim() && files.length === 0)) {
      setStatus('Selecione o dispositivo, ao menos uma lista e informe a mensagem ou anexo.');
      return;
    }

    try {
      setStatus('Enviando anexos e criando itens...');
      const responseMessage = await submitCompose({
        endpoint: '/api/messages/send',
        deviceId,
        campaignName: campaignName.trim(),
        message: message.trim(),
        scheduleAt: scheduleAt || null,
        delaySeconds,
        recipients,
        files,
      });
      setStatus(responseMessage);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao enviar campanha.');
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
          <p style={{ margin: 0, color: 'var(--muted)' }}>Monte a campanha e defina como as mensagens serao enviadas.</p>
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
                  <option value="">Dispositivo da matricula indisponivel</option>
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
                <GhostButton type="button" onClick={handleClearComposeLists}>
                  Limpar selecao
                </GhostButton>
              </InlineActions>
            </ComposeHeader>

            <UploadPanel>
              <div>
                <SectionLabel>Listas disponiveis</SectionLabel>
                <p style={{ margin: 0, color: 'var(--muted)' }}>
                  {selectedContactListNames.size
                    ? `${selectedContactListNames.size} lista(s) selecionada(s).`
                    : 'Nenhuma lista selecionada.'}
                </p>
                {selectedContactListNames.size ? (
                  <p style={{ margin: 0, color: 'var(--muted)' }}>
                    {recipients.length} contato(s) seguirao para este envio apos os ajustes.
                  </p>
                ) : null}
              </div>

              {contactGroups.length === 0 ? (
                <EmptyState>Cadastre listas e contatos na aba Contatos para montar campanhas.</EmptyState>
              ) : (
                <ListsStrip>
                  {contactGroups.map((group) => {
                    const active = selectedContactListNames.has(group.listName);
                    const excludedCount = group.contacts.filter((contact) => excludedContactIds.has(contact.id)).length;
                    const includedCount = group.contacts.length - excludedCount;
                    return (
                      <ListItem key={group.listName} $active={active}>
                        <HiddenCheckbox
                          type="checkbox"
                          checked={active}
                          onChange={(event) => handleToggleList(group.listName, event.target.checked)}
                        />
                        <ListCardHeader>
                          <div>
                            <ListTitleButton
                              type="button"
                              onClick={() => {
                                if (!active) {
                                  handleToggleList(group.listName, true);
                                }
                                setPreviewListName(group.listName);
                              }}
                            >
                              <strong>{group.listName}</strong>
                            </ListTitleButton>
                            <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
                              {group.contacts.length} contato(s)
                            </p>
                          </div>
                          {excludedCount > 0 ? <Badge>{excludedCount} removido(s)</Badge> : null}
                        </ListCardHeader>

                        <p style={{ margin: 0, color: 'var(--muted)' }}>
                          {active
                            ? `${includedCount} contato(s) serao usados neste envio.`
                            : 'Selecione para usar esta lista no envio.'}
                        </p>

                        <InlineActions>
                          <GhostButton
                            type="button"
                            onClick={() => handleToggleList(group.listName, !active)}
                          >
                            {active ? 'Desmarcar lista' : 'Selecionar lista'}
                          </GhostButton>
                          <GhostButton
                            type="button"
                            onClick={() => {
                              if (!active) {
                                handleToggleList(group.listName, true);
                              }
                              setPreviewListName(group.listName);
                            }}
                          >
                            Ver contatos
                          </GhostButton>
                          {active && excludedCount > 0 ? (
                            <GhostButton type="button" onClick={() => clearExcludedFromList(group.listName)}>
                              Restaurar lista
                            </GhostButton>
                          ) : null}
                        </InlineActions>
                      </ListItem>
                    );
                  })}
                </ListsStrip>
              )}
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
              <span>Mensagem</span>
              <textarea
                ref={textareaRef}
                rows={10}
                placeholder="Use {nome}, {paciente}, {profissional}, {data}, {hora}."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </InputGroup>

            <PlaceholderRow>
              {placeholderTokens.map((token) => (
                <PlaceholderChip key={token} onClick={() => insertPlaceholder(token)}>
                  {token}
                </PlaceholderChip>
              ))}
            </PlaceholderRow>

            <UploadPanel>
              <div>
                <SectionLabel>Arquivos da campanha</SectionLabel>
                <p style={{ margin: 0, color: 'var(--muted)' }}>A legenda vai no primeiro anexo.</p>
              </div>
              <input type="file" multiple onChange={handleFiles} />
              <AttachmentPreview>
                {files.length ? files.map((file) => file.name).join(', ') : 'Nenhum anexo selecionado.'}
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
              <span>Intervalo entre mensagens</span>
              <select value={delaySeconds} onChange={(event) => setDelaySeconds(event.target.value)}>
                {['3', '4', '5', '6', '7', '8', '9', '10'].map((value) => (
                  <option key={value} value={value}>
                    {value} segundos
                  </option>
                ))}
              </select>
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

      <GuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />

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
