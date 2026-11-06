import type { ReferenceSource } from '../core/types';
import { deepFreeze } from '../core/utils';

/** Length of a UAE IBAN in electronic format. */
export const UAE_IBAN_LENGTH = 23;

/** Official sources for the IBAN rules implemented in this module. */
export const IBAN_SOURCES: readonly ReferenceSource[] = deepFreeze([
  {
    authority: 'Central Bank of the UAE (CBUAE)',
    title: 'IBAN: structure of the UAE IBAN (3-digit bank identifier, 16-digit account number)',
    url: 'https://centralbank.ae/en/our-operations/payments-and-settlements/regulations-and-standards/iban/',
    lastReviewed: '2026-11-06',
  },
  {
    authority: 'SWIFT (ISO 13616 registration authority)',
    title: 'IBAN Registry: United Arab Emirates entry (AE2!n3!n16!n)',
    url: 'https://www.swift.com/standards/data-standards/iban-international-bank-account-number',
    lastReviewed: '2026-11-06',
  },
]);
