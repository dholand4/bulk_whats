import { Device } from '../../types';
import { formatDeviceStatus, isDeviceConnectedStatus } from '../../utils/deviceStatus';
import { formatDateTime } from '../../utils/format';
import { Badge, DangerButton, EmptyState, GhostButton, MutedText } from '../AppShell/styled';
import { ConfirmModal } from '../ConfirmModal';
import { AuthBox, DeviceActions, DeviceCardWrap, DeviceGrid, DeviceHeader, DeviceMeta, QrImage } from './styled';
import { useState } from 'react';

interface DeviceCardListProps {
  devices: Device[];
  expandedDeviceId: string | null;
  onConnect: (deviceId: string) => void;
  onDisconnect: (deviceId: string) => Promise<string>;
}

function isDeviceConnected(device: Device) {
  return isDeviceConnectedStatus(device.status, device.runtime?.hasClient);
}

function getConnectButtonLabel(device: Device) {
  if (isDeviceConnected(device)) {
    return 'Conectado';
  }

  if (device.runtime?.initializing || device.status === 'initializing') {
    return 'Conectando...';
  }

  return 'Conectar';
}

function isBenignRuntimeError(error?: string) {
  if (!error) {
    return false;
  }

  const normalized = error.toLowerCase();
  return normalized.includes('ebusy') || normalized.includes('resource busy or locked') || normalized.includes('read');
}

function renderDeviceStatus(device: Device) {
  if ((device.status === 'connected' || device.status === 'authenticated') && device.runtime?.hasClient !== false) {
    return 'Dispositivo autenticado e pronto para enviar mensagens.';
  }

  if (device.status === 'qr_ready') {
    return 'QR Code disponível. Escaneie com o WhatsApp do seu celular.';
  }

  if (device.status === 'pairing_code_ready') {
    return 'Código de pareamento disponível para autenticação.';
  }

  if (device.runtime?.initializing || device.status === 'initializing') {
    return 'Verificando sessão existente e preparando autenticação...';
  }

  if (device.status === 'resetting_session') {
    return 'Aguarde, apagando últimos registros para gerar um novo QR Code...';
  }

  if (device.status === 'error') {
    return 'Não foi possível gerar o QR Code automaticamente. Clique em conectar para tentar novamente.';
  }

  if (['disconnected', 'auth_failure'].includes(device.status)) {
    return 'Sessão expirada ou desconectada. O sistema vai limpar os registros anteriores e exibir um novo QR Code automaticamente.';
  }

  return 'QR Code ainda não disponível. Aguarde alguns segundos.';
}

function getVisibleRuntimeError(device: Device) {
  if (!device.runtime?.lastError) {
    return '';
  }

  return device.runtime.lastError;
}

export function DeviceCardList({ devices, expandedDeviceId, onConnect, onDisconnect }: DeviceCardListProps) {
  const [confirmDevice, setConfirmDevice] = useState<Device | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  if (devices.length === 0) {
    return <EmptyState>Nenhum dispositivo cadastrado.</EmptyState>;
  }

  async function handleConfirmDisconnect() {
    if (!confirmDevice) {
      return;
    }

    const deviceId = confirmDevice.id;
    setDisconnecting(true);
    setConfirmDevice(null);

    try {
      await onDisconnect(deviceId);
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <>
      <DeviceGrid>
        {devices.map((device) => (
          <DeviceCardWrap key={device.id}>
            <DeviceHeader>
              <Badge>{formatDeviceStatus(device.status)}</Badge>
              <h3>{device.name}</h3>
              <MutedText>{device.description || 'Sem descrição.'}</MutedText>
            </DeviceHeader>

            <DeviceMeta>
              <span>ID: {device.id}</span>
              <span>Criado em: {formatDateTime(device.createdAt)}</span>
              <span>Último status: {formatDeviceStatus(device.lastKnownStatus || device.status)}</span>
              <span>Número conectado: {device.connectedNumber || '-'}</span>
            </DeviceMeta>

            <DeviceActions>
              <GhostButton
                type="button"
                onClick={() => onConnect(device.id)}
                disabled={isDeviceConnected(device) || device.runtime?.initializing || device.status === 'initializing'}
              >
                {getConnectButtonLabel(device)}
              </GhostButton>
              {isDeviceConnected(device) ? (
                <DangerButton
                  type="button"
                  onClick={() => setConfirmDevice(device)}
                  disabled={disconnecting}
                >
                  Desconectar
                </DangerButton>
              ) : null}
            </DeviceActions>

            {expandedDeviceId === device.id ? (
              <AuthBox>
                <MutedText>{renderDeviceStatus(device)}</MutedText>
                {device.status === 'qr_ready' && device.qrCode ? (
                  <QrImage src={device.qrCode} alt={`QR Code do dispositivo ${device.name}`} />
                ) : null}
                {getVisibleRuntimeError(device) ? <MutedText>{getVisibleRuntimeError(device)}</MutedText> : null}
              </AuthBox>
            ) : null}
          </DeviceCardWrap>
        ))}
      </DeviceGrid>

      <ConfirmModal
        open={Boolean(confirmDevice)}
        title="Desconectar WhatsApp"
        description={`Deseja desconectar o WhatsApp${confirmDevice?.connectedNumber ? ` ${confirmDevice.connectedNumber}` : ''}? Depois disso, você poderá conectar outra conta.`}
        confirmLabel="Desconectar"
        busy={disconnecting}
        onConfirm={handleConfirmDisconnect}
        onClose={() => {
          if (!disconnecting) {
            setConfirmDevice(null);
          }
        }}
      />
    </>
  );
}
