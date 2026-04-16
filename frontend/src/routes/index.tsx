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
    return <Navigate to="/home" replace />;
  }

  return <AdminView />;
}

export function AppRoutes() {
  const { token } = useApp();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/home" replace /> : <LoginView />} />
      <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomeView />} />
        <Route path="/dispositivo" element={<DevicesView />} />
        <Route path="/contato" element={<ContactsView />} />
        <Route path="/envios" element={<ComposeView />} />
        <Route path="/agendamentos" element={<QueueView />} />
        <Route path="/historico" element={<HistoryView />} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="/overview" element={<Navigate to="/home" replace />} />
        <Route path="/devices" element={<Navigate to="/dispositivo" replace />} />
        <Route path="/contacts" element={<Navigate to="/contato" replace />} />
        <Route path="/compose" element={<Navigate to="/envios" replace />} />
        <Route path="/queue" element={<Navigate to="/agendamentos" replace />} />
        <Route path="/history" element={<Navigate to="/historico" replace />} />
      </Route>
      <Route path="*" element={<Navigate to={token ? '/home' : '/login'} replace />} />
    </Routes>
  );
}
