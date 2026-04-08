import { DeviceCardList } from '../../components/DeviceCard';
import { Panel, PanelHeading } from '../../components/AppShell/styled';
import { useApp } from '../../providers/AppProvider';
import { HeroText } from './styled';

export function DevicesView() {
  const { devices, expandedDeviceId, connectDevice } = useApp();

  return (
    <Panel>
      <PanelHeading>
        <h3>Dispositivo da matricula</h3>
      </PanelHeading>
      <HeroText>
        Clique em conectar para autenticar. Se o dispositivo ja estiver pronto para envio, o sistema avisa; caso
        contrario, exibe o QR Code para escanear.
      </HeroText>
      <div style={{ marginTop: 18 }}>
        <DeviceCardList
          devices={devices}
          expandedDeviceId={expandedDeviceId}
          onConnect={(deviceId) => void connectDevice(deviceId)}
        />
      </div>
    </Panel>
  );
}
