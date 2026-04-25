import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmModal } from '../../components/ConfirmModal';
import {
  Badge,
  DangerButton,
  EmptyState,
  GhostButton,
  IconButton,
  InlineActions,
  InputGroup,
  MiniButton,
  Panel,
  Stack,
  StatusText,
} from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { MessageTemplate, MessageTemplateVariant } from '../../types';
import {
  ActiveLabel,
  BadgeRow,
  CardHeader,
  CardMain,
  CardMeta,
  CreateTemplateForm,
  DetailHeader,
  DetailSection,
  HeroHeader,
  HeroPanel,
  ModalCard,
  ModalHeader,
  ModalOverlay,
  SearchField,
  TemplateCard,
  TemplateList,
  TemplatesLayout,
  TemplatesSection,
  ToolbarBar,
  VariantActions,
  VariantBody,
  VariantCard,
  VariantList,
} from './styled';

const placeholderTokens = ['{nome}', '{paciente}', '{profissional}', '{data}', '{hora}'];

const emptyTemplateDraft = {
  name: '',
  description: '',
  active: true,
};

const emptyVariantDraft = {
  body: '',
  active: true,
};

type TemplateModalMode = 'create-template' | 'edit-template' | 'create-variant' | 'edit-variant';

interface ConfirmState {
  title: string;
  description: string;
  confirmLabel: string;
  action: 'delete-template' | 'delete-variant';
  templateId: string;
  variantId?: string;
}

