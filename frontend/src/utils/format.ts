export function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatDisplayDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  return value;
}

const AVERAGE_SEND_DELAY_SECONDS = 15;
const AVERAGE_BATCH_SIZE = 10;
const AVERAGE_BATCH_PAUSE_SECONDS = 120;

export function estimateCampaignDurationSeconds(totalContacts: number) {
  if (totalContacts <= 0) {
    return 0;
  }

  const transitionsBetweenMessages = Math.max(0, totalContacts - 1);
  const averagePauseCount = Math.floor(transitionsBetweenMessages / AVERAGE_BATCH_SIZE);

  return (transitionsBetweenMessages * AVERAGE_SEND_DELAY_SECONDS)
    + (averagePauseCount * AVERAGE_BATCH_PAUSE_SECONDS);
}

export function formatDurationEstimate(totalSeconds: number) {
  if (totalSeconds <= 0) {
    return 'menos de 1 minuto';
  }

  const roundedMinutes = Math.max(1, Math.round(totalSeconds / 60));
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;

  if (hours === 0) {
    return `${roundedMinutes} min`;
  }

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
}

export function estimateCampaignEndDate(startAt: string, totalContacts: number) {
  const startDate = new Date(startAt);
  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  return new Date(startDate.getTime() + (estimateCampaignDurationSeconds(totalContacts) * 1000));
}
