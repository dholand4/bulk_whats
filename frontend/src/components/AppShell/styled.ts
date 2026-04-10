import { NavLink } from 'react-router-dom';
import styled from 'styled-components';

export const Shell = styled.div`
  min-height: 100vh;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

export const Sidebar = styled.aside`
  background: rgba(18, 53, 36, 0.94);
  color: #f5efe7;
  padding: 28px 22px;
  display: flex;
  flex-direction: column;
  gap: 28px;
  position: sticky;
  top: 0;
  min-height: 100vh;

  @media (max-width: 980px) {
    min-height: auto;
    position: static;
  }
`;

export const SidebarHeader = styled.div`
  display: grid;
  gap: 8px;
`;

export const Eyebrow = styled.p`
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 11px;
  color: rgba(245, 239, 231, 0.68);
`;

export const SidebarTitle = styled.h2`
  margin: 0;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 28px;
`;

export const MutedText = styled.p`
  margin: 0;
  color: var(--muted);
`;

export const SidebarMuted = styled(MutedText)`
  color: rgba(245, 239, 231, 0.72);
`;

export const NavList = styled.nav`
  display: grid;
  gap: 10px;
`;

export const NavButton = styled(NavLink)`
  padding: 12px 14px;
  border-radius: 14px;
  color: rgba(245, 239, 231, 0.86);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: 0.18s ease;

  &.active {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.16);
  }
`;

export const SidebarFooter = styled.div`
`;

export const Main = styled.main`
  padding: 28px;
  display: grid;
  gap: 24px;

  @media (max-width: 720px) {
    padding: 18px;
  }
`;

export const Topbar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 24px 28px;
  box-shadow: var(--shadow);
`;

export const TopbarTitle = styled.h1`
  margin: 4px 0 0;
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(28px, 4vw, 42px);
`;

export const Panel = styled.article`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 24px;
  box-shadow: var(--shadow);
`;

export const PanelGrid = styled.div<{ $narrowLeft?: boolean }>`
  display: grid;
  gap: 24px;
  grid-template-columns: ${({ $narrowLeft }) => ($narrowLeft ? '0.9fr 1.1fr' : '1fr 1fr')};

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const SummaryCard = styled(Panel)`
  display: grid;
  gap: 10px;
  padding: 20px 22px;
`;

export const SummaryLabel = styled.span`
  color: var(--muted);
  font-size: 13px;
`;

export const SummaryValue = styled.strong`
  font-size: 34px;
  font-family: 'Space Grotesk', sans-serif;
`;

export const PanelHeading = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
`;

export const PanelTitle = styled.h3`
  margin: 0;
  font-size: 22px;
`;

export const ListPreview = styled.div`
  display: grid;
  gap: 12px;
`;

export const EmptyState = styled.div`
  padding: 18px;
  border: 1px dashed var(--border);
  border-radius: 16px;
  color: var(--muted);
  background: rgba(255, 255, 255, 0.48);
`;

export const GhostButton = styled.button`
  background: transparent;
  color: var(--primary);
  border: 1px solid rgba(18, 53, 36, 0.18);
  box-shadow: none;
`;

export const GhostButtonS = styled.button`
  background: #90292c;
  color: white;
  border: 1px solid rgba(18, 53, 36, 0.18);
  box-shadow: none;
  width: 100%;
`;

export const DangerButton = styled.button`
  background: linear-gradient(135deg, #90292c, var(--danger));
`;

export const WarningButton = styled.button`
  background: linear-gradient(135deg, #9b6920, var(--warning));
`;

export const MiniButton = styled.button`
  padding: 9px 12px;
  font-size: 13px;
`;

export const IconButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  padding: 0;
  display: grid;
  place-items: center;
  font-size: 24px;
`;

export const InlineActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(18, 53, 36, 0.08);
  color: var(--primary);
  font-size: 12px;
  font-weight: 700;
`;

export const StatusText = styled.p`
  margin: 0;
  color: var(--danger);
  font-size: 14px;
`;

export const FieldLabel = styled.span`
  display: inline-block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
`;

export const Stack = styled.div`
  display: grid;
  gap: 14px;
`;

export const InputGroup = styled.label`
  display: grid;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
`;

export const ContactListStrip = styled.div`
  display: grid;
  gap: 12px;
`;

export const PaginationRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
`;