export function TemplatesView() {
  const {
    templates,
    saveTemplate,
    deleteTemplate,
    saveTemplateVariant,
    deleteTemplateVariant,
  } = useApp();

  const [createOpen, setCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTemplateId, setActiveTemplateId] = useState('');
  const [modalMode, setModalMode] = useState<TemplateModalMode>('create-template');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [templateDraft, setTemplateDraft] = useState(emptyTemplateDraft);
  const [variantDraft, setVariantDraft] = useState(emptyVariantDraft);
  const [status, setStatus] = useState('');
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const variantTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const variantSelectionRef = useRef({ start: 0, end: 0 });

  const filteredTemplates = useMemo(() => {
    const normalized = searchTerm.trim().toLocaleLowerCase('pt-BR');
    if (!normalized) {
      return templates;
    }

    return templates.filter((template) =>
      [template.name, template.description]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(normalized),
    );
  }, [searchTerm, templates]);

  const activeTemplate = useMemo(
    () => templates.find((template) => template.id === activeTemplateId) || null,
    [activeTemplateId, templates],
  );

  useEffect(() => {
    if (activeTemplateId && !templates.some((template) => template.id === activeTemplateId)) {
      setActiveTemplateId(templates[0]?.id || '');
    }
  }, [activeTemplateId, templates]);

  function openCreateTemplate() {
    setTemplateDraft(emptyTemplateDraft);
    setStatus('');
    setCreateOpen(true);
  }

  function openEditTemplate(template: MessageTemplate) {
    setTemplateDraft({
      name: template.name || '',
      description: template.description || '',
      active: template.active,
    });
    setModalMode('edit-template');
    setModalOpen(true);
    setStatus('');
  }

  function openCreateVariant() {
    if (!activeTemplate) {
      return;
    }

    setVariantDraft(emptyVariantDraft);
    setEditingVariantId(null);
    setModalMode('create-variant');
    setModalOpen(true);
    setStatus('');
  }

  function openEditVariant(variant: MessageTemplateVariant) {
    setVariantDraft({
      body: variant.body || '',
      active: variant.active,
    });
    setEditingVariantId(variant.id);
    setModalMode('edit-variant');
    setModalOpen(true);
    setStatus('');
  }

  function closeModal() {
    setModalOpen(false);
    setEditingVariantId(null);
    setTemplateDraft(emptyTemplateDraft);
    setVariantDraft(emptyVariantDraft);
  }

  async function handleCreateTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await saveTemplate(templateDraft);
      setCreateOpen(false);
      setTemplateDraft(emptyTemplateDraft);
      setStatus('Template salvo com sucesso.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao salvar template.');
    }
  }

  async function handleModalSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (modalMode === 'edit-template' && activeTemplate) {
        await saveTemplate(templateDraft, activeTemplate.id);
      }

      if (modalMode === 'create-variant' && activeTemplate) {
        await saveTemplateVariant(activeTemplate.id, variantDraft);
      }

      if (modalMode === 'edit-variant' && activeTemplate && editingVariantId) {
        await saveTemplateVariant(activeTemplate.id, variantDraft, editingVariantId);
      }

      setStatus('Alterações salvas com sucesso.');
      closeModal();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao salvar alterações.');
    }
  }

  async function handleConfirmAction() {
    if (!confirmState) {
      return;
    }

    setConfirmBusy(true);

    try {
      if (confirmState.action === 'delete-template') {
        await deleteTemplate(confirmState.templateId);
      }

      if (confirmState.action === 'delete-variant' && confirmState.variantId) {
        await deleteTemplateVariant(confirmState.templateId, confirmState.variantId);
      }

      setConfirmState(null);
    } finally {
      setConfirmBusy(false);
    }
  }

  function syncVariantSelection() {
    const textarea = variantTextareaRef.current;
    if (!textarea) {
      return;
    }

    variantSelectionRef.current = {
      start: textarea.selectionStart || 0,
      end: textarea.selectionEnd || 0,
    };
  }

  function insertVariantPlaceholder(token: string) {
    const textarea = variantTextareaRef.current;
    if (!textarea) {
      setVariantDraft((current) => ({ ...current, body: `${current.body}${token}` }));
      return;
    }

    const isTextareaFocused = document.activeElement === textarea;
    const start = isTextareaFocused ? (textarea.selectionStart || 0) : variantSelectionRef.current.start;
    const end = isTextareaFocused ? (textarea.selectionEnd || 0) : variantSelectionRef.current.end;

    setVariantDraft((current) => {
      const currentBody = current.body || '';
      return {
        ...current,
        body: `${currentBody.slice(0, start)}${token}${currentBody.slice(end)}`,
      };
    });

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + token.length;
      textarea.setSelectionRange(cursor, cursor);
      variantSelectionRef.current = { start: cursor, end: cursor };
    });
  }

  function renderTemplateForm(submitLabel: string) {
    return (
      <Stack>
        <InputGroup>
          <span>Nome do template</span>
          <input
            type="text"
            maxLength={80}
            placeholder="Ex.: Confirmacao de consulta"
            value={templateDraft.name}
            onChange={(event) => setTemplateDraft((current) => ({ ...current, name: event.target.value }))}
            required
          />
        </InputGroup>
        <InputGroup>
            <span>Descrição</span>
          <textarea
            rows={3}
            placeholder="Opcional"
            value={templateDraft.description}
            onChange={(event) => setTemplateDraft((current) => ({ ...current, description: event.target.value }))}
          />
        </InputGroup>
        <ActiveLabel>
          <input
            type="checkbox"
            checked={templateDraft.active}
            onChange={(event) => setTemplateDraft((current) => ({ ...current, active: event.target.checked }))}
          />
          Template ativo
        </ActiveLabel>
        <InlineActions>
          <button type="submit">{submitLabel}</button>
          <GhostButton type="button" onClick={() => {
            setCreateOpen(false);
            closeModal();
          }}>
            Cancelar
          </GhostButton>
        </InlineActions>
      </Stack>
    );
  }

  function renderVariantForm() {
    return (
      <Stack>
        <InputGroup>
            <span>Mensagem da variação</span>
          <textarea
            ref={variantTextareaRef}
            rows={8}
            placeholder="Use {nome}, {paciente}, {profissional}, {data}, {hora}."
            value={variantDraft.body}
            onChange={(event) => setVariantDraft((current) => ({ ...current, body: event.target.value }))}
            onSelect={syncVariantSelection}
            onClick={syncVariantSelection}
            onKeyUp={syncVariantSelection}
            required
          />
        </InputGroup>
        <BadgeRow>
          {placeholderTokens.map((token) => (
            <MiniButton
              type="button"
              key={token}
              onMouseDown={(event) => event.preventDefault()}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => insertVariantPlaceholder(token)}
            >
              {token}
            </MiniButton>
          ))}
        </BadgeRow>
        <ActiveLabel>
          <input
            type="checkbox"
            checked={variantDraft.active}
            onChange={(event) => setVariantDraft((current) => ({ ...current, active: event.target.checked }))}
          />
              Variação ativa
        </ActiveLabel>
        <InlineActions>
          <button type="submit">Salvar variação</button>
          <GhostButton type="button" onClick={closeModal}>
            Cancelar
          </GhostButton>
        </InlineActions>
      </Stack>
    );
  }

  return (
    <>
      <HeroPanel>
        <HeroHeader>
          <div>
            <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.18em' }}>
        Modelos
            </p>
          <h2 style={{ margin: '8px 0 4px' }}>Modelos de mensagens</h2>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
            Crie modelos e cadastre variações para sortear mensagens em cada campanha.
            </p>
          </div>
          <IconButton type="button" onClick={() => (createOpen ? setCreateOpen(false) : openCreateTemplate())}>
            {createOpen ? 'x' : '+'}
          </IconButton>
        </HeroHeader>

        {createOpen ? (
          <CreateTemplateForm onSubmit={handleCreateTemplate}>
            {renderTemplateForm('Criar template')}
          </CreateTemplateForm>
        ) : null}

        {status ? <StatusText>{status}</StatusText> : null}
      </HeroPanel>

      <TemplatesLayout>
        <Panel>
          <TemplatesSection>
            <ToolbarBar>
              <SearchField>
                <span>Buscar template</span>
                <input
                  type="text"
              placeholder="Pesquisar por nome ou descrição"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </SearchField>
            </ToolbarBar>

            {filteredTemplates.length === 0 ? (
              <EmptyState>Nenhum template encontrado. Use o botao + para comecar.</EmptyState>
            ) : (
              <TemplateList>
                {filteredTemplates.map((template) => {
                  const activeVariants = template.variants.filter((variant) => variant.active).length;
                  const selected = template.id === activeTemplateId;

                  return (
                    <TemplateCard
                      key={template.id}
                      type="button"
                      $active={selected}
                      onClick={() => setActiveTemplateId(template.id)}
                    >
                      <CardHeader>
                        <CardMain>
                          <strong>{template.name}</strong>
                    <CardMeta>{template.description || 'Sem descrição'}</CardMeta>
                        </CardMain>
                      </CardHeader>
                      <BadgeRow>
                      <Badge>{template.variants.length} variação(ões)</Badge>
                        <Badge>{activeVariants} ativa(s)</Badge>
                        <Badge>{template.active ? 'Ativo' : 'Inativo'}</Badge>
                      </BadgeRow>
                    </TemplateCard>
                  );
                })}
              </TemplateList>
            )}
          </TemplatesSection>
        </Panel>

        <Panel>
          {!activeTemplate ? (
            <EmptyState>Selecione um template para criar e editar as variacoes.</EmptyState>
          ) : (
            <DetailSection>
              <DetailHeader>
                <div>
                  <h3 style={{ margin: 0 }}>{activeTemplate.name}</h3>
                  <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
                  {activeTemplate.description || 'Sem descrição cadastrada.'}
                  </p>
                </div>
                <VariantActions>
                  <GhostButton type="button" onClick={() => openEditTemplate(activeTemplate)}>
                    Editar template
                  </GhostButton>
                  <DangerButton
                    type="button"
                    onClick={() => setConfirmState({
                      title: 'Apagar template',
                      description: `Tem certeza que deseja apagar "${activeTemplate.name}" e todas as variações dele?`,
                      confirmLabel: 'Apagar template',
                      action: 'delete-template',
                      templateId: activeTemplate.id,
                    })}
                  >
                    Excluir
                  </DangerButton>
                  <button type="button" onClick={openCreateVariant}>
                  Nova variação
                  </button>
                </VariantActions>
              </DetailHeader>

              <BadgeRow>
                <Badge>{activeTemplate.active ? 'Template ativo' : 'Template inativo'}</Badge>
                <Badge>{activeTemplate.variants.length} variação(ões)</Badge>
                <Badge>{activeTemplate.variants.filter((variant) => variant.active).length} ativa(s)</Badge>
              </BadgeRow>

              {activeTemplate.variants.length === 0 ? (
                <EmptyState>Esse modelo ainda não possui variações.</EmptyState>
              ) : (
                <VariantList>
                  {activeTemplate.variants.map((variant) => (
                    <VariantCard key={variant.id}>
                      <VariantBody>{variant.body}</VariantBody>
                      <BadgeRow>
                        <Badge>{variant.active ? 'Ativa' : 'Inativa'}</Badge>
                      </BadgeRow>
                      <VariantActions>
                        <MiniButton type="button" onClick={() => openEditVariant(variant)}>
                          Editar
                        </MiniButton>
                        <DangerButton
                          type="button"
                          onClick={() => setConfirmState({
                        title: 'Apagar variação',
                        description: 'Tem certeza que deseja apagar esta variação?',
                        confirmLabel: 'Apagar variação',
                            action: 'delete-variant',
                            templateId: activeTemplate.id,
                            variantId: variant.id,
                          })}
                        >
                          Excluir
                        </DangerButton>
                      </VariantActions>
                    </VariantCard>
                  ))}
                </VariantList>
              )}
            </DetailSection>
          )}
        </Panel>
      </TemplatesLayout>

      {modalOpen ? (
        <ModalOverlay onClick={closeModal}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <div>
                <h3 style={{ margin: 0 }}>
                  {modalMode === 'edit-template'
                    ? 'Editar template'
                    : modalMode === 'edit-variant'
                    ? 'Editar variação'
                    : 'Nova variação'}
                </h3>
                <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
                  {modalMode.includes('variant')
                  ? 'Cada campanha sorteará uma variação ativa para cada destinatário.'
                  : 'Apenas você verá e usará este modelo.'}
                </p>
              </div>
              <GhostButton type="button" onClick={closeModal}>
                Fechar
              </GhostButton>
            </ModalHeader>

            <form onSubmit={handleModalSubmit}>
              {modalMode === 'edit-template'
                ? renderTemplateForm('Salvar template')
                : renderVariantForm()}
            </form>
          </ModalCard>
        </ModalOverlay>
      ) : null}

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
