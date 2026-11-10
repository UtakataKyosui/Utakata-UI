import PaletteEditor from '../../packages/docs/site/PaletteEditor.js';

export function PaletteFixture({ locale }: { locale: string }) {
  return (
    <main lang={locale === 'ja' ? 'ja' : 'en'}>
      <h1>Theme palette</h1>
      <PaletteEditor locale={locale === 'ja' ? 'ja' : 'en'} />
    </main>
  );
}
