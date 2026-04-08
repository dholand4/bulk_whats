import { FormEvent, useState } from 'react';
import {
  DangerButton,
  EmptyState,
  GhostButton,
  InlineActions,
  InputGroup,
  Panel,
  PanelGrid,
  PanelHeading,
  Stack,
  StatusText,
} from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { UserCard, UsersList } from './styled';

export function AdminView() {
  const { users, saveAdminUser, deleteAdminUser } = useApp();
  const [editingUserMatricula, setEditingUserMatricula] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    matricula: '',
    role: 'user',
    dataExpiracao: '',
    password: '',
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await saveAdminUser(
        {
          matricula: form.matricula.trim(),
          role: form.role as 'user' | 'admin',
          dataExpiracao: form.dataExpiracao,
          password: form.password,
        },
        editingUserMatricula,
      );
      setStatus('Matricula salva com sucesso.');
      setEditingUserMatricula(null);
      setForm({ matricula: '', role: 'user', dataExpiracao: '', password: '' });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Falha ao salvar matricula.');
    }
  }

  return (
    <PanelGrid $narrowLeft>
      <Panel>
        <PanelHeading>
          <h3>Gestao de matriculas</h3>
        </PanelHeading>

        <form onSubmit={handleSubmit}>
          <Stack>
            <InputGroup>
              <span>Matricula</span>
              <input
                type="text"
                required
                value={form.matricula}
                onChange={(event) => setForm((current) => ({ ...current, matricula: event.target.value }))}
              />
            </InputGroup>

            <InputGroup>
              <span>Perfil</span>
              <select
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              >
                <option value="user">Usuario</option>
                <option value="admin">Admin</option>
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
              <span>{editingUserMatricula ? 'Nova senha' : 'Senha'}</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder={editingUserMatricula ? 'Preencha so para trocar' : 'Defina uma senha'}
                required={!editingUserMatricula}
              />
            </InputGroup>

            <InlineActions>
              <button type="submit">Salvar acesso</button>
              {editingUserMatricula ? (
                <GhostButton
                  type="button"
                  onClick={() => {
                    setEditingUserMatricula(null);
                    setForm({ matricula: '', role: 'user', dataExpiracao: '', password: '' });
                    setStatus('');
                  }}
                >
                  Cancelar edicao
                </GhostButton>
              ) : null}
            </InlineActions>

            {status ? <StatusText>{status}</StatusText> : null}
          </Stack>
        </form>
      </Panel>

      <Panel>
        <PanelHeading>
          <h3>Usuarios cadastrados</h3>
        </PanelHeading>

        {users.length === 0 ? (
          <EmptyState>Nenhuma matricula cadastrada.</EmptyState>
        ) : (
          <UsersList>
            {users.map((user) => (
              <UserCard key={user.matricula}>
                <div>
                  <strong>{user.matricula}</strong>
                  <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>
                    {user.role} • expira em {user.dataExpiracao}
                  </p>
                </div>
                <InlineActions>
                  <GhostButton
                    type="button"
                    onClick={() => {
                      setEditingUserMatricula(user.matricula);
                      setForm({
                        matricula: user.matricula,
                        role: user.role,
                        dataExpiracao: user.dataExpiracao,
                        password: '',
                      });
                      setStatus('');
                    }}
                  >
                    Editar
                  </GhostButton>
                  <DangerButton type="button" onClick={() => void deleteAdminUser(user.matricula)}>
                    Excluir
                  </DangerButton>
                </InlineActions>
              </UserCard>
            ))}
          </UsersList>
        )}
      </Panel>
    </PanelGrid>
  );
}
