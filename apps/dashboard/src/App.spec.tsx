import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';

const page = {
  items: [
    { id: 2, name: 'Ada Lovelace', createdAt: '2024-01-02T00:00:00.000Z' },
    { id: 1, name: 'Grace Hopper', createdAt: '2024-01-01T00:00:00.000Z' },
  ],
  total: 2,
  limit: 5,
  offset: 0,
};

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({ ok, status, json: () => Promise.resolve(body) });
}

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchOnce(page));
  });

  it('shows a loading state before the request settles', () => {
    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('renders the users returned by the API', async () => {
    render(<App />);

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('calls the versioned users endpoint with the requested page size', async () => {
    render(<App />);

    await screen.findByText('Ada Lovelace');

    const [url] = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [URL];
    expect(url.toString()).toBe('http://localhost:3001/api/v1/users?limit=5');
  });

  it('shows an empty-state hint instead of a blank list', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({ ...page, items: [], total: 0 }));
    render(<App />);

    expect(await screen.findByText(/No users yet/)).toBeInTheDocument();
  });

  it('surfaces an API failure instead of hanging on the spinner', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({}, false, 503));
    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent('503');
  });

  it('retries after a failure', async () => {
    const failing = mockFetchOnce({}, false, 503);
    vi.stubGlobal('fetch', failing);
    render(<App />);

    await screen.findByRole('alert');

    vi.stubGlobal('fetch', mockFetchOnce(page));
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('offers every configured locale', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'RU' })).toBeInTheDocument();
    });
  });
});
