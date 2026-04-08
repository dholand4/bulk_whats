import styled from 'styled-components';

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(14, 22, 18, 0.45);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 40;
`;

export const ModalCard = styled.div`
  width: min(920px, 100%);
  max-height: 84vh;
  overflow: auto;
  border-radius: 24px;
  background: var(--surface-strong);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  padding: 24px;
`;

export const GuideContent = styled.div`
  display: grid;
  gap: 22px;

  h3,
  h4,
  h5,
  p,
  ul {
    margin: 0;
  }

  ul {
    padding-left: 18px;
    display: grid;
    gap: 6px;
  }
`;

export const Step = styled.section`
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.48);
`;

export const CodeExample = styled.div`
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 16px;
  background: #1c241f;
  color: #f5efe7;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 13px;
`;
