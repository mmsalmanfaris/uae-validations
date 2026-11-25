import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/emirates-id/index.ts',
    'src/phone/index.ts',
    'src/iban/index.ts',
    'src/tax/index.ts',
    'src/swift/index.ts',
    'src/mrz/index.ts',
    'src/administrative/index.ts',
    'src/currency/index.ts',
    'src/vat/index.ts',
    'src/arabic/index.ts',
    'src/address/index.ts',
    'src/vehicle/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
});
