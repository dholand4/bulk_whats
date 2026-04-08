import styled from 'styled-components';

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 18, 14, 0.68);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 120;
`;

export const ModalCard = styled.div`
  width: min(520px, 100%);
  border-radius: 24px;
  background: var(--surface-strong);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  padding: 24px;
  display: grid;
  gap: 18px;
`;

export const Lead = styled.p`
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
`;
