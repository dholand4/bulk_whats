import styled from 'styled-components';

export const LoadingOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(10, 24, 17, 0.5);
  backdrop-filter: blur(8px);
`;

export const LoadingCard = styled.div`
  width: min(100%, 320px);
  padding: 28px 24px 22px;
  border-radius: 28px;
  /* background: rgba(245, 239, 231, 0.96); */
  /* border: 1px solid rgba(18, 53, 36, 0.12); */
  /* box-shadow: 0 26px 70px rgba(8, 22, 14, 0.24); */
  display: grid;
  gap: 10px;
  justify-items: center;
  text-align: center;
`;

export const LoadingTitle = styled.strong`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 20px;
  color: var(--primary);
`;

export const LoadingText = styled.p`
  margin: 0;
  color: var(--muted);
  line-height: 1.5;
`;
