'use client';

import { locales, setLocale, type Locale } from '@resolvedigital/i18n/runtime';
import { Button } from '@resolvedigital/ui';

/**
 * The landing page had no way to change language at all, so `messages/ru.json`
 * was dead weight. `setLocale` writes the paraglide cookie and reloads, which
 * is what `getRequestLocale()` reads on the next request.
 */
export function LocaleSwitcher({ current }: { current: Locale }) {
  return (
    <div className="flex gap-2" role="group" aria-label="Language">
      {locales.map((locale: Locale) => (
        <Button
          key={locale}
          size="sm"
          variant={locale === current ? 'default' : 'outline'}
          aria-pressed={locale === current}
          onClick={() => {
            setLocale(locale);
          }}
        >
          {locale.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
