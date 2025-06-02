import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TonConnectUIProvider }  from '@tonconnect/ui-react';
import './index.css';

const manifestUrl = new URL('tonconnect-manifest.json', window.location.origin).toString();


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>,
);
