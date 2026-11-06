import { getEmirate, type Emirate, type EmirateId } from '../administrative';
import { invalid, valid } from '../core/result';
import type { ValidationResult } from '../core/types';

export interface UaeAddressInput {
  readonly recipient?: string;
  readonly poBox?: string | number;
  readonly building?: string;
  readonly street?: string;
  readonly unit?: string;
  readonly city?: string;
  readonly emirate: EmirateId | string;
  readonly phone?: string;
}

export interface ParsedUaeAddress extends Omit<UaeAddressInput, 'emirate' | 'poBox'> {
  readonly emirate: Emirate;
  readonly poBox?: string;
}

export function normalizePoBox(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const input = String(value).trim().replace(/^p\.?\s*o\.?\s*box\s*/i, '').replace(/[\s-]/g, '');
  return /^\d+$/.test(input) ? input : null;
}

export const isValidPoBox = (value: unknown): boolean => normalizePoBox(value) !== null;

export function validateUaeAddress(value: unknown): ValidationResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return invalid('INVALID_TYPE', 'Address must be an object.');
  const address = value as Partial<UaeAddressInput>;
  const emirate = getEmirate(address.emirate);
  if (!emirate) return invalid('INVALID_FORMAT', 'Address must contain a recognized UAE emirate.');
  if (address.poBox !== undefined && !isValidPoBox(address.poBox)) return invalid('INVALID_FORMAT', 'PO Box must contain digits.');
  const hasDeliveryDetail = [address.poBox, address.building, address.street].some((part) => part !== undefined && String(part).trim() !== '');
  if (!hasDeliveryDetail) return invalid('INVALID_FORMAT', 'Address must contain a PO Box, building, or street.');
  return valid(emirate.id);
}

export const isValidUaeAddress = (value: unknown): boolean => validateUaeAddress(value).valid;

export function parseUaeAddress(value: unknown): ParsedUaeAddress | null {
  if (!validateUaeAddress(value).valid) return null;
  const address = value as UaeAddressInput;
  const emirate = getEmirate(address.emirate);
  if (!emirate) return null;
  const { poBox, ...rest } = address;
  if (poBox !== undefined) {
    const normalizedPoBox = normalizePoBox(poBox);
    if (!normalizedPoBox) return null;
    return { ...rest, emirate, poBox: normalizedPoBox };
  }
  return { ...rest, emirate };
}

export function formatUaeAddress(value: unknown): string {
  const address = parseUaeAddress(value);
  if (!address) return '';
  return [
    address.recipient,
    address.poBox ? `P.O. Box ${address.poBox}` : undefined,
    [address.unit, address.building].filter(Boolean).join(', ') || undefined,
    address.street,
    address.city,
    address.emirate.nameEn,
    'United Arab Emirates',
    address.phone
  ].filter((part): part is string => Boolean(part?.trim())).join('\n');
}
