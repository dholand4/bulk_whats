import styled from 'styled-components';
import { Panel } from '../../components/AppShell/styled';

export const LoginLayout = styled.section`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 18px;
`;

export const LoginCard = styled(Panel)`
  width: min(100%, 520px);
  display: grid;
  gap: 18px;
`;

export const LoginTitle = styled.h1`
  margin: 0;
  font-size: 40px;
  font-family: 'Space Grotesk', sans-serif;
`;
