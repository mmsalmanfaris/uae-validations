// Gives every API docs page its own meta description and a canonical link. TypeDoc writes the
// same generic description on every page, which search engines and AI tools then show for all
// of them. Run after TypeDoc.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const outDir = 'api-docs';
const { hostedBaseUrl } = JSON.parse(readFileSync('typedoc.json', 'utf8'));
const fallback = JSON.parse(readFileSync('package.json', 'utf8')).description;

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.html') ? [path] : [];
  });

const text = (html) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const attr = (value) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const shorten = (value, max = 160) => {
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
};

/** The first doc paragraph: the TSDoc summary, or the README's opening paragraph on the home page. */
function summary(html) {
  const comment = /class="tsd-comment tsd-typography"><p>([\s\S]*?)<\/p>/.exec(html);
  if (comment) return text(comment[1]);
  for (const match of html.matchAll(/<p>([\s\S]*?)<\/p>/g)) {
    const paragraph = text(match[1]);
    if (paragraph.length > 80) return paragraph;
  }
  return null;
}

/** Search-friendly titles for module pages, which TypeDoc titles with the bare module name. */
const MODULE_TITLES = {
  'emirates-id': 'Emirates ID validation',
  phone: 'UAE phone number validation',
  iban: 'UAE IBAN validation',
  tax: 'UAE TRN and TIN validation',
  swift: 'SWIFT/BIC validation for UAE banks',
  mrz: 'Passport and ID card MRZ parsing (ICAO 9303)',
  administrative: 'UAE emirate names and ISO 3166-2 codes',
  address: 'Makani number validation',
  vehicle: 'Dubai vehicle plate validation',
  currency: 'AED parsing, formatting, and amounts in words',
  vat: 'UAE VAT calculation',
  arabic: 'Arabic text normalization and name validation',
};

let count = 0;
for (const file of walk(outDir)) {
  let html = readFileSync(file, 'utf8');
  const title = text(/<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? '').split(' | ')[0];
  const body = summary(html);
  const isHome = relative(outDir, file) === 'index.html';
  const description = shorten(
    isHome ? (body ?? fallback) : body ? `${title}: ${body}` : `${title}. ${fallback}`,
  );
  html = html.replace(
    /<meta name="description" content="[^"]*"\/>/,
    `<meta name="description" content="${attr(description)}"/>`,
  );
  const moduleName = /^modules[\\/](.+)\.html$/.exec(relative(outDir, file))?.[1];
  const moduleTitle = moduleName && MODULE_TITLES[moduleName];
  if (isHome) {
    html = html.replace(
      /<title>[\s\S]*?<\/title>/,
      '<title>uae-validations: Emirates ID, UAE phone, IBAN, and TRN validation for TypeScript and JavaScript</title>',
    );
  } else if (moduleTitle) {
    html = html.replace(
      /<title>[\s\S]*?<\/title>/,
      `<title>${attr(moduleTitle)} | uae-validations/${moduleName}</title>`,
    );
  }
  if (hostedBaseUrl && !html.includes('rel="canonical"')) {
    const path = relative(outDir, file).split(sep).join('/');
    const url = new URL(path === 'index.html' ? '' : path, hostedBaseUrl).href;
    html = html.replace('</head>', `<link rel="canonical" href="${url}"/></head>`);
  }
  writeFileSync(file, html);
  count += 1;
}
console.log(`Set descriptions and canonical links on ${count} pages in ${outDir}`);
