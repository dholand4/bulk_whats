import Lottie from 'lottie-react';
import whatsappLoadingAnimation from '../../assets/Whatsapploading.json';
import { LoadingCard, LoadingOverlay, LoadingText, LoadingTitle } from './styled';

interface GlobalLoadingProps {
  message?: string;
}

export function GlobalLoading({ message }: GlobalLoadingProps) {
  return (
    <LoadingOverlay aria-live="polite" aria-busy="true" role="status">
      <LoadingCard>
        <Lottie
          animationData={whatsappLoadingAnimation}
          autoplay
          loop
          style={{ width: 150, height: 150 }}
        />
        <LoadingTitle>Aguarde</LoadingTitle>
        <LoadingText>{message || 'Aguarde enquanto buscamos as informações.'}</LoadingText>
      </LoadingCard>
    </LoadingOverlay>
  );
}
