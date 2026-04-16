import { CampaignGroup } from '../../types';
import { buildStatusSummary, formatCampaignStatus } from '../../utils/campaigns';
import { formatDateTime } from '../../utils/format';
import { Badge, FieldLabel, InlineActions, MutedText } from '../AppShell/styled';
import {
  ActionButton,
  ContactMeta,
  ContactRow,
  ContactRows,
  Detail,
  DetailGrid,
  GroupCard,
  GroupEmpty,
  GroupList,
  GroupSummary,
  NoteCard,
  RowHeader,
  SummaryMain,
  SummarySide,
} from './styled';

interface CampaignGroupListProps {
  groups: CampaignGroup[];
  getDeviceName: (deviceId: string) => string;
  mode: 'queue' | 'history';
  onCancelItem?: (itemId: string) => void;
  onCancelCampaign?: (groupKey: string) => void;
}

function formatWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : '';
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function CampaignGroupList({
  groups,
  getDeviceName,
  mode,
  onCancelItem,
  onCancelCampaign,
}: CampaignGroupListProps) {
  if (groups.length === 0) {
    return <GroupEmpty>{mode === 'queue' ? 'Nenhuma campanha na fila.' : 'Sem historico ainda.'}</GroupEmpty>;
  }

  return (
    <GroupList>
      {groups.map((group) => (
        <GroupCard key={group.key}>
          <GroupSummary>
            <SummaryMain>
              <Badge>{group.items.length} {mode === 'queue' ? 'contato(s)' : 'registro(s)'}</Badge>
              <h4 style={{ margin: 0, fontSize: 20 }}>{group.campaignName}</h4>
              <MutedText>
                {getDeviceName(group.deviceId)} |{' '}
                {mode === 'history'
                  ? `ultima atualizacao em ${formatDateTime(group.updatedAt)}`
                  : formatDateTime(group.scheduleAt)}
              </MutedText>
            </SummaryMain>

            <SummarySide>
              {mode === 'queue' ? <span><strong>Intervalo:</strong> {group.delaySeconds}s</span> : null}
              <span><strong>Status:</strong> {buildStatusSummary(group.items)}</span>
              {mode === 'queue' && onCancelCampaign ? (
                <InlineActions>
                  <ActionButton
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onCancelCampaign(group.key);
                    }}
                  >
                    Parar
                  </ActionButton>
                </InlineActions>
              ) : null}
            </SummarySide>
          </GroupSummary>

          <Detail>
            <DetailGrid>
              <NoteCard>
                <FieldLabel>{mode === 'queue' ? 'Mensagem' : 'Mensagem enviada'}</FieldLabel>
                <p>{group.message || 'Sem mensagem registrada.'}</p>
              </NoteCard>

              <NoteCard>
                <FieldLabel>Resumo</FieldLabel>
                <p><strong>Campanha:</strong> {group.campaignName}</p>
                <p><strong>Dispositivo:</strong> {getDeviceName(group.deviceId)}</p>
                <p>
                  <strong>{mode === 'queue' ? 'Agendada para' : 'Atualizado em'}:</strong>{' '}
                  {formatDateTime(mode === 'queue' ? group.scheduleAt : group.updatedAt)}
                </p>
                <p><strong>Intervalo:</strong> {group.delaySeconds} segundos</p>
              </NoteCard>
            </DetailGrid>

            <ContactRows>
              {group.items.map((item) => (
                <ContactRow key={item.id}>
                  <RowHeader>
                    <div>
                      <strong>{item.contactName || 'Contato'}</strong>
                      <MutedText>{formatWhatsAppNumber(item.recipientNumber) || item.recipientNumber}</MutedText>
                    </div>
                    {mode === 'queue' && onCancelItem ? (
                      <ActionButton type="button" onClick={() => onCancelItem(item.id)}>
                        Cancelar
                      </ActionButton>
                    ) : null}
                  </RowHeader>

                  <ContactMeta>
                    <span><strong>Status:</strong> {formatCampaignStatus(item.status)}</span>
                    <span><strong>Agendamento:</strong> {formatDateTime(item.scheduleAt)}</span>
                    <span><strong>ID:</strong> {item.id.slice(0, 8)}</span>
                    {item.errorMessage ? <span><strong>Erro:</strong> {item.errorMessage}</span> : null}
                    {item.paciente ? <span><strong>Paciente:</strong> {item.paciente}</span> : null}
                    {item.data ? <span><strong>Data:</strong> {item.data}</span> : null}
                    {item.hora ? <span><strong>Hora:</strong> {item.hora}</span> : null}
                  </ContactMeta>
                </ContactRow>
              ))}
            </ContactRows>
          </Detail>
        </GroupCard>
      ))}
    </GroupList>
  );
}
