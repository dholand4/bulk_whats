import { FormEvent, useState } from 'react';
import {
  DangerButton,
  EmptyState,
  GhostButton,
  InputGroup,
  Panel,
  PanelGrid,
  PanelHeading,
  Stack,
  StatusText,
} from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { AdminActions, FormActions, UserCard, UserCardContent, UserMeta, UsersList } from './styled';

export function AdminView() {
  const { users, saveAdminUser, deleteAdminUser } = useApp();
  const [editingUserEmail, setEditingUserEmail] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    email: '',
    role: 'user',
    dataExpiracao: '',
    password: '',
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await saveAdminUser(
        {
          email: form.email.trim().toLowerCase(),
          role: form.role as 'user' | 'admin',
          dataExpiracao: form.dataExpiracao,
          password: form.password,
        },
        editingUserEmail,
      );
      setStatus('Usuário salvo com sucesso.');
      setEditingUserEmail(null);
      setForm({ email: '', role: 'user', dataExpiracao: '', password: '' });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao salvar usuário.');
    }
  }

  return (
    <PanelGrid $narrowLeft>
      <Panel>
        <PanelHeading>
          <h3>Gestão de usuários</h3>
        </PanelHeading>

        <form onSubmit={handleSubmit}>
          <Stack>
            <InputGroup>
              <span>Email</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
            </InputGroup>

            <InputGroup>
              <span>Perfil</span>
              <select
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              >
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </InputGroup>

            <InputGroup>
              <span>Expira em</span>
              <input
                type="date"
                required
                value={form.dataExpiracao}
                onChange={(event) => setForm((current) => ({ ...current, dataExpiracao: event.target.value }))}
              />
            </InputGroup>

            <InputGroup>
              <span>{editingUserEmail ? 'Senha provisória' : 'Senha inicial'}</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={editingUserEmail ? 'Preencha para redefinir o primeiro acesso' : 'Defina a senha inicial'}
                required={!editingUserEmail}
              />
            </InputGroup>

            <FormActions>
              <button type="submit">Salvar acesso</button>
              {editingUserEmail ? (
                <GhostButton
                  type="button"
                  onClick={() => {
                    setEditingUserEmail(null);
                    setForm({ email: '', role: 'user', dataExpiracao: '', password: '' });
                    setStatus('');
                  }}
                >
                  Cancelar edição
                </GhostButton>
              ) : null}
            </FormActions>

            {status ? <StatusText>{status}</StatusText> : null}
          </Stack>
        </form>
      </Panel>

      <Panel>
        <PanelHeading>
          <h3>Usuários cadastrados</h3>
        </PanelHeading>

        {users.length === 0 ? (
          <EmptyState>Nenhum usuário cadastrado.</EmptyState>
        ) : (
          <UsersList>
            {users.map((user) => (
              <UserCard key={user.email}>
                <UserCardContent>
                  <strong>{user.email}</strong>
                  <UserMeta>{user.role} - expira em {user.dataExpiracao}</UserMeta>
                </UserCardContent>
                <AdminActions>
                  <GhostButton
                    type="button"
                    onClick={() => {
                      setEditingUserEmail(user.email);
                      setForm({
                        email: user.email,
                        role: user.role,
                        dataExpiracao: user.dataExpiracao,
                        password: '',
                      });
                      setStatus('');
                    }}
                  >
                    Editar
                  </GhostButton>
                  <DangerButton type="button" onClick={() => void deleteAdminUser(user.email)}>
                    Excluir
                  </DangerButton>
                </AdminActions>
              </UserCard>
            ))}
          </UsersList>
        )}
      </Panel>
    </PanelGrid>
  );
}
