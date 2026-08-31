import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App', () => {
  it('offers every configured locale', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'RU' })).toBeInTheDocument();
    });
  });
});
