import {
  EmptyState,
  Panel,
  PanelGrid,
  PanelHeading,
  SummaryCard,
  SummaryGrid,
  SummaryLabel,
  SummaryValue,
} from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { getCampaignRecipientLabel } from '../../utils/campaigns';
import { formatDateTime } from '../../utils/format';
import { PreviewCard, PreviewList, PreviewMeta } from './styled';

export function HomeView() {
  const { summary, queue, devices } = useApp();

  const queuePreview = queue.slice(0, 5);
  const devicePreview = devices.slice(0, 5);
  const getDeviceName = (deviceId: string) => devices.find((device) => device.id === deviceId)?.name || deviceId;

  return (
    <>
      <SummaryGrid>
        <SummaryCard>
          <SummaryLabel>Dispositivos conectados</SummaryLabel>
          <SummaryValue>{summary?.connectedDevices || 0}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Itens pendentes</SummaryLabel>
          <SummaryValue>{summary?.pendingQueue || 0}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Envios concluidos</SummaryLabel>
          <SummaryValue>{summary?.completedSends || 0}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Falhas recentes</SummaryLabel>
          <SummaryValue>{summary?.recentFailures || 0}</SummaryValue>
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
            <h3>Status dos dispositivos</h3>
          </PanelHeading>
          <PreviewList>
            {devicePreview.length ? devicePreview.map((device) => (
              <PreviewCard key={device.id}>
                <strong>{device.name}</strong>
                <PreviewMeta>{device.status} - {device.connectedNumber || 'Sem numero conectado'}</PreviewMeta>
              </PreviewCard>
            )) : <EmptyState>Nenhum dispositivo cadastrado.</EmptyState>}
          </PreviewList>
        </Panel>
      </PanelGrid>
    </>
  );
}
