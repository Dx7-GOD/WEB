// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/silkscreen';
import '@fontsource-variable/archivo';
import '@fontsource-variable/inter-tight';
import '@fontsource/jetbrains-mono';
import './index.css';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
