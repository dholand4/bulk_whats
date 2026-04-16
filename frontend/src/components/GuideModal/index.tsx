import { GhostButton, PanelHeading } from '../AppShell/styled';
import { CodeExample, GuideContent, ModalCard, Overlay, Step } from './styled';

type GuideModalVariant = 'compose' | 'contacts';

interface GuideModalProps {
  open: boolean;
  onClose: () => void;
  variant: GuideModalVariant;
}

const guideContentByVariant: Record<GuideModalVariant, { title: string; steps: Array<{
  title: string;
  description?: string;
  bullets?: string[];
  code?: string[];
}> }> = {
  compose: {
    title: 'Como montar um envio',
    steps: [
      {
        title: '1. Dê um nome para a campanha',
        bullets: [
          'Preencha o campo Nome da campanha para identificar esse envio depois.',
          'Use nomes simples como lembrete-consulta, cobranca ou convite-evento.',
        ],
      },
      {
        title: '2. Escolha de onde saem os contatos',
        bullets: [
          'Selecione uma ou mais listas em Listas selecionadas para usar os contatos ja cadastrados.',
          'Se precisar, abra Ver contatos para remover pessoas apenas deste envio.',
        ],
      },
      {
        title: '3. Use planilha quando quiser envio temporario',
        description: 'A planilha pode ser .xlsx, .xls ou .csv e deve ter colunas com estes nomes:',
        code: [
          'nome',
          'telefone',
          'paciente',
          'profissional',
          'data',
          'hora',
        ],
        bullets: [
          'Esses contatos entram so neste disparo e nao ficam salvos nas listas.',
        ],
      },
      {
        title: '4. Escreva a mensagem com variaveis',
        description: 'No campo Mensagem, voce pode personalizar o texto com:',
        code: ['{nome}', '{paciente}', '{profissional}', '{data}', '{hora}'],
        bullets: [
          'Exemplo: Ola {nome}, sua consulta com {profissional} esta marcada para {data} as {hora}.',
        ],
      },
      {
        title: '5. Anexe arquivos quando precisar',
        bullets: [
          'Use Arquivos da campanha para enviar imagens, documentos, audios ou videos.',
          'A legenda da mensagem vai no primeiro anexo enviado.',
        ],
      },
      {
        title: '6. Escolha entre agendar ou enviar na hora',
        bullets: [
          'Preencha Agendar para se quiser definir data e hora.',
          'Use Adicionar na fila para deixar programado.',
          'Use Enviar agora para disparar imediatamente com os dados atuais.',
        ],
      },
    ],
  },
  contacts: {
    title: 'Como organizar seus contatos',
    steps: [
      {
        title: '1. Cadastre uma lista',
        bullets: [
          'Clique no botao + para criar uma nova lista.',
          'Dê um nome claro para separar seus grupos, como pacientes-manha ou leads-evento.',
        ],
      },
      {
        title: '2. Adicione contatos manualmente',
        bullets: [
          'Selecione a lista desejada e clique em Novo contato.',
          'Preencha nome, numero WhatsApp e, se quiser, dados como paciente, profissional, data, hora e observacoes.',
        ],
      },
      {
        title: '3. Importe contatos por planilha',
        bullets: [
          'Com a lista aberta, clique em Importar contatos.',
          'Use uma planilha .xlsx, .xls ou .csv com colunas como nome, telefone, paciente, profissional, data, hora e observacoes.',
          'Os contatos importados entram direto na lista selecionada.',
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
          <h3>Guia rapido</h3>
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
