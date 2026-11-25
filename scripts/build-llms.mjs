// Copies llms.txt into the API docs site and builds llms-full.txt (llms.txt + README + changelog),
// so AI tools can fetch the whole documentation in one request. Run after TypeDoc.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const outDir = 'api-docs';
const read = (path) => readFileSync(path, 'utf8').trim();

mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/llms.txt`, `${read('llms.txt')}\n`);
writeFileSync(
  `${outDir}/llms-full.txt`,
  [read('llms.txt'), read('README.md'), read('CHANGELOG.md')].join('\n\n---\n\n') + '\n',
);
console.log(`Wrote ${outDir}/llms.txt and ${outDir}/llms-full.txt`);
