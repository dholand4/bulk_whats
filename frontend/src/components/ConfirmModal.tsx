import { DangerButton, GhostButton, InlineActions, PanelHeading } from './AppShell/styled';
import { Lead, ModalCard, ModalOverlay } from './ConfirmModal.styled';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  busy = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!open) {
    return null;
  }

  return (
    <ModalOverlay onClick={busy ? undefined : onClose}>
      <ModalCard onClick={(event) => event.stopPropagation()}>
        <PanelHeading>
          <div>
            <h3 style={{ margin: 0 }}>{title}</h3>
          </div>
        </PanelHeading>

        <Lead>{description}</Lead>

        <InlineActions>
          <DangerButton type="button" onClick={() => void onConfirm()} disabled={busy}>
            {busy ? 'Apagando...' : confirmLabel}
          </DangerButton>
          <GhostButton type="button" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </GhostButton>
        </InlineActions>
      </ModalCard>
    </ModalOverlay>
  );
}
