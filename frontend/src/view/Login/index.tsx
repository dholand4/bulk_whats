import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eyebrow, InputGroup, Stack, StatusText } from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { LoginCard, LoginLayout, LoginTitle } from './styled';

export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginStatus, isGlobalLoading } = useApp();
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
          <Eyebrow style={{ color: 'var(--muted)' }}>Acessar Sistema</Eyebrow>
          <LoginTitle>Bulk Whats</LoginTitle>
          <p style={{ color: 'var(--muted)', margin: '8px 0 0' }}>
            Acesse com seu e-mail e senha para gerenciar e enviar mensagens em massa pelo WhatsApp.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Stack>
            <InputGroup>
              <span>E-mail</span>
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
            <button type="submit" disabled={isGlobalLoading}>
              Entrar
            </button>
          </Stack>
        </form>

        {loginStatus ? <StatusText>{loginStatus}</StatusText> : null}
      </LoginCard>
    </LoginLayout>
  );
}
