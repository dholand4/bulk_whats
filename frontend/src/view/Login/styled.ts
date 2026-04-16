import styled from 'styled-components';
import { Panel } from '../../components/AppShell/styled';

export const LoginLayout = styled.section`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 18px;

  @media (max-width: 720px) {
    padding: 14px;
  }
`;

export const LoginCard = styled(Panel)`
  width: min(100%, 520px);
  display: grid;
  gap: 18px;

  @media (max-width: 720px) {
    padding: 18px;
    border-radius: 20px;
  }
`;

export const LoginTitle = styled.h1`
  margin: 0;
  font-size: clamp(30px, 7vw, 40px);
  font-family: 'Space Grotesk', sans-serif;
`;

export const LoginHeader = styled.div`
  display: grid;
  gap: 8px;
`;

export const LoginEyebrow = styled.span`
  color: var(--muted);
`;

export const LoginDescription = styled.p`
  margin: 0;
  color: var(--muted);
`;
