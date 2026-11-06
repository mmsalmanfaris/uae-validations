import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();
const temporary = mkdtempSync(join(tmpdir(), 'uae-validations-package-'));
const packed = JSON.parse(
  execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary], {
    cwd: root,
    encoding: 'utf8',
  }),
);
const tarball = join(temporary, packed[0].filename);
const consumer = join(temporary, 'consumer');

writeFileSync(join(temporary, 'package.json'), '{}');
mkdirSync(consumer);
writeFileSync(join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
execFileSync(
  'npm',
  ['install', '--ignore-scripts', '--no-package-lock', '--no-audit', '--no-fund', tarball],
  { cwd: consumer, stdio: 'inherit' },
);

const installedPackage = JSON.parse(
  readFileSync(join(consumer, 'node_modules/uae-validations/package.json'), 'utf8'),
);
const codeExports = Object.keys(installedPackage.exports).filter(
  (name) => name !== './package.json',
);
const specifiers = codeExports.map((name) =>
  name === '.' ? 'uae-validations' : `uae-validations${name.slice(1)}`,
);
const esmScript = `for(const s of ${JSON.stringify(specifiers)}){const m=await import(s);if(Object.keys(m).length===0)throw new Error('Empty ESM export: '+s)}`;
writeFileSync(join(consumer, 'runtime.mjs'), esmScript);
execFileSync(process.execPath, ['runtime.mjs'], { cwd: consumer, stdio: 'inherit' });

const cjsScript = `for(const s of ${JSON.stringify(specifiers)}){if(Object.keys(require(s)).length===0)throw new Error('Empty CJS export: '+s)}`;
execFileSync(process.execPath, ['-e', cjsScript], { cwd: consumer, stdio: 'inherit' });

const typeSource = `
import { validateEmiratesId, type ValidationResult } from 'uae-validations';
import { parseEmiratesId, maskEmiratesId, type EmiratesIdInfo } from 'uae-validations/emirates-id';
const result: ValidationResult<EmiratesIdInfo> = validateEmiratesId('784-1990-1234567-6');
if (result.isValid) result.data.year; else result.code;
parseEmiratesId('784199012345676')?.serial; maskEmiratesId('784199012345676');
import { parseUaePhone, formatUaePhone } from 'uae-validations/phone';
parseUaePhone('0501234567')?.e164; formatUaePhone('0501234567', 'e164');
import { parseUaeIban } from 'uae-validations/iban';
import { validateTrn } from 'uae-validations/tax';
import { parseBic } from 'uae-validations/swift';
import { parseMrz, type MrzInfo } from 'uae-validations/mrz';
import { findEmirate, type EmirateId } from 'uae-validations/administrative';
import { parseAed, aedToWords } from 'uae-validations/currency';
import { calculateVat } from 'uae-validations/vat';
import { normalizeArabic } from 'uae-validations/arabic';
import { parseMakani } from 'uae-validations/address';
import { parseDubaiPlate, type DubaiPlateInfo } from 'uae-validations/vehicle';
parseUaeIban('AE070331234567890123456')?.bankCode; validateTrn('100123456700003');
parseBic('ABCDAEAD')?.bic11; const mrz: MrzInfo | null = parseMrz([]);
const emirate: EmirateId | undefined = findEmirate('Dubai')?.id;
parseAed('1')?.fils; aedToWords(1, { language: 'ar' }); calculateVat(100)?.vat; normalizeArabic('أ');
parseMakani('3003295320')?.formatted; const plate: DubaiPlateInfo | null = parseDubaiPlate('AA 1');
`;
writeFileSync(join(consumer, 'consumer.mts'), typeSource);
writeFileSync(join(consumer, 'consumer.ts'), typeSource);
const tsc = join(root, 'node_modules/typescript/bin/tsc');
execFileSync(
  process.execPath,
  [
    tsc,
    '--noEmit',
    '--strict',
    '--target',
    'ES2022',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    'consumer.mts',
  ],
  { cwd: consumer, stdio: 'inherit' },
);
execFileSync(
  process.execPath,
  [
    tsc,
    '--noEmit',
    '--strict',
    '--target',
    'ES2022',
    '--module',
    'ESNext',
    '--moduleResolution',
    'Bundler',
    'consumer.ts',
  ],
  { cwd: consumer, stdio: 'inherit' },
);

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}
const declarationMaps = walk(join(consumer, 'node_modules/uae-validations/dist')).filter((name) =>
  name.endsWith('.d.ts.map'),
);
if (declarationMaps.length)
  throw new Error(`Unusable declaration maps shipped: ${declarationMaps.join(', ')}`);
console.log(
  `Packed-package checks passed on Node ${process.version}: ${codeExports.length} ESM/CJS exports, NodeNext and bundler declarations.`,
);
