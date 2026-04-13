import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eyebrow, InputGroup, Stack, StatusText } from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { LoginCard, LoginLayout, LoginTitle } from './styled';

export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginStatus } = useApp();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await login(email.trim(), password);
      navigate('/overview', { replace: true });
    } catch {
      // O status ja e atualizado no provider.
    }
  }

  return (
    <LoginLayout>
      <LoginCard>
        <div>
          <Eyebrow style={{ color: 'var(--muted)' }}>Bulk Whats</Eyebrow>
          <LoginTitle>Entrar no painel</LoginTitle>
          <p style={{ color: 'var(--muted)', margin: '8px 0 0' }}>
            Entre com seu email e senha para acessar o painel e a sessao WhatsApp associada.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Stack>
            <InputGroup>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Digite seu email"
                required
              />
            </InputGroup>
            <InputGroup>
              <span>Senha</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                required
              />
            </InputGroup>
            <button type="submit">Entrar</button>
          </Stack>
        </form>

        {loginStatus ? <StatusText>{loginStatus}</StatusText> : null}
      </LoginCard>
    </LoginLayout>
  );
}
