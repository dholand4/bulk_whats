import styled from 'styled-components';
import { Panel } from '../../components/AppShell/styled';

export const HeroPanel = styled(Panel)`
  display: grid;
  gap: 18px;
`;

export const HeroHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const CreateTemplateForm = styled.form`
  display: grid;
  gap: 14px;
`;

export const TemplatesLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(260px, 380px) minmax(0, 1fr);
  gap: 18px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

export const TemplatesSection = styled.div`
  display: grid;
  gap: 16px;
`;

export const ToolbarBar = styled.div`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const SearchField = styled.label`
  display: grid;
  gap: 6px;
  flex: 1;
`;

export const TemplateList = styled.div`
  display: grid;
  gap: 10px;
`;

export const TemplateCard = styled.button<{ $active: boolean }>`
  text-align: left;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(18, 53, 36, 0.32)' : 'var(--border)')};
  background: ${({ $active }) => ($active ? 'rgba(18, 53, 36, 0.08)' : 'rgba(255, 255, 255, 0.48)')};
  color: var(--text);
  border-radius: 16px;
  box-shadow: none;
  padding: 14px;
  display: grid;
  gap: 10px;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;

  &:hover {
    transform: translateY(-1px);
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const CardMain = styled.div`
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

export const CardMeta = styled.p`
  margin: 0;
  color: var(--muted);
  font-size: 13px;
`;

export const BadgeRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

export const DetailSection = styled.div`
  display: grid;
  gap: 16px;
`;

export const DetailHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const VariantList = styled.div`
  display: grid;
  gap: 10px;
`;

export const VariantCard = styled.article`
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.48);
  border-radius: 16px;
  padding: 14px;
  display: grid;
  gap: 12px;
`;

export const VariantBody = styled.p`
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
`;

export const VariantActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;

  @media (max-width: 720px) {
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

  @media (max-width: 720px) {
    max-height: calc(100vh - 24px);
    padding: 18px;
    border-radius: 20px;
  }
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const ActiveLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  font-weight: 600;

  input {
    width: 16px;
    height: 16px;
    accent-color: var(--primary);
  }
`;
