import { Outlet } from 'react-router-dom';
import { navigationItems } from '../../constants/navigation';
import { useApp } from '../../providers/AppProvider';
import {
  Eyebrow,
  GhostButton,
  Main,
  NavButton,
  NavList,
  Shell,
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarMuted,
  SidebarTitle,
  Topbar,
  TopbarTitle,
} from './styled';

export function AppShell() {
  const { user, logout } = useApp();

  return (
    <Shell>
      <Sidebar>
        <SidebarHeader>
          <Eyebrow>Gestão</Eyebrow>
          <SidebarTitle>Bulk Whats</SidebarTitle>
          <SidebarMuted>
            {user ? `${user.matricula} • ${user.role === 'admin' ? 'Admin' : 'Usuario'}` : ''}
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
          <GhostButton type="button" onClick={() => void logout()}>
            Sair
          </GhostButton>
        </SidebarFooter>
      </Sidebar>

      <Main>
        <Outlet />
      </Main>
    </Shell>
  );
}
