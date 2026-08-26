import * as m from '@resolvedigital/i18n/messages';
import { getLocale, locales, setLocale, type Locale } from '@resolvedigital/i18n/runtime';
import { Button } from '@resolvedigital/ui';

function App() {
  const current = getLocale();

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold text-primary">{m.hello_world()}</h1>
      <p className="text-muted-foreground">{m.dashboard_title()}</p>

      <div className="flex gap-2">
        {locales.map((locale: Locale) => (
          <Button
            key={locale}
            variant={locale === current ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setLocale(locale);
            }}
          >
            {locale.toUpperCase()}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default App;
