import type { ReferenceSource } from '../core/types';
import { deepFreeze } from '../core/utils';

/** ISO 3166-1 numeric country code for the UAE; every Emirates ID starts with it. */
export const EMIRATES_ID_COUNTRY_CODE = '784';

/** Number of digits in an Emirates ID, excluding separators. */
export const EMIRATES_ID_LENGTH = 15;

/** Earliest year field this package accepts. */
export const EMIRATES_ID_MIN_YEAR = 1900;

/** Official sources for the Emirates ID rules implemented in this module. */
export const EMIRATES_ID_SOURCES: readonly ReferenceSource[] = deepFreeze([
  {
    authority: 'Federal Authority for Identity, Citizenship, Customs and Port Security (ICP)',
    title: 'Briefing on the UAE National ID Card Program',
    url: 'https://icp.gov.ae/wp-content/uploads/2020/10/Breifing-on-The-UAE-National-ID-Card-Program-1.pdf',
    lastReviewed: '2026-11-06',
  },
  {
    authority: 'UAE Design System (TDRA)',
    title: 'Emirates ID input pattern',
    url: 'https://designsystem.gov.ae/docs/patterns/emirates-id-input',
    lastReviewed: '2026-11-06',
  },
]);
