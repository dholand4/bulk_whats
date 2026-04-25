import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PasswordChangeModal } from '../PasswordChangeModal';
import { navigationItems } from '../../constants/navigation';
import { useApp } from '../../providers/AppProvider';
import {
  Eyebrow,
  GhostButtonS,
  Main,
  MobileCloseButton,
  MobileMenuButton,
  MobileMenuIcon,
  MobileSidebarOverlay,
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
    user?.role === 'admin' ? 'Administrador' : formatExpirationDate(user?.dataExpiracao);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 981px)');

    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) {
        setIsMobileSidebarOpen(false);
      }
    };

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return (
    <Shell>
      <PasswordChangeModal />
      <MobileMenuButton
        type="button"
        onClick={() => setIsMobileSidebarOpen(true)}
        aria-label="Abrir menu lateral"
        aria-expanded={isMobileSidebarOpen}
        $hidden={isMobileSidebarOpen}
      >
        <MobileMenuIcon aria-hidden="true">
          <span />
          <span />
          <span />
        </MobileMenuIcon>
      </MobileMenuButton>
      <MobileSidebarOverlay
        $isOpen={isMobileSidebarOpen}
        onClick={() => setIsMobileSidebarOpen(false)}
        aria-hidden={!isMobileSidebarOpen}
      />
      <Sidebar $isMobileOpen={isMobileSidebarOpen}>
        <MobileCloseButton
          type="button"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Fechar menu lateral"
        >
          <span />
          <span />
        </MobileCloseButton>
        <SidebarHeader>
          <Eyebrow>Gestão</Eyebrow>
          <SidebarTitle>Bulk Whats</SidebarTitle>
          <SidebarMuted title={user?.email || undefined}>
            {user ? `${emailLabel} - ${roleLabel}` : ''}
          </SidebarMuted>
        </SidebarHeader>

        <NavList>
          {navigationItems.map((item) => (
            <NavButton key={item.path} to={item.path} onClick={() => setIsMobileSidebarOpen(false)}>
              {item.label}
            </NavButton>
          ))}
          {user?.role === 'admin' ? (
            <NavButton to="/admin" onClick={() => setIsMobileSidebarOpen(false)}>
              Administração
            </NavButton>
          ) : null}
        </NavList>

        <SidebarFooter>
          <GhostButtonS
            type="button"
            onClick={() => {
              setIsMobileSidebarOpen(false);
              void logout();
            }}
          >
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
