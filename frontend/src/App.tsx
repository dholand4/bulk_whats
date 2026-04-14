import { GlobalLoading } from './components/GlobalLoading';
import { useApp } from './providers/AppProvider';
import { AppRoutes } from './routes';

function App() {
  const { globalLoadingMessage, isGlobalLoading } = useApp();

  return (
    <>
      <AppRoutes />
      {isGlobalLoading ? <GlobalLoading message={globalLoadingMessage} /> : null}
    </>
  );
}

export default App;
