import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('Starting Kumashaurma application...');

const container = document.getElementById('root');
if (!container) {
  console.error('Root element not found!');
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('Application rendered successfully');
