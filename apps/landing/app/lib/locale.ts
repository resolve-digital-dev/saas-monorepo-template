import { baseLocale, cookieName, isLocale, type Locale } from '@resolvedigital/i18n/runtime';
import { cookies } from 'next/headers';

/**
 * Per-request locale for server components.
 *
 * Paraglide's own `getLocale()` reads an AsyncLocalStorage store that only
 * `paraglideMiddleware` populates - and Next.js middleware runs in a separate
 * execution context from the RSC render, so that store is always empty here.
 * The previous layout called it anyway, which is why `<html lang>` was pinned
 * to "en" and ru.json was unreachable on the landing page no matter what.
 *
 * Reading the cookie explicitly is request-safe: no module-level state, so no
 * chance of one request's locale leaking into another's render.
 */
export async function getRequestLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(cookieName)?.value;
  return isLocale(value) ? value : baseLocale;
}
