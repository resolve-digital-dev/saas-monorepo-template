import { locales } from '@resolvedigital/i18n/runtime';
import type * as Runtime from '@resolvedigital/i18n/runtime';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

// `vi.hoisted`, because `vi.mock` is hoisted above every other statement in the
// file - a plain `const setLocale = vi.fn()` above it is still in the temporal
// dead zone when the factory runs.
const { setLocale } = vi.hoisted(() => ({ setLocale: vi.fn() }));

vi.mock('@resolvedigital/i18n/runtime', async (importOriginal) => {
  const actual = await importOriginal<typeof Runtime>();
  return { ...actual, setLocale };
});

const { LocaleSwitcher } = await import('./locale-switcher');

describe('LocaleSwitcher', () => {
  it('renders one button per configured locale', () => {
    render(<LocaleSwitcher current="en" />);

    expect(screen.getAllByRole('button')).toHaveLength(locales.length);
    for (const locale of locales) {
      expect(screen.getByRole('button', { name: locale.toUpperCase() })).toBeInTheDocument();
    }
  });

  it('marks the active locale as pressed', () => {
    render(<LocaleSwitcher current="ru" />);

    expect(screen.getByRole('button', { name: 'RU' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches locale on click, which is what writes the paraglide cookie', async () => {
    render(<LocaleSwitcher current="en" />);

    await userEvent.click(screen.getByRole('button', { name: 'RU' }));

    expect(setLocale).toHaveBeenCalledWith('ru');
  });

  it('is exposed as a labelled group for assistive tech', () => {
    render(<LocaleSwitcher current="en" />);

    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
  });
});
