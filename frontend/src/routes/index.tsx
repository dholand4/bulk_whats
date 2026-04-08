import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useApp } from '../providers/AppProvider';
import { AdminView } from '../view/Admin';
import { ComposeView } from '../view/Compose';
import { ContactsView } from '../view/Contacts';
import { DevicesView } from '../view/Devices';
import { HistoryView } from '../view/History';
import { HomeView } from '../view/Home';
import { LoginView } from '../view/Login';
import { QueueView } from '../view/Queue';

function ProtectedRoutes() {
  const { token } = useApp();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

function AdminRoute() {
  const { user } = useApp();

  if (user?.role !== 'admin') {
    return <Navigate to="/overview" replace />;
  }

  return <AdminView />;
}

export function AppRoutes() {
  const { token } = useApp();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/overview" replace /> : <LoginView />} />
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route path="/overview" element={<HomeView />} />
        <Route path="/devices" element={<DevicesView />} />
        <Route path="/contacts" element={<ContactsView />} />
        <Route path="/compose" element={<ComposeView />} />
        <Route path="/queue" element={<QueueView />} />
        <Route path="/history" element={<HistoryView />} />
        <Route path="/admin" element={<AdminRoute />} />
      </Route>
      <Route path="*" element={<Navigate to={token ? '/overview' : '/login'} replace />} />
    </Routes>
  );
}
