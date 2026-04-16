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

export const PasswordField = styled.div`
  position: relative;
  display: grid;

  input {
    padding-right: 50px;
  }
`;

export const PasswordToggle = styled.button`
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  padding: 0;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--muted);
  box-shadow: none;

  &:hover {
    transform: translateY(-50%);
    background: rgba(18, 53, 36, 0.06);
    color: var(--primary);
    filter: none;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 4px rgba(18, 53, 36, 0.08);
    color: var(--primary);
  }
`;
