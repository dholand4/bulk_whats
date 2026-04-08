import { Device } from '../../types';
import { formatDateTime } from '../../utils/format';
import { Badge, EmptyState, GhostButton, InlineActions, MutedText } from '../AppShell/styled';
import { AuthBox, DeviceCardWrap, DeviceGrid, DeviceMeta, QrImage } from './styled';

interface DeviceCardListProps {
  devices: Device[];
  expandedDeviceId: string | null;
  onConnect: (deviceId: string) => void;
}

function renderDeviceStatus(device: Device) {
  if (device.status === 'connected') {
    return 'Dispositivo autenticado e pronto para enviar mensagens.';
  }

  if (device.status === 'authenticated') {
    return 'Sessao encontrada. Validando conexao automaticamente...';
  }

  if (device.runtime?.initializing || device.status === 'initializing') {
    return 'Verificando sessao existente e preparando autenticacao...';
  }

  if (['disconnected', 'auth_failure'].includes(device.status)) {
    return 'Sessao expirada ou desconectada. Clique em conectar e escaneie o QR Code para reconectar.';
  }

  return 'QR Code ainda nao disponivel. Aguarde alguns segundos.';
}

export function DeviceCardList({ devices, expandedDeviceId, onConnect }: DeviceCardListProps) {
  if (devices.length === 0) {
    return <EmptyState>Nenhum dispositivo cadastrado.</EmptyState>;
  }

  return (
    <DeviceGrid>
      {devices.map((device) => (
        <DeviceCardWrap key={device.id}>
          <div>
            <Badge>{device.status}</Badge>
            <h3>{device.name}</h3>
            <MutedText>{device.description || 'Sem descricao.'}</MutedText>
          </div>

          <DeviceMeta>
            <span>ID: {device.id}</span>
            <span>Criado em: {formatDateTime(device.createdAt)}</span>
            <span>Ultimo status: {device.lastKnownStatus || '-'}</span>
            <span>Numero conectado: {device.connectedNumber || '-'}</span>
          </DeviceMeta>

          <InlineActions>
            <GhostButton type="button" onClick={() => onConnect(device.id)}>
              Conectar
            </GhostButton>
          </InlineActions>

          {expandedDeviceId === device.id ? (
            <AuthBox>
              <MutedText>
                Status atual: {device.lastKnownStatus || device.status || 'Aguardando inicializacao'}
              </MutedText>
              <MutedText>{renderDeviceStatus(device)}</MutedText>
              {device.status === 'qr_ready' && device.qrCode ? (
                <QrImage src={device.qrCode} alt={`QR Code do dispositivo ${device.name}`} />
              ) : null}
              {device.runtime?.lastError ? <MutedText>{device.runtime.lastError}</MutedText> : null}
            </AuthBox>
          ) : null}
        </DeviceCardWrap>
      ))}
    </DeviceGrid>
  );
}
