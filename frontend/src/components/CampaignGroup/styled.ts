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
`;

export const SummaryMain = styled.div`
  display: grid;
  gap: 8px;
`;

export const SummarySide = styled.div`
  display: grid;
  justify-items: end;
  gap: 8px;

  @media (max-width: 860px) {
    justify-items: start;
  }
`;

export const Detail = styled.div`
  border-top: 1px solid var(--border);
  padding: 0 24px 24px;
  display: grid;
  gap: 18px;
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
`;

export const ContactMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  color: var(--muted);
  font-size: 13px;
`;

export const RowHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
`;

export const ActionButton = styled(GhostButton)`
  padding: 9px 12px;
  font-size: 13px;
`;

export const GroupEmpty = styled(EmptyState)``;
