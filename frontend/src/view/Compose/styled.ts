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
`;

export const ListItem = styled.label<{ $active: boolean }>`
  display: grid;
  gap: 10px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(18, 53, 36, 0.32)' : 'var(--border)')};
  background: ${({ $active }) => ($active ? 'rgba(18, 53, 36, 0.08)' : 'rgba(255, 255, 255, 0.48)')};
  cursor: pointer;
`;

export const HiddenCheckbox = styled.input`
  display: none;
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
