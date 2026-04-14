import { useEffect, useRef, useState } from 'react';
import { GlobalLoading } from './components/GlobalLoading';
import { useApp } from './providers/AppProvider';
import { AppRoutes } from './routes';

const MIN_LOADING_DURATION_MS = 2250;

function App() {
  const { globalLoadingMessage, isGlobalLoading } = useApp();
  const [shouldRenderLoading, setShouldRenderLoading] = useState(isGlobalLoading);
  const loadingStartTimeRef = useRef<number | null>(isGlobalLoading ? Date.now() : null);

  useEffect(() => {
    if (isGlobalLoading) {
      loadingStartTimeRef.current = Date.now();
      setShouldRenderLoading(true);
      return;
    }

    const startedAt = loadingStartTimeRef.current;
    const elapsed = startedAt ? Date.now() - startedAt : MIN_LOADING_DURATION_MS;
    const remaining = Math.max(0, MIN_LOADING_DURATION_MS - elapsed);
    const timeoutId = window.setTimeout(() => {
      setShouldRenderLoading(false);
      loadingStartTimeRef.current = null;
    }, remaining);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isGlobalLoading]);

  return (
    <>
      <AppRoutes />
      {shouldRenderLoading ? <GlobalLoading message={globalLoadingMessage} /> : null}
    </>
  );
}

export default App;
