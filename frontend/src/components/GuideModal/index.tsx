import { GhostButton, PanelHeading } from '../AppShell/styled';
import { CodeExample, GuideContent, ModalCard, Overlay, Step } from './styled';

type GuideModalVariant = 'compose' | 'contacts';

interface GuideModalProps {
  open: boolean;
  onClose: () => void;
  variant: GuideModalVariant;
}

const guideContentByVariant: Record<GuideModalVariant, {
  title: string;
  steps: Array<{
    title: string;
    description?: string;
    bullets?: string[];
    code?: string[];
  }>;
}> = {
  compose: {
    title: 'Como montar um envio',
    steps: [
      {
        title: '1. Dê um nome para a campanha',
        bullets: [
          'Preencha o campo Nome da campanha para identificar esse envio depois.',
          'Use nomes simples como lembrete-consulta, cobrança ou convite-evento.',
        ],
      },
      {
        title: '2. Escolha os destinatários',
        bullets: [
          'Selecione uma ou mais listas para usar os contatos já cadastrados.',
          'Se precisar, abra Ver contatos para remover pessoas apenas deste envio.',
          'Na seção de grupos, selecione os grupos do WhatsApp que deseja incluir na campanha.',
        ],
      },
      {
        title: '3. Use planilha quando quiser envio temporário',
        description: 'A planilha pode ser .xlsx, .xls ou .csv e deve ter colunas com estes nomes:',
        code: ['nome', 'telefone', 'paciente', 'profissional', 'data', 'hora'],
        bullets: [
          'Os contatos da planilha entram só neste disparo e não ficam salvos nas listas.',
        ],
      },
      {
        title: '4. Sincronize os grupos antes de enviar',
        bullets: [
          'Use Atualizar grupos para recarregar os grupos existentes na sessão conectada do WhatsApp.',
          'Somente grupos realmente criados no WhatsApp aparecem para seleção.',
        ],
      },
      {
        title: '5. Escreva a mensagem com variáveis',
        description: 'No campo Mensagem, você pode personalizar o texto com:',
        code: ['{nome}', '{paciente}', '{profissional}', '{data}', '{hora}'],
        bullets: [
          'Exemplo: Olá {nome}, sua consulta com {profissional} está marcada para {data} às {hora}.',
        ],
      },
      {
        title: '6. Anexe arquivos quando precisar',
        bullets: [
          'Use Arquivos da campanha para enviar imagens, documentos, áudios ou vídeos.',
          'A legenda da mensagem vai no primeiro anexo enviado.',
        ],
      },
      {
        title: '7. Escolha entre agendar ou enviar na hora',
        bullets: [
          'Preencha Agendar para se quiser definir data e hora.',
          'Use Adicionar na fila para deixar programado.',
          'Use Enviar agora para disparar imediatamente com os dados atuais.',
        ],
      },
    ],
  },
  contacts: {
    title: 'Como organizar contatos e grupos',
    steps: [
      {
        title: '1. Cadastre uma lista',
        bullets: [
          'Clique no botão + para criar uma nova lista.',
          'Dê um nome claro para separar seus grupos, como pacientes-manhã ou leads-evento.',
        ],
      },
      {
        title: '2. Adicione contatos manualmente',
        bullets: [
          'Selecione a lista desejada e clique em Novo contato.',
          'Preencha nome, número do WhatsApp e, se quiser, dados como paciente, profissional, data, hora e observações.',
        ],
      },
      {
        title: '3. Importe contatos por planilha',
        bullets: [
          'Com a lista aberta, clique em Importar contatos.',
          'Use uma planilha .xlsx, .xls ou .csv com colunas como nome, telefone, paciente, profissional, data, hora e observações.',
          'Os contatos importados entram direto na lista selecionada.',
        ],
      },
      {
        title: '4. Crie grupos com os contatos da lista ativa',
        bullets: [
          'Na área Grupos do WhatsApp, selecione a lista que será usada como origem dos participantes.',
          'Se houver contatos marcados na lista, o grupo será criado apenas com eles.',
          'Depois de criar, use Atualizar grupos para sincronizar a lista exibida na tela.',
        ],
      },
    ],
  },
};

export function GuideModal({ open, onClose, variant }: GuideModalProps) {
  if (!open) {
    return null;
  }

  const content = guideContentByVariant[variant];

  return (
    <Overlay onClick={onClose}>
      <ModalCard onClick={(event) => event.stopPropagation()}>
        <PanelHeading>
          <h3>Guia rápido</h3>
          <GhostButton type="button" onClick={onClose}>
            Fechar
          </GhostButton>
        </PanelHeading>

        <GuideContent>
          <h3>{content.title}</h3>

          {content.steps.map((step) => (
            <Step key={step.title}>
              <h4>{step.title}</h4>
              {step.description ? <p>{step.description}</p> : null}
              {step.code?.length ? (
                <CodeExample>
                  {step.code.map((line) => (
                    <code key={line}>{line}</code>
                  ))}
                </CodeExample>
              ) : null}
              {step.bullets?.length ? (
                <ul>
                  {step.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </Step>
          ))}
        </GuideContent>
      </ModalCard>
    </Overlay>
  );
}
