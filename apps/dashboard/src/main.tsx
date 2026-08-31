import { getLocale } from '@resolvedigital/i18n/runtime';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './index.css';

// index.html ships a static `lang="en"` because it is a single prerendered
// shell. Correct it as soon as the locale is known, otherwise a Russian UI
// keeps announcing itself as English to screen readers and translation tools.
document.documentElement.lang = getLocale();

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
