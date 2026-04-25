import {
  EmptyState,
  Panel,
  PanelGrid,
  PanelHeading,
  SummaryCard,
  SummaryGrid,
  SummaryLabel,
} from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { formatCampaignStatus, getCampaignRecipientLabel } from '../../utils/campaigns';
import { formatDeviceStatus, isDeviceConnectedStatus } from '../../utils/deviceStatus';
import { formatDateTime } from '../../utils/format';
import { DeviceDetails, PreviewCard, PreviewList, PreviewMeta, StatusValue } from './styled';

export function HomeView() {
  const { queue, history, devices } = useApp();

  const queuePreview = queue.slice(0, 5);
  const historyPreview = history.slice(0, 5);
  const getDeviceName = (deviceId: string) => devices.find((device) => device.id === deviceId)?.name || deviceId;
  const readyDevices = devices.filter((device) => isDeviceConnectedStatus(device.status, device.runtime?.hasClient));
  const primaryDevice = readyDevices[0] || devices[0] || null;

  return (
    <>
      <SummaryGrid>
        <SummaryCard>
          <SummaryLabel>Status do dispositivo</SummaryLabel>
          <StatusValue $connected={Boolean(primaryDevice && isDeviceConnectedStatus(primaryDevice.status, primaryDevice.runtime?.hasClient))}>
            {primaryDevice
              ? isDeviceConnectedStatus(primaryDevice.status, primaryDevice.runtime?.hasClient)
                ? 'Conectado'
                : 'Desconectado'
              : 'Sem dispositivo'}
          </StatusValue>
          {primaryDevice ? (
            <DeviceDetails>
              <span>ID: {primaryDevice.id}</span>
              <span>Criado em: {formatDateTime(primaryDevice.createdAt)}</span>
              <span>Último status: {formatDeviceStatus(primaryDevice.lastKnownStatus || primaryDevice.status)}</span>
              <span>Número conectado: {primaryDevice.connectedNumber || '-'}</span>
            </DeviceDetails>
          ) : null}
        </SummaryCard>
      </SummaryGrid>

      <PanelGrid>
        <Panel>
          <PanelHeading>
            <h3>Próximos itens da fila</h3>
          </PanelHeading>
          <PreviewList>
            {queuePreview.length ? queuePreview.map((item) => (
              <PreviewCard key={item.id}>
                <strong>{item.campaignName || getCampaignRecipientLabel(item)}</strong>
                <PreviewMeta>
                  {getDeviceName(item.deviceId)} - {formatDateTime(item.scheduleAt)} - {formatCampaignStatus(item.status)}
                </PreviewMeta>
              </PreviewCard>
            )) : <EmptyState>Nenhum item na fila.</EmptyState>}
          </PreviewList>
        </Panel>

        <Panel>
          <PanelHeading>
            <h3>Histórico</h3>
          </PanelHeading>
          <PreviewList>
            {historyPreview.length ? historyPreview.map((item) => (
              <PreviewCard key={item.id}>
                <strong>{item.campaignName || getCampaignRecipientLabel(item)}</strong>
                <PreviewMeta>
                  {getDeviceName(item.deviceId)} - {formatDateTime(item.sentAt || item.updatedAt)} - {formatCampaignStatus(item.status)}
                </PreviewMeta>
              </PreviewCard>
            )) : <EmptyState>Nenhum envio no histórico.</EmptyState>}
          </PreviewList>
        </Panel>
      </PanelGrid>
    </>
  );
}
