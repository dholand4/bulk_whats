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

  return (
    <Shell>
      <PasswordChangeModal />
      <Sidebar>
        <SidebarHeader>
          <Eyebrow>Gestao</Eyebrow>
          <SidebarTitle>Bulk Whats</SidebarTitle>
          <SidebarMuted>
            {user ? `${user.email} • ${user.role === 'admin' ? 'Admin' : 'Usuario'}` : ''}
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
