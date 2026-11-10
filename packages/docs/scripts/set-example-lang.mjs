import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Blume renders every example frame as <html lang="en">. Examples for the
// default locale (ja) sit at the examples root and English ones under en/, so
// set each frame's document language from its path (WCAG 3.1.1).
const marker = '<html lang="en">';

export function exampleLang(path) {
  return path === 'en' || path.startsWith('en/') ? 'en' : 'ja';
}

export function setHtmlLang(html, lang) {
  if (!html.includes(marker)) {
    throw new Error(`Example frame no longer starts with ${marker}`);
  }
  return html.replace(marker, `<html lang="${lang}">`);
}

export async function setExampleLang(distUrl) {
  const root = new URL('blume-examples/', distUrl);
  const files = (await readdir(root, { recursive: true })).filter((file) =>
    file.endsWith('index.html'),
  );
  if (files.length === 0) throw new Error('No example frames were built');
  for (const file of files) {
    const path = file.replace(/\/?index\.html$/u, '');
    const url = new URL(file, root);
    await writeFile(
      url,
      setHtmlLang(await readFile(url, 'utf8'), exampleLang(path)),
    );
  }
  return files.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const count = await setExampleLang(new URL('../dist/', import.meta.url));
  console.log(`Set the document language of ${count} example frames.`);
}
