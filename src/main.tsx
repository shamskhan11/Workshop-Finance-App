import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import './index.css';
import {registerSW} from 'virtual:pwa-register';

// Register PWA service worker safely
try {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.info('New content available, reload to update.');
    },
    onOfflineReady() {
      console.info('Sattar Auto Finance is cached and ready for offline app shell operation.');
    },
  });
} catch (swError) {
  console.warn('Service Worker registration skipped or failed:', swError);
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

