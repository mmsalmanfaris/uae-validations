import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'emirates-id/index': 'src/emirates-id/index.ts',
    'phone/index': 'src/phone/index.ts',
    'iban/index': 'src/iban/index.ts',
    'tax/index': 'src/tax/index.ts',
    'administrative/index': 'src/administrative/index.ts',
    'address/index': 'src/address/index.ts',
    'currency/index': 'src/currency/index.ts',
    'privacy/index': 'src/privacy/index.ts',
    'schema/index': 'src/schema/index.ts',
    'i18n/index': 'src/i18n/index.ts',
    'dates/index': 'src/dates/index.ts',
    'metadata/index': 'src/metadata/index.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true
});
