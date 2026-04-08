import { FormEvent, useState } from 'react';
import { InputGroup, PanelHeading, Stack, StatusText } from '../AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { Lead, ModalCard, ModalOverlay } from './styled';

export function PasswordChangeModal() {
  const { user, changeOwnPassword } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user?.mustChangePassword) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setStatus('A confirmacao da nova senha precisa ser igual.');
      return;
    }

    setSaving(true);
    setStatus('');

    try {
      const message = await changeOwnPassword(currentPassword, newPassword);
      setStatus(message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao alterar a senha.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay>
      <ModalCard>
        <PanelHeading>
          <div>
            <h3 style={{ margin: 0 }}>Troque sua senha inicial</h3>
          </div>
        </PanelHeading>

        <Lead>
          Este acesso esta usando uma senha provisoria. Antes de continuar, informe a senha atual e defina sua nova senha.
        </Lead>

        <form onSubmit={handleSubmit}>
          <Stack>
            <InputGroup>
              <span>Senha atual</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Digite a senha atual"
                required
              />
            </InputGroup>

            <InputGroup>
              <span>Nova senha</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Digite a nova senha"
                required
              />
            </InputGroup>

            <InputGroup>
              <span>Confirmar nova senha</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repita a nova senha"
                required
              />
            </InputGroup>

            <button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Alterar senha'}
            </button>

            {status ? <StatusText style={{ color: status.includes('sucesso') ? 'var(--primary)' : undefined }}>{status}</StatusText> : null}
          </Stack>
        </form>
      </ModalCard>
    </ModalOverlay>
  );
}
