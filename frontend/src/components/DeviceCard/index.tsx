import { Device } from '../../types';
import { formatDateTime } from '../../utils/format';
import { Badge, DangerButton, EmptyState, GhostButton, InlineActions, MutedText } from '../AppShell/styled';
import { ConfirmModal } from '../ConfirmModal';
import { AuthBox, DeviceCardWrap, DeviceGrid, DeviceMeta, QrImage } from './styled';
import { useState } from 'react';

interface DeviceCardListProps {
  devices: Device[];
  expandedDeviceId: string | null;
  onConnect: (deviceId: string) => void;
  onDisconnect: (deviceId: string) => Promise<string>;
}

function isDeviceConnected(device: Device) {
  return ['connected', 'authenticated'].includes(device.status);
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
  if (device.status === 'connected' || device.status === 'authenticated') {
    return 'Dispositivo autenticado e pronto para enviar mensagens.';
  }

  if (device.status === 'qr_ready') {
    return 'QR Code disponivel. Escaneie com o WhatsApp do seu celular.';
  }

  if (device.status === 'pairing_code_ready') {
    return 'Codigo de pareamento disponivel para autenticacao.';
  }

  if (device.runtime?.initializing || device.status === 'initializing') {
    return 'Verificando sessao existente e preparando autenticacao...';
  }

  if (['disconnected', 'auth_failure'].includes(device.status)) {
    return 'Sessao expirada ou desconectada. Clique em conectar e escaneie o QR Code para reconectar.';
  }

  return 'QR Code ainda nao disponivel. Aguarde alguns segundos.';
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

    setDisconnecting(true);

    try {
      await onDisconnect(confirmDevice.id);
      setConfirmDevice(null);
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <>
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
            </InlineActions>

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
        description={`Deseja desconectar o WhatsApp${confirmDevice?.connectedNumber ? ` ${confirmDevice.connectedNumber}` : ''}? Depois disso, voce podera conectar outra conta.`}
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
