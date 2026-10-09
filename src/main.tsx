import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {registerSW} from 'virtual:pwa-register';

// Register PWA service worker
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info('New content available, reload to update.');
  },
  onOfflineReady() {
    console.info('Sattar Auto Finance is cached and ready for offline app shell operation.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
