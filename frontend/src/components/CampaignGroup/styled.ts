import styled from 'styled-components';
import { EmptyState, GhostButton } from '../AppShell/styled';

export const GroupList = styled.div`
  display: grid;
  gap: 16px;
`;

export const GroupCard = styled.details`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: var(--shadow);
`;

export const GroupSummary = styled.summary`
  list-style: none;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 18px;
  padding: 20px 24px;
  cursor: pointer;

  &::-webkit-details-marker {
    display: none;
  }

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 720px) {
    padding: 18px;
  }
`;

export const SummaryMain = styled.div`
  display: grid;
  gap: 8px;

  h4,
  p {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
`;

export const SummarySide = styled.div`
  display: grid;
  justify-items: end;
  gap: 8px;

  span {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
    text-align: right;
  }

  @media (max-width: 860px) {
    justify-items: start;

    span {
      text-align: left;
    }
  }
`;

export const Detail = styled.div`
  border-top: 1px solid var(--border);
  padding: 0 24px 24px;
  display: grid;
  gap: 18px;

  @media (max-width: 720px) {
    padding: 0 18px 18px;
  }
`;

export const DetailGrid = styled.div`
  display: grid;
  gap: 18px;
  grid-template-columns: 1fr 1fr;
  padding-top: 18px;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

export const NoteCard = styled.div`
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.48);

  p {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  @media (max-width: 720px) {
    padding: 16px;
  }
`;

export const ContactRows = styled.div`
  display: grid;
  gap: 12px;
`;

export const ContactRow = styled.div`
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 16px;
  display: grid;
  gap: 10px;
  background: rgba(255, 255, 255, 0.54);

  @media (max-width: 720px) {
    padding: 14px;
  }
`;

export const ContactMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  color: var(--muted);
  font-size: 13px;

  span {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
`;

export const RowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;

  > div {
    min-width: 0;
  }

  strong,
  p {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

export const ActionButton = styled(GhostButton)`
  padding: 9px 12px;
  font-size: 13px;

  @media (max-width: 720px) {
    width: 100%;
  }
`;

export const GroupEmpty = styled(EmptyState)``;
