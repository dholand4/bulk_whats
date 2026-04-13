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

export const ListsOverview = styled(ContactListStrip)``;

export const ListButton = styled.button<{ $active: boolean }>`
  text-align: left;
  background: ${({ $active }) => ($active ? 'rgba(18, 53, 36, 0.08)' : 'rgba(255, 255, 255, 0.48)')};
  color: var(--text);
  border: 1px solid ${({ $active }) => ($active ? 'rgba(18, 53, 36, 0.32)' : 'var(--border)')};
  box-shadow: none;
  border-radius: 18px;
  /* padding: 16px; */
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
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
  gap: 12px;
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
