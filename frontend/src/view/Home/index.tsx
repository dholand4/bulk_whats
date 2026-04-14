import {
  EmptyState,
  MutedText,
  Panel,
  PanelGrid,
  PanelHeading,
  SummaryCard,
  SummaryGrid,
  SummaryLabel,
  SummaryValue,
} from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { formatDateTime } from '../../utils/format';
import { PreviewList } from './styled';

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
              <EmptyState key={item.id}>
                <strong>{item.campaignName || item.contactName || item.recipientNumber}</strong>
                <br />
                {getDeviceName(item.deviceId)} - {formatDateTime(item.scheduleAt)} - {item.status}
              </EmptyState>
            )) : <EmptyState>Nenhum item na fila.</EmptyState>}
          </PreviewList>
        </Panel>

        <Panel>
          <PanelHeading>
            <h3>Status dos dispositivos</h3>
          </PanelHeading>
          <PreviewList>
            {devicePreview.length ? devicePreview.map((device) => (
              <EmptyState key={device.id}>
                <strong>{device.name}</strong>
                <br />
                <MutedText>{device.status} - {device.connectedNumber || 'Sem numero conectado'}</MutedText>
              </EmptyState>
            )) : <EmptyState>Nenhum dispositivo cadastrado.</EmptyState>}
          </PreviewList>
        </Panel>
      </PanelGrid>
    </>
  );
}
