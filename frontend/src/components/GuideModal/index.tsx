import { GhostButton, PanelHeading } from '../AppShell/styled';
import { CodeExample, GuideContent, ModalCard, Overlay, Step } from './styled';

interface GuideModalProps {
  open: boolean;
  onClose: () => void;
}

export function GuideModal({ open, onClose }: GuideModalProps) {
  if (!open) {
    return null;
  }

  return (
    <Overlay onClick={onClose}>
      <ModalCard onClick={(event) => event.stopPropagation()}>
        <PanelHeading>
          <h3>Guia rapido</h3>
          <GhostButton type="button" onClick={onClose}>
            Fechar
          </GhostButton>
        </PanelHeading>

        <GuideContent>
          <h3>Como utilizar o sistema de envio</h3>

          <Step>
            <h4>1. Autenticacao</h4>
            <ul>
              <li>Insira sua matricula, senha e clique em Entrar.</li>
              <li>Na aba Dispositivos, conecte a sessao WhatsApp da sua matricula.</li>
              <li>Escaneie o QR Code com o WhatsApp do seu celular.</li>
            </ul>
          </Step>

          <Step>
            <h4>2. Inserir Contatos</h4>
            <p>Use cadastro manual ou planilha. Se ambas forem preenchidas, o texto digitado tera prioridade.</p>
            <div>
              <h5>Opcao A: Colar Texto</h5>
              <CodeExample>
                <code>Nome:Numero;Paciente;Data;Hora</code>
                <code>Ex: Daniel:88997000530;Pedro;05/09/2025;19h</code>
              </CodeExample>
            </div>
            <div>
              <h5>Opcao B: Carregar Planilha</h5>
              <ul>
                <li>Coluna A: Nome do Contato</li>
                <li>Coluna B: Numero do WhatsApp</li>
                <li>Coluna C: Nome do Paciente</li>
                <li>Coluna D: Nome do Profissional</li>
                <li>Coluna E: Data</li>
                <li>Coluna F: Hora</li>
              </ul>
            </div>
          </Step>

          <Step>
            <h4>3. Escrever a Mensagem</h4>
            <p>Personalize usando as variaveis abaixo:</p>
            <CodeExample>
              <code>{'{nome}'}</code>
              <code>{'{paciente}'}</code>
              <code>{'{data}'}</code>
              <code>{'{hora}'}</code>
            </CodeExample>
          </Step>

          <Step>
            <h4>4. Anexar Arquivo</h4>
            <ul>
              <li>Selecione imagens, PDFs e documentos para a campanha.</li>
              <li>A legenda vai no primeiro anexo enviado.</li>
            </ul>
          </Step>

          <Step>
            <h4>5. Enviar</h4>
            <ul>
              <li>Use Adicionar na fila para agendar ou Enviar agora para disparo imediato.</li>
              <li>Acompanhe tudo em Fila e agendamentos e Historico.</li>
            </ul>
          </Step>
        </GuideContent>
      </ModalCard>
    </Overlay>
  );
}
