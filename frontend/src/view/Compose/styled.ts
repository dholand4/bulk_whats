import styled from 'styled-components';
import { Badge, ContactListStrip, FieldLabel, Panel } from '../../components/AppShell/styled';

export const HeroPanel = styled(Panel)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
`;

export const ComposeForm = styled.form`
  display: grid;
  gap: 24px;
`;

export const ComposeStack = styled.div`
  display: grid;
  gap: 24px;
`;

export const ComposeCard = styled(Panel)`
  display: grid;
  gap: 16px;
`;

export const ComposeHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
`;

export const UploadPanel = styled.div`
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.48);
`;

export const ListsStrip = styled(ContactListStrip)`
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  max-height: 540px;
  overflow-y: auto;
  padding-right: 6px;
`;

export const ListItem = styled.div<{ $active: boolean }>`
  display: grid;
  gap: 10px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(18, 53, 36, 0.32)' : 'var(--border)')};
  background: ${({ $active }) => ($active ? 'rgba(18, 53, 36, 0.08)' : 'rgba(255, 255, 255, 0.48)')};
`;

export const HiddenCheckbox = styled.input`
  display: none;
`;

export const ListCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const ListTitleButton = styled.button`
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
`;

export const PlaceholderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

export const PlaceholderChip = styled(Badge).attrs({ as: 'button', type: 'button' })`
  border: none;
  cursor: pointer;
`;

export const SubmitPanel = styled(Panel)`
  display: grid;
  gap: 16px;
`;

export const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

export const AttachmentPreview = styled.div`
  color: var(--muted);
  font-size: 13px;
`;

export const SectionLabel = styled(FieldLabel)``;

export const SearchField = styled.label`
  display: grid;
  gap: 6px;
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
  width: min(760px, 100%);
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

export const ContactsPreviewList = styled.div`
  display: grid;
  gap: 12px;
`;

export const ContactPreviewCard = styled.article<{ $excluded: boolean }>`
  display: grid;
  gap: 10px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid ${({ $excluded }) => ($excluded ? 'rgba(144, 41, 44, 0.22)' : 'var(--border)')};
  background: ${({ $excluded }) => ($excluded ? 'rgba(144, 41, 44, 0.08)' : 'rgba(255, 255, 255, 0.48)')};
`;

export const ContactPreviewHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const ContactPreviewMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: var(--muted);
  font-size: 13px;
`;
