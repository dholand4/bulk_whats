import { Outlet } from 'react-router-dom';
import { PasswordChangeModal } from '../PasswordChangeModal';
import { navigationItems } from '../../constants/navigation';
import { useApp } from '../../providers/AppProvider';
import {
  Eyebrow,
  GhostButtonS,
  Main,
  NavButton,
  NavList,
  Shell,
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarMuted,
  SidebarTitle,
} from './styled';

export function AppShell() {
  const { user, logout } = useApp();
  const emailLabel = user?.email ? user.email.split('@')[0] : '';

  const formatExpirationDate = (value?: string) => {
    if (!value) {
      return '';
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      return value;
    }

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      const parsedDate = new Date(value);

      if (Number.isNaN(parsedDate.getTime())) {
        return value;
      }

      return parsedDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }

    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const roleLabel =
    user?.role === 'admin' ? 'Admin' : formatExpirationDate(user?.dataExpiracao);

  return (
    <Shell>
      <PasswordChangeModal />
      <Sidebar>
        <SidebarHeader>
          <Eyebrow>Gestao</Eyebrow>
          <SidebarTitle>Bulk Whats</SidebarTitle>
          <SidebarMuted title={user?.email || undefined}>
            {user ? `${emailLabel} - ${roleLabel}` : ''}
          </SidebarMuted>
        </SidebarHeader>

        <NavList>
          {navigationItems.map((item) => (
            <NavButton key={item.path} to={item.path}>
              {item.label}
            </NavButton>
          ))}
          {user?.role === 'admin' ? <NavButton to="/admin">Admin</NavButton> : null}
        </NavList>

        <SidebarFooter>
          <GhostButtonS type="button" onClick={() => void logout()}>
            Sair
          </GhostButtonS>
        </SidebarFooter>
      </Sidebar>

      <Main>
        <Outlet />
      </Main>
    </Shell>
  );
}
