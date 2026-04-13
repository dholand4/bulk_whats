import {
  Badge,
  DangerButton,
  EmptyState,
  GhostButton,
  MiniButton,
} from '../../components/AppShell/styled';
import { Contact } from '../../types';
import {
  BulkSelectLabel,
  CompactContactCard,
  CompactContactMain,
  CompactContactMeta,
  CompactContactNameRow,
  CompactContactPhone,
  CompactContactRow,
  CompactPageInfo,
  CompactPagination,
  ContactActions,
  ContactMetaChip,
  ContactDangerButton,
  ListButton,
  ListCardBadges,
  ListCardMain,
  ListCardMeta,
  ListCardTitleRow,
  ListsActions,
  ListsHeaderBar,
  ListsHeaderInfo,
  ListsHeaderMeta,
  ListsHeaderTitle,
  ListsOverview,
  ListsSearch,
  ListsSection,
  ListsSelectionBar,
  ListsSelectionSummary,
  ListsToolbarBar,
  ContactsHeaderBar,
  ContactsHeaderInfo,
  ContactsHeaderMeta,
  ContactsHeaderTitle,
  ContactsListHeader,
  ContactsListShell,
  ContactsToolbarBar,
  SelectionBar,
  SelectionIndicator,
  SelectionSummary,
  ToolbarSearch,
} from './styled';
import { ContactGroup } from '../../types';

interface ContactsHeaderProps {
  listName: string;
  totalContacts: number;
  onCreateContact: () => void;
  onImportContacts: () => void;
}

interface ContactsToolbarProps {
  searchTerm: string;
  allVisibleSelected: boolean;
  visibleCount: number;
  onSearchChange: (value: string) => void;
  onToggleSelectAll: (checked: boolean) => void;
}

interface ContactsSelectionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkEdit: () => void;
  onDeleteSelected: () => void;
}

interface ContactsListProps {
  contacts: Contact[];
  selectedContactIds: Set<string>;
  onToggleContact: (contactId: string) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contact: Contact) => void;
}

interface ContactsPaginationProps {
  page: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
}

interface ContactListsSectionProps {
  groups: ContactGroup[];
  selectedListNames: Set<string>;
  activeContactListName: string;
  searchTerm: string;
  page: number;
  pageCount: number;
  onSearchChange: (value: string) => void;
  onToggleList: (listName: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

function buildContactMeta(contact: Contact) {
  return [
    contact.paciente ? `Paciente: ${contact.paciente}` : null,
    contact.profissional ? `Profissional: ${contact.profissional}` : null,
    contact.data ? `Data: ${contact.data}` : null,
    contact.hora ? `Hora: ${contact.hora}` : null,
    contact.notes ? `Obs: ${contact.notes}` : null,
  ].filter(Boolean) as string[];
}

export function ContactsHeader({
  listName,
  totalContacts,
  onCreateContact,
  onImportContacts,
}: ContactsHeaderProps) {
  return (
    <ContactsHeaderBar>
      <ContactsHeaderInfo>
        <ContactsHeaderTitle>{listName}</ContactsHeaderTitle>
        <ContactsHeaderMeta>{totalContacts} contato(s) cadastrados nesta lista.</ContactsHeaderMeta>
      </ContactsHeaderInfo>

      <ContactActions>
        <GhostButton type="button" onClick={onImportContacts}>
          Importar contatos
        </GhostButton>
        <button type="button" onClick={onCreateContact}>
          Novo contato
        </button>
      </ContactActions>
    </ContactsHeaderBar>
  );
}

export function ContactsToolbar({
  searchTerm,
  allVisibleSelected,
  visibleCount,
  onSearchChange,
  onToggleSelectAll,
}: ContactsToolbarProps) {
  return (
    <ContactsToolbarBar>
      <BulkSelectLabel>
        <input
          type="checkbox"
          checked={allVisibleSelected}
          onChange={(event) => onToggleSelectAll(event.target.checked)}
        />
        Selecionar todos visiveis ({visibleCount})
      </BulkSelectLabel>

      <ToolbarSearch>
        <span>Buscar contato</span>
        <input
          type="text"
          placeholder="Pesquisar por nome, numero, paciente, profissional ou observacao"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </ToolbarSearch>
    </ContactsToolbarBar>
  );
}

export function ContactsSelectionBar({
  selectedCount,
  onClearSelection,
  onBulkEdit,
  onDeleteSelected,
}: ContactsSelectionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <SelectionBar>
      <SelectionSummary>{selectedCount} selecionado(s)</SelectionSummary>

      <ContactActions>
        <GhostButton type="button" onClick={onClearSelection}>
          Limpar selecao
        </GhostButton>
        <GhostButton type="button" onClick={onBulkEdit}>
          Editar
        </GhostButton>
        <DangerButton type="button" onClick={onDeleteSelected}>
          Excluir
        </DangerButton>
      </ContactActions>
    </SelectionBar>
  );
}

function ContactItemCard({
  contact,
  selected,
  onToggleContact,
  onEditContact,
  onDeleteContact,
}: {
  contact: Contact;
  selected: boolean;
  onToggleContact: (contactId: string) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contact: Contact) => void;
}) {
  const metaItems = buildContactMeta(contact);

  return (
    <CompactContactCard $selected={selected} onClick={() => onToggleContact(contact.id)}>
      <CompactContactRow>
        <CompactContactMain>
          <CompactContactNameRow>
            <SelectionIndicator $selected={selected} />
            <strong>{contact.name}</strong>
          </CompactContactNameRow>
          <CompactContactPhone>{contact.phone}</CompactContactPhone>
        </CompactContactMain>

        <ContactActions>
          <MiniButton
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEditContact(contact);
            }}
          >
            Editar
          </MiniButton>
          <ContactDangerButton
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDeleteContact(contact);
            }}
          >
            Excluir
          </ContactDangerButton>
        </ContactActions>
      </CompactContactRow>

      {metaItems.length > 0 ? (
        <CompactContactMeta>
          {metaItems.map((item) => (
            <ContactMetaChip key={item}>{item}</ContactMetaChip>
          ))}
        </CompactContactMeta>
      ) : null}
    </CompactContactCard>
  );
}

