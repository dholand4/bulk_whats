const deviceStatusLabels: Record<string, string> = {
  connected: 'Conectado',
  authenticated: 'Autenticado',
  disconnected: 'Desconectado',
  error: 'Erro',
  initializing: 'Inicializando',
  qr_ready: 'QR Code disponível',
  pairing_code_ready: 'Código de pareamento disponível',
  resetting_session: 'Redefinindo sessão',
  auth_failure: 'Falha na autenticação',
};

export function isDeviceConnectedStatus(status: string, hasClient?: boolean) {
  return ['connected', 'authenticated'].includes(status) && hasClient !== false;
}

export function formatDeviceStatus(status?: string | null) {
  const normalized = String(status || '').trim().toLowerCase();

  if (!normalized) {
    return 'Sem status';
  }

  return deviceStatusLabels[normalized]
    || `${normalized.charAt(0).toUpperCase()}${normalized.slice(1).replaceAll('_', ' ')}`;
}
