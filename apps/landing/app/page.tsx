import * as m from '@resolvedigital/i18n/messages';
import { Button } from '@resolvedigital/ui';

import { LocaleSwitcher } from './components/locale-switcher';
import { getRequestLocale } from './lib/locale';

export default async function Home() {
  const locale = await getRequestLocale();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold text-primary">{m.hello_world({}, { locale })}</h1>

      <LocaleSwitcher current={locale} />

      <section className="w-full rounded-lg border border-border p-4">
        <h2 className="mb-2 font-semibold">{m.dashboard_title({}, { locale })}</h2>
        <p className="text-sm text-muted-foreground">Ready to build.</p>
      </section>

      <Button variant="default">Shared Button</Button>
    </main>
  );
}