export function ContactsList({
  contacts,
  selectedContactIds,
  onToggleContact,
  onEditContact,
  onDeleteContact,
}: ContactsListProps) {
  if (contacts.length === 0) {
    return <EmptyState>Nenhum contato encontrado com os filtros atuais.</EmptyState>;
  }

  return (
    <ContactsListShell>
      <ContactsListHeader>
        <span>Clique em um item para selecionar.</span>
        <span>Acoes rapidas ficam no canto direito de cada contato.</span>
      </ContactsListHeader>

      {contacts.map((contact) => (
        <ContactItemCard
          key={contact.id}
          contact={contact}
          selected={selectedContactIds.has(contact.id)}
          onToggleContact={onToggleContact}
          onEditContact={onEditContact}
          onDeleteContact={onDeleteContact}
        />
      ))}
    </ContactsListShell>
  );
}

export function ContactsPagination({
  page,
  pageCount,
  onPrev,
  onNext,
}: ContactsPaginationProps) {
  return (
    <CompactPagination>
      <GhostButton type="button" onClick={onPrev}>
        Anterior
      </GhostButton>
      <CompactPageInfo>Pagina {page} de {pageCount}</CompactPageInfo>
      <GhostButton type="button" onClick={onNext}>
        Proxima
      </GhostButton>
    </CompactPagination>
  );
}

export function ContactListsSection({
  groups,
  selectedListNames,
  activeContactListName,
  searchTerm,
  page,
  pageCount,
  onSearchChange,
  onToggleList,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onPrevPage,
  onNextPage,
}: ContactListsSectionProps) {
  return (
    <ListsSection>
      <ListsHeaderBar>
        <ListsHeaderInfo>
          <ListsHeaderTitle>Suas listas</ListsHeaderTitle>
          <ListsHeaderMeta>{groups.length} lista(s) nesta pagina.</ListsHeaderMeta>
        </ListsHeaderInfo>
      </ListsHeaderBar>

      <ListsToolbarBar>
        <ListsSearch>
          <span>Buscar lista</span>
          <input
            type="text"
            placeholder="Pesquisar pelo nome da lista"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </ListsSearch>

        <ListsActions>
          <GhostButton type="button" onClick={onSelectAll}>
            Selecionar todas
          </GhostButton>
        </ListsActions>
      </ListsToolbarBar>

      {selectedListNames.size > 0 ? (
        <ListsSelectionBar>
          <ListsSelectionSummary>{selectedListNames.size} lista(s) selecionada(s)</ListsSelectionSummary>
          <ListsActions>
            <GhostButton type="button" onClick={onClearSelection}>
              Limpar selecao
            </GhostButton>
            <DangerButton type="button" onClick={onDeleteSelected}>
              Apagar selecionadas
            </DangerButton>
          </ListsActions>
        </ListsSelectionBar>
      ) : null}

      {groups.length === 0 ? (
        <EmptyState>Nenhuma lista encontrada para essa busca.</EmptyState>
      ) : (
        <>
          <ListsOverview>
            {groups.map((group) => {
              const isSelected = selectedListNames.has(group.listName);
              const isActive = group.listName === activeContactListName || isSelected;

              return (
                <ListButton
                  key={group.listName}
                  type="button"
                  $active={isActive}
                  onClick={() => onToggleList(group.listName)}
                >
                  <ListCardMain>
                    <ListCardTitleRow>
                      <strong>{group.listName}</strong>
                    </ListCardTitleRow>
                    <ListCardMeta>{group.contacts.length} contato(s)</ListCardMeta>
                  </ListCardMain>

                  <ListCardBadges>
                    <Badge>{group.contacts.length}</Badge>
                    {isSelected ? <Badge>Selecionada</Badge> : null}
                  </ListCardBadges>
                </ListButton>
              );
            })}
          </ListsOverview>

          <ContactsPagination
            page={page}
            pageCount={pageCount}
            onPrev={onPrevPage}
            onNext={onNextPage}
          />
        </>
      )}
    </ListsSection>
  );
}
