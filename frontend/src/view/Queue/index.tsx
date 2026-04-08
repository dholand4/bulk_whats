import { CampaignGroupList } from '../../components/CampaignGroup';
import { Panel, PanelHeading } from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { QueueWrap } from './styled';

export function QueueView() {
  const { queueGroups, devices, cancelQueueItem, cancelCampaign } = useApp();

  function getDeviceName(deviceId: string) {
    return devices.find((device) => device.id === deviceId)?.name || deviceId;
  }

  return (
    <QueueWrap>
      <Panel>
        <PanelHeading>
          <h3>Fila e agendamentos</h3>
        </PanelHeading>
        <CampaignGroupList
          groups={queueGroups}
          getDeviceName={getDeviceName}
          mode="queue"
          onCancelItem={(itemId) => void cancelQueueItem(itemId)}
          onCancelCampaign={(groupKey) => void cancelCampaign(groupKey)}
        />
      </Panel>
    </QueueWrap>
  );
}
