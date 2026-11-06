export { maskEmiratesId } from '../emirates-id';
export { maskUaeIban } from '../iban';
export { maskTrn } from '../tax';

import { parseUaePhone } from '../phone';

export function maskUaePhone(value: unknown): string {
  const parsed = parseUaePhone(value);
  if (!parsed) return '';
  const prefixLength = parsed.type === 'mobile' ? 3 : 2;
  return `${parsed.national.slice(0, prefixLength)} ${'*'.repeat(4)} ${parsed.national.slice(-3)}`;
}
