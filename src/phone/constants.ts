import type { ReferenceSource } from '../core/types';
import { deepFreeze } from '../core/utils';
import type { UaeAreaCodeInfo } from './types';

/** UAE international calling code, without `+`. */
export const UAE_CALLING_CODE = '971';

/**
 * Mobile codes TDRA reports as allocated (`05Z`, with trunk prefix). Listed without
 * operators on purpose: mobile number portability means a prefix does not identify
 * the current operator.
 */
export const UAE_MOBILE_PREFIXES: readonly string[] = deepFreeze([
  '050',
  '052',
  '054',
  '055',
  '056',
  '058',
]);

/** Landline area codes from the TDRA National Numbering Plan, Annex 1, Level 0, section B. */
export const UAE_AREA_CODES: readonly UaeAreaCodeInfo[] = deepFreeze([
  { code: '02', area: 'Abu Dhabi', emirates: ['Abu Dhabi'] },
  { code: '03', area: 'Al Ain', emirates: ['Abu Dhabi'] },
  { code: '04', area: 'Dubai', emirates: ['Dubai'] },
  { code: '06', area: 'West Coast', emirates: ['Sharjah', 'Ajman', 'Umm Al Quwain'] },
  { code: '07', area: 'Ras Al Khaimah', emirates: ['Ras Al Khaimah'] },
  { code: '09', area: 'East Coast', emirates: ['Fujairah'] },
]);

/** Official sources for the phone rules implemented in this module. */
export const PHONE_SOURCES: readonly ReferenceSource[] = deepFreeze([
  {
    authority: 'Telecommunications and Digital Government Regulatory Authority (TDRA)',
    title: 'National Numbering Plan, Version 5.3 (3 June 2015), Annex 1',
    url: 'https://tdra.gov.ae/-/media/About/regulations-and-ruling/EN/National-Number-Plan-pdf.ashx',
    lastReviewed: '2026-11-06',
  },
  {
    authority: 'Telecommunications and Digital Government Regulatory Authority (TDRA), via ITU-T',
    title: 'NNP and MNP presentation, ITU-T workshop, 22 October 2019 (allocated 05Z ranges)',
    url: 'https://www.itu.int/en/ITU-T/Workshops-and-Seminars/bsg/20191022/Documents/Rashed%20Al%20Memari_%20Presentation_NNP_MNP%20Presentation.ppt%20(modified).pdf',
    lastReviewed: '2026-11-06',
  },
]);
