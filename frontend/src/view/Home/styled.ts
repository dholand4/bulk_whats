import styled from 'styled-components';
import { ListPreview } from '../../components/AppShell/styled';

export const PreviewList = styled(ListPreview)`
  max-height: 420px;
  overflow-y: auto;
  padding-right: 6px;

  scrollbar-width: thin;
  scrollbar-color: rgba(18, 53, 36, 0.28) transparent;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(18, 53, 36, 0.22);
    border-radius: 999px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(18, 53, 36, 0.34);
  }
`;

export const PreviewCard = styled.article`
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.48);
  display: grid;
  gap: 8px;

  strong {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  strong,
  span,
  p {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  @media (max-width: 720px) {
    padding: 16px;
  }
`;

export const PreviewMeta = styled.p`
  margin: 0;
  color: var(--muted);
`;

export const SummaryHint = styled.p`
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
`;

export const StatusValue = styled.strong<{ $connected: boolean }>`
  font-size: 28px;
  font-family: 'Space Grotesk', sans-serif;
  color: ${({ $connected }) => ($connected ? 'var(--primary)' : 'var(--muted)')};
`;

export const DeviceDetails = styled.div`
  display: grid;
  gap: 6px;
  margin-top: -4px;
  color: var(--muted);
  font-size: 13px;

  span {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
`;
