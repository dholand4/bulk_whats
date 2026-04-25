import {
  EmptyState,
  Badge,
  Panel,
  PanelGrid,
  PanelHeading,
  SummaryCard,
  SummaryGrid,
  SummaryLabel,
} from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { getCampaignRecipientLabel } from '../../utils/campaigns';
import { formatDateTime } from '../../utils/format';
import { DeviceDetails, PreviewCard, PreviewList, PreviewMeta, StatusValue, SummaryHint } from './styled';

function isDeviceReady(status: string, hasClient?: boolean) {
  return ['connected', 'authenticated'].includes(status) && hasClient !== false;
}

export function HomeView() {
  const { queue, history, devices } = useApp();

  const queuePreview = queue.slice(0, 5);
  const historyPreview = history.slice(0, 5);
  const getDeviceName = (deviceId: string) => devices.find((device) => device.id === deviceId)?.name || deviceId;
  const readyDevices = devices.filter((device) => isDeviceReady(device.status, device.runtime?.hasClient));
  const primaryDevice = readyDevices[0] || devices[0] || null;

  return (
    <>
      <SummaryGrid>
        <SummaryCard>
          <SummaryLabel>Status do dispositivo</SummaryLabel>
          <StatusValue $connected={Boolean(primaryDevice && isDeviceReady(primaryDevice.status, primaryDevice.runtime?.hasClient))}>
            {primaryDevice
              ? isDeviceReady(primaryDevice.status, primaryDevice.runtime?.hasClient)
                ? 'Conectado'
                : 'Desconectado'
              : 'Sem dispositivo'}
          </StatusValue>
          {primaryDevice ? (
            <DeviceDetails>
              <span>ID: {primaryDevice.id}</span>
              <span>Criado em: {formatDateTime(primaryDevice.createdAt)}</span>
              <span>Ultimo status: {primaryDevice.lastKnownStatus || primaryDevice.status || '-'}</span>
              <span>Numero conectado: {primaryDevice.connectedNumber || '-'}</span>
            </DeviceDetails>
          ) : null}
        </SummaryCard>
      </SummaryGrid>

      <PanelGrid>
        <Panel>
          <PanelHeading>
            <h3>Proximos itens da fila</h3>
          </PanelHeading>
          <PreviewList>
            {queuePreview.length ? queuePreview.map((item) => (
              <PreviewCard key={item.id}>
                <strong>{item.campaignName || getCampaignRecipientLabel(item)}</strong>
                <PreviewMeta>
                  {getDeviceName(item.deviceId)} - {formatDateTime(item.scheduleAt)} - {item.status}
                </PreviewMeta>
              </PreviewCard>
            )) : <EmptyState>Nenhum item na fila.</EmptyState>}
          </PreviewList>
        </Panel>

        <Panel>
          <PanelHeading>
            <h3>Historico</h3>
          </PanelHeading>
          <PreviewList>
            {historyPreview.length ? historyPreview.map((item) => (
              <PreviewCard key={item.id}>
                <strong>{item.campaignName || getCampaignRecipientLabel(item)}</strong>
                <PreviewMeta>
                  {getDeviceName(item.deviceId)} - {formatDateTime(item.sentAt || item.updatedAt)} - {item.status}
                </PreviewMeta>
              </PreviewCard>
            )) : <EmptyState>Nenhum envio no historico.</EmptyState>}
          </PreviewList>
        </Panel>
      </PanelGrid>
    </>
  );
}
