import { FormEvent, useEffect, useMemo, useState } from 'react';
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

      setStatus('Alteracoes salvas com sucesso.');
      closeModal();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao salvar alteracoes.');
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
          <span>Descricao</span>
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
          <span>Mensagem da variacao</span>
          <textarea
            rows={8}
            placeholder="Use {nome}, {paciente}, {profissional}, {data}, {hora}."
            value={variantDraft.body}
            onChange={(event) => setVariantDraft((current) => ({ ...current, body: event.target.value }))}
            required
          />
        </InputGroup>
        <BadgeRow>
          {placeholderTokens.map((token) => (
            <MiniButton
              type="button"
              key={token}
              onClick={() => setVariantDraft((current) => ({ ...current, body: `${current.body}${token}` }))}
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
          Variacao ativa
        </ActiveLabel>
        <InlineActions>
          <button type="submit">Salvar variacao</button>
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
              Templates
            </p>
            <h2 style={{ margin: '8px 0 4px' }}>Templates de mensagens</h2>
            <p style={{ margin: 0, color: 'var(--muted)' }}>
              Crie templates e cadastre variacoes para sortear mensagens em cada campanha.
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
                  placeholder="Pesquisar por nome ou descricao"
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
                          <CardMeta>{template.description || 'Sem descricao'}</CardMeta>
                        </CardMain>
                      </CardHeader>
                      <BadgeRow>
                        <Badge>{template.variants.length} variacao(oes)</Badge>
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
                    {activeTemplate.description || 'Sem descricao cadastrada.'}
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
                      description: `Tem certeza que deseja apagar "${activeTemplate.name}" e todas as variacoes dele?`,
                      confirmLabel: 'Apagar template',
                      action: 'delete-template',
                      templateId: activeTemplate.id,
                    })}
                  >
                    Excluir
                  </DangerButton>
                  <button type="button" onClick={openCreateVariant}>
                    Nova variacao
                  </button>
                </VariantActions>
              </DetailHeader>

              <BadgeRow>
                <Badge>{activeTemplate.active ? 'Template ativo' : 'Template inativo'}</Badge>
                <Badge>{activeTemplate.variants.length} variacao(oes)</Badge>
                <Badge>{activeTemplate.variants.filter((variant) => variant.active).length} ativa(s)</Badge>
              </BadgeRow>

              {activeTemplate.variants.length === 0 ? (
                <EmptyState>Esse template ainda nao possui variacoes.</EmptyState>
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
                            title: 'Apagar variacao',
                            description: 'Tem certeza que deseja apagar esta variacao?',
                            confirmLabel: 'Apagar variacao',
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
                      ? 'Editar variacao'
                      : 'Nova variacao'}
                </h3>
                <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
                  {modalMode.includes('variant')
                    ? 'Cada campanha sorteara uma variacao ativa para cada destinatario.'
                    : 'Apenas voce vera e usara este template.'}
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
