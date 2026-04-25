import { DeviceCardList } from '../../components/DeviceCard';
import { Panel, PanelHeading } from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { DeviceListSection, HeroText } from './styled';

export function DevicesView() {
  const { devices, expandedDeviceId, connectDevice, disconnectDevice } = useApp();

  return (
    <Panel>
      <PanelHeading>
        <h3>Dispositivo do usuário</h3>
      </PanelHeading>
      <HeroText>
        Quando o dispositivo já estiver autenticado, a tela mostra que ele está pronto para enviar. Se ainda precisar
        conectar, o QR Code será exibido para escanear.
      </HeroText>
      <DeviceListSection>
        <DeviceCardList
          devices={devices}
          expandedDeviceId={expandedDeviceId}
          onConnect={(deviceId) => void connectDevice(deviceId)}
          onDisconnect={disconnectDevice}
        />
      </DeviceListSection>
    </Panel>
  );
}
