import styled from 'styled-components';
import { Badge, ContactListStrip, FieldLabel, Panel } from '../../components/AppShell/styled';

export const HeroPanel = styled(Panel)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
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

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const UploadPanel = styled.div`
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.48);

  @media (max-width: 720px) {
    padding: 14px;
  }
`;

export const SpreadsheetDropzone = styled.label`
  display: grid;
  gap: 10px;
  padding: 18px;
  border-radius: 18px;
  border: 1px dashed rgba(18, 53, 36, 0.24);
  background: rgba(18, 53, 36, 0.04);
  cursor: pointer;
`;

export const UploadDropzone = styled(SpreadsheetDropzone)`
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.6), rgba(18, 53, 36, 0.03)),
    rgba(18, 53, 36, 0.04);
`;

export const HiddenFileInput = styled.input`
  display: none;
`;

export const SpreadsheetSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const ListsStrip = styled(ContactListStrip)`
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-height: 540px;
  overflow-y: auto;
  padding-right: 6px;
  gap: 10px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

export const ListItem = styled.div<{ $active: boolean }>`
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(18, 53, 36, 0.32)' : 'var(--border)')};
  background: ${({ $active }) => ($active ? 'rgba(18, 53, 36, 0.08)' : 'rgba(255, 255, 255, 0.48)')};
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
  }
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
  display: grid;
  gap: 10px;
`;

export const AttachmentHint = styled.span`
  color: var(--muted);
  font-size: 13px;
`;

export const AttachmentList = styled.div`
  display: grid;
  gap: 8px;
`;

export const AttachmentItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.62);

  strong,
  span {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const AttachmentMeta = styled.span`
  color: var(--muted);
  font-size: 13px;
`;

export const SectionLabel = styled(FieldLabel)``;

export const SearchField = styled.label`
  display: grid;
  gap: 6px;
`;

export const ListsSection = styled.div`
  display: grid;
  gap: 16px;
`;

export const ListsToolbar = styled.div`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 860px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const ListsToolbarActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
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

export const ListItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const ListCardMain = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;

  strong,
  p {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
`;

export const ListCardTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

export const ListMeta = styled.p`
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

  @media (max-width: 720px) {
    width: 100%;
    justify-content: flex-start;

    > * {
      flex: 1 1 100%;
      width: 100%;
    }
  }
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

  @media (max-width: 720px) {
    max-height: calc(100vh - 24px);
    padding: 18px;
    border-radius: 20px;
  }
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

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const ContactPreviewMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: var(--muted);
  font-size: 13px;
`;

export const PaginationSummary = styled.span`
  color: var(--muted);
  text-align: center;
`;
