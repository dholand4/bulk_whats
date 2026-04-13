import styled from 'styled-components';
import { ContactListStrip, Panel } from '../../components/AppShell/styled';

export const HeroPanel = styled(Panel)`
  display: grid;
  gap: 18px;
`;

export const HeroHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
`;

export const CreateListForm = styled.form`
  display: grid;
  gap: 14px;
`;

export const ListsOverview = styled(ContactListStrip)`
  max-height: 540px;
  overflow-y: auto;
  padding-right: 6px;
  gap: 10px;
`;

export const ListButton = styled.button<{ $active: boolean }>`
  text-align: left;
  background: ${({ $active }) => ($active ? 'rgba(18, 53, 36, 0.08)' : 'rgba(255, 255, 255, 0.48)')};
  color: var(--text);
  border: 1px solid ${({ $active }) => ($active ? 'rgba(18, 53, 36, 0.32)' : 'var(--border)')};
  box-shadow: none;
  border-radius: 18px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

export const SelectedBanner = styled.div`
  display: grid;
  gap: 10px;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.48);
`;

export const ContactsGrid = styled.div`
  display: grid;
  gap: 10px;
`;

export const ContactCard = styled.article<{ $selected: boolean }>`
  border: 1px solid ${({ $selected }) => ($selected ? 'rgba(18, 53, 36, 0.32)' : 'var(--border)')};
  background: ${({ $selected }) => ($selected ? 'rgba(18, 53, 36, 0.08)' : 'rgba(255, 255, 255, 0.48)')};
  border-radius: 18px;
  padding: 16px;
  display: grid;
  gap: 12px;
  cursor: pointer;
`;

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
`;

export const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: var(--muted);
  font-size: 13px;
`;

export const SearchField = styled.label`
  display: grid;
  gap: 6px;
`;

export const ListsSection = styled.div`
  display: grid;
  gap: 16px;
`;

export const ListsHeaderBar = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 860px) {
    flex-direction: column;
  }
`;

export const ListsHeaderInfo = styled.div`
  display: grid;
  gap: 4px;
`;

export const ListsHeaderTitle = styled.h3`
  margin: 0;
  font-size: 24px;
`;

export const ListsHeaderMeta = styled.p`
  margin: 0;
  color: var(--muted);
`;

export const ListsToolbarBar = styled.div`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 860px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const ListsSearch = styled.label`
  display: grid;
  gap: 6px;
  flex: 1;
  min-width: 0;

  @media (max-width: 860px) {
    width: 100%;
  }
`;

export const ListsActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;

  @media (max-width: 860px) {
    width: 100%;
  }
`;

export const ListsSelectionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(18, 53, 36, 0.18);
  background: rgba(18, 53, 36, 0.06);

  @media (max-width: 860px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const ListsSelectionSummary = styled.strong`
  font-size: 14px;
`;

export const ListCardMain = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;
`;

export const ListCardTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

export const ListCardMeta = styled.p`
  margin: 0;
  color: var(--muted);
  font-size: 13px;
`;

export const ListCardBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

export const ContactsSection = styled.div`
  display: grid;
  gap: 16px;
`;

export const ContactsHeaderBar = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 860px) {
    flex-direction: column;
  }
`;

export const ContactsHeaderInfo = styled.div`
  display: grid;
  gap: 4px;
`;

export const ContactsHeaderTitle = styled.h3`
  margin: 0;
  font-size: 26px;
`;

export const ContactsHeaderMeta = styled.p`
  margin: 0;
  color: var(--muted);
`;

export const ContactsToolbarBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 860px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const BulkSelectLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  font-size: 14px;
  font-weight: 600;

  input {
    width: 16px;
    height: 16px;
    accent-color: var(--primary);
  }
`;

export const ToolbarSearch = styled.label`
  display: grid;
  gap: 6px;
  flex: 1;
  max-width: 420px;

  @media (max-width: 860px) {
    max-width: none;
    width: 100%;
  }
`;

export const SelectionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(18, 53, 36, 0.18);
  background: rgba(18, 53, 36, 0.06);

  @media (max-width: 860px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const SelectionSummary = styled.strong`
  font-size: 14px;
`;

export const ContactsListShell = styled.div`
  display: grid;
  gap: 10px;
`;

export const ContactsListHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 4px;
  color: var(--muted);
  font-size: 13px;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const CompactContactCard = styled.article<{ $selected: boolean }>`
  border: 1px solid ${({ $selected }) => ($selected ? 'rgba(18, 53, 36, 0.28)' : 'var(--border)')};
  background: ${({ $selected }) => ($selected ? 'rgba(18, 53, 36, 0.08)' : 'rgba(255, 255, 255, 0.48)')};
  border-radius: 16px;
  padding: 12px 14px;
  display: grid;
  gap: 10px;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

export const CompactContactRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const CompactContactMain = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;
`;

export const CompactContactNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

export const SelectionIndicator = styled.span<{ $selected: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: ${({ $selected }) => ($selected ? 'var(--primary)' : 'rgba(18, 53, 36, 0.16)')};
  flex: 0 0 auto;
`;

export const CompactContactPhone = styled.span`
  color: var(--muted);
  font-size: 13px;
`;

export const CompactContactMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const ContactMetaChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border-radius: 999px;
  background: rgba(18, 53, 36, 0.06);
  color: var(--muted);
  font-size: 12px;
`;

export const ContactActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
`;

export const ContactDangerButton = styled.button`
  padding: 9px 12px;
  font-size: 13px;
  background: linear-gradient(135deg, #90292c, var(--danger));
`;

export const CompactPagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 4px;

  @media (max-width: 720px) {
    justify-content: center;
    flex-wrap: wrap;
  }
`;

export const CompactPageInfo = styled.span`
  color: var(--muted);
  font-size: 13px;
`;

export const HiddenFileInput = styled.input`
  display: none;
`;

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(14, 22, 18, 0.45);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 50;
`;

export const ModalCard = styled.div`
  width: min(720px, 100%);
  max-height: 84vh;
  overflow: auto;
  border-radius: 24px;
  background: var(--surface-strong);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  padding: 24px;
  display: grid;
  gap: 16px;
`;
