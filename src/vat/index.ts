/**
 * UAE VAT: the standard rate, registration thresholds, and exact VAT calculations in
 * fils.
 *
 * Import from `uae-validations/vat`, or from the package root.
 *
 * Calculations use whole fils and round half away from zero to the nearest fils. The
 * rate can be overridden (for example `0` for zero-rated supplies) if your system
 * applies it per line.
 *
 * @example
 * ```ts
 * import { calculateVat } from 'uae-validations/vat';
 *
 * calculateVat(100)?.vat; // '5.00'
 * calculateVat(105, { amountIncludesVat: true })?.net; // '100.00'
 * ```
 *
 * @module vat
 */

import type { ReferenceSource } from '../core/types';
import { deepFreeze } from '../core/utils';
import { fromFils } from '../currency/parser';
import { parseAed } from '../currency';

/** Standard UAE VAT rate, in percent. */
export const VAT_STANDARD_RATE = 5;

/** Mandatory VAT registration threshold, in AED, for taxable supplies and imports over 12 months. */
export const VAT_MANDATORY_THRESHOLD = 375_000;

/** Voluntary VAT registration threshold, in AED, for taxable supplies and imports (or taxable expenses) over 12 months. */
export const VAT_VOLUNTARY_THRESHOLD = 187_500;

/** Official sources for the VAT rules implemented in this module. */
export const VAT_SOURCES: readonly ReferenceSource[] = deepFreeze([
  {
    authority: 'Federal Tax Authority (FTA)',
    title: 'Registration for VAT: mandatory (AED 375,000) and voluntary (AED 187,500) thresholds',
    url: 'https://tax.gov.ae/en/taxes/vat/vat.topics/registration.for.vat.aspx',
    lastReviewed: '2026-11-06',
  },
  {
    authority: 'UAE Government',
    title: 'Federal Decree-Law No. 8 of 2017 on Value Added Tax: standard rate of 5%',
    url: 'https://tax.gov.ae/en/legislation.aspx',
    lastReviewed: '2026-11-06',
  },
]);

/** Options for {@link calculateVat}. */
export interface VatOptions {
  /** `true` if the given amount already includes VAT. Default `false`. */
  amountIncludesVat?: boolean;
  /** VAT rate in percent, 0–100 with up to two decimal places. Default {@link VAT_STANDARD_RATE}. */
  ratePercent?: number;
}

/** Result of {@link calculateVat}. Amounts are strings with two decimal places; `*Fils` are exact integers. */
export interface VatBreakdown {
  /** Amount before VAT. */
  net: string;
  /** VAT amount. */
  vat: string;
  /** Amount including VAT. */
  gross: string;
  /** Amount before VAT, in fils. */
  netFils: number;
  /** VAT amount, in fils. */
  vatFils: number;
  /** Amount including VAT, in fils. */
  grossFils: number;
  /** Rate applied, in percent. */
  ratePercent: number;
}

/** Integer division rounding half away from zero. */
function divideRounded(numerator: bigint, denominator: bigint): bigint {
  const negative = numerator < 0n;
  const abs = negative ? -numerator : numerator;
  const rounded = (abs * 2n + denominator) / (denominator * 2n);
  return negative ? -rounded : rounded;
}

/**
 * Calculates VAT on an AED amount, from either the net or the VAT-inclusive amount.
 *
 * @param amount - Amount as a number or string; see `parseAed`. Negative amounts (credit notes) are allowed.
 * @param options - Optional `{ amountIncludesVat, ratePercent }`.
 * @returns The {@link VatBreakdown}, or `null` if the amount or rate is invalid.
 *
 * @example
 * ```ts
 * calculateVat(100)?.gross; // '105.00'
 * calculateVat('AED 1,000', { amountIncludesVat: true })?.vat; // '47.62'
 * calculateVat(0.1)?.vat; // '0.01'
 * calculateVat(100, { ratePercent: 0 })?.vat; // '0.00'
 * calculateVat(100, { ratePercent: 150 }); // null
 * ```
 */
export function calculateVat(amount: unknown, options: VatOptions = {}): VatBreakdown | null {
  const parsed = parseAed(amount, { allowNegative: true });
  const rate = options.ratePercent ?? VAT_STANDARD_RATE;
  if (!parsed || typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0 || rate > 100) {
    return null;
  }
  const basisPoints = Math.round(rate * 100);
  if (Math.abs(rate * 100 - basisPoints) > 1e-6) return null;

  const fils = BigInt(parsed.fils);
  const bp = BigInt(basisPoints);
  let net: bigint;
  let vat: bigint;
  if (options.amountIncludesVat === true) {
    net = divideRounded(fils * 10_000n, 10_000n + bp);
    vat = fils - net;
  } else {
    net = fils;
    vat = divideRounded(fils * bp, 10_000n);
  }
  const netFils = Number(net);
  const vatFils = Number(vat);
  const grossFils = netFils + vatFils;
  return {
    net: fromFils(netFils).amount,
    vat: fromFils(vatFils).amount,
    gross: fromFils(grossFils).amount,
    netFils,
    vatFils,
    grossFils,
    ratePercent: basisPoints / 100,
  };
}

/** VAT registration position for a business, as returned by {@link getVatRegistrationRequirement}. */
export type VatRegistrationRequirement = 'mandatory' | 'voluntary' | 'not-eligible';

/**
 * Compares 12-month taxable supplies and imports with the FTA registration thresholds.
 *
 * This applies to UAE-resident businesses. Non-resident businesses must register
 * whatever their turnover, and businesses expecting to exceed a threshold in the next
 * 30 days are also covered; neither case can be decided from one figure.
 *
 * @param taxableSupplies - Taxable supplies and imports over the previous 12 months, in AED.
 * @returns `'mandatory'` above AED 375,000, `'voluntary'` above AED 187,500, otherwise `'not-eligible'`; `null` for invalid input.
 *
 * @example
 * ```ts
 * getVatRegistrationRequirement(400000); // 'mandatory'
 * getVatRegistrationRequirement('200,000'); // 'voluntary'
 * getVatRegistrationRequirement(187500); // 'not-eligible'
 * ```
 */
export function getVatRegistrationRequirement(
  taxableSupplies: unknown,
): VatRegistrationRequirement | null {
  const parsed = parseAed(taxableSupplies);
  if (!parsed) return null;
  if (parsed.fils > VAT_MANDATORY_THRESHOLD * 100) return 'mandatory';
  if (parsed.fils > VAT_VOLUNTARY_THRESHOLD * 100) return 'voluntary';
  return 'not-eligible';
}
