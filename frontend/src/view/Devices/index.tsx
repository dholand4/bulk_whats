import { DeviceCardList } from '../../components/DeviceCard';
import { Panel, PanelHeading } from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { HeroText } from './styled';

export function DevicesView() {
  const { devices, expandedDeviceId, connectDevice, disconnectDevice } = useApp();

  return (
    <Panel>
      <PanelHeading>
        <h3>Dispositivo da matricula</h3>
      </PanelHeading>
      <HeroText>
        Quando o dispositivo ja estiver autenticado, a tela mostra que ele esta pronto para enviar. Se ainda precisar
        conectar, o QR Code sera exibido para escanear.
      </HeroText>
      <div style={{ marginTop: 18 }}>
        <DeviceCardList
          devices={devices}
          expandedDeviceId={expandedDeviceId}
          onConnect={(deviceId) => void connectDevice(deviceId)}
          onDisconnect={disconnectDevice}
        />
      </div>
    </Panel>
  );
}
