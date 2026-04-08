import { CampaignGroupList } from '../../components/CampaignGroup';
import { Panel, PanelHeading } from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { HistoryWrap } from './styled';

export function HistoryView() {
  const { historyGroups, devices } = useApp();

  function getDeviceName(deviceId: string) {
    return devices.find((device) => device.id === deviceId)?.name || deviceId;
  }

  return (
    <HistoryWrap>
      <Panel>
        <PanelHeading>
          <h3>Historico</h3>
        </PanelHeading>
        <CampaignGroupList groups={historyGroups} getDeviceName={getDeviceName} mode="history" />
      </Panel>
    </HistoryWrap>
  );
}
