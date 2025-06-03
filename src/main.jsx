import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TonConnectUIProvider }  from '@tonconnect/ui-react';
import './index.css'; // Global styles, including neumorphic/glassmorphic base

// Ensure manifest is always fetched from the current serving origin
const manifestUrl = new URL('tonconnect-manifest.json', window.location.origin).toString();

// Telegram Mini App return URL - replace with your actual bot username
const telegramBotUsername = 'arix_terminal_tma_bot'; // <<<--- IMPORTANT: REPLACE THIS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      actionsConfiguration={{
         twaReturnUrl: `https://t.me/${telegramBotUsername}/start`
      }}
    >
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>,
);
