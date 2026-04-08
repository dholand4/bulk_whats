import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eyebrow, InputGroup, Stack, StatusText } from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { LoginCard, LoginLayout, LoginTitle } from './styled';

export function LoginView() {
  const [matricula, setMatricula] = useState('');
  const { login, loginStatus } = useApp();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await login(matricula.trim());
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
            A matricula entra no sistema e tambem identifica a sessao WhatsApp do seu painel.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Stack>
            <InputGroup>
              <span>Matricula</span>
              <input
                type="text"
                value={matricula}
                onChange={(event) => setMatricula(event.target.value)}
                placeholder="Digite sua matricula"
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
