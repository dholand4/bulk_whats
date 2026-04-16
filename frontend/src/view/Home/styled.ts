import styled from 'styled-components';
import { ListPreview } from '../../components/AppShell/styled';

export const PreviewList = styled(ListPreview)``;

export const PreviewCard = styled.article`
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.48);
  display: grid;
  gap: 8px;

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
