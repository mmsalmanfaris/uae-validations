/** Kind of number detected by {@link parseUaePhone}. */
export type UaePhoneType = 'mobile' | 'landline';

/** Options shared by the phone parser, validators, and formatter. */
export interface UaePhoneOptions {
  /**
   * Which mobile codes (`05Z`) to accept. Defaults to `'allocated'`.
   *
   * - `'allocated'`: only `050`, `052`, `054`, `055`, `056`, and `058`, the ranges TDRA reports as allocated.
   * - `'any'`: every `05Z` code the National Numbering Plan reserves for mobile services, so
   *   newly allocated ranges are accepted before this package is updated.
   */
  mobilePrefixes?: 'allocated' | 'any';
}

/** Options for {@link validateUaePhone}. */
export interface ValidateUaePhoneOptions extends UaePhoneOptions {
  /** Require this number type; a valid number of the other type fails with `PHONE_TYPE_MISMATCH`. */
  type?: UaePhoneType;
}

/** A geographic area served by a landline area code. */
export interface UaeAreaCodeInfo {
  /** Area code with trunk prefix, for example `'04'`. */
  code: string;
  /** Area name as given in the TDRA National Numbering Plan, for example `'Dubai'` or `'West Coast'`. */
  area: string;
  /** Emirates the area code covers. */
  emirates: readonly string[];
}

/** Details of a valid UAE phone number, returned by {@link parseUaePhone}. */
export interface UaePhoneInfo {
  /** `'mobile'` or `'landline'`. */
  type: UaePhoneType;
  /** National format with trunk prefix and no separators, for example `'0501234567'`. */
  national: string;
  /** E.164 format, for example `'+971501234567'`. */
  e164: string;
  /** Mobile code or area code without the trunk `0`: `'50'` for mobiles, `'4'` for Dubai landlines. */
  prefix: string;
  /** The 7-digit subscriber number after the prefix. */
  subscriberNumber: string;
  /** Area served, for landlines only; `null` for mobiles. Mobile prefixes do not identify the current operator because numbers can be ported. */
  area: UaeAreaCodeInfo | null;
}

/** Output layout for {@link formatUaePhone}. */
export type UaePhoneFormat = 'national' | 'international' | 'e164' | 'compact' | 'tel';

/** Stable error codes returned by {@link validateUaePhone}. */
export type UaePhoneErrorCode =
  | 'PHONE_REQUIRED'
  | 'PHONE_INVALID_FORMAT'
  | 'PHONE_NOT_UAE'
  | 'PHONE_INVALID_PREFIX'
  | 'PHONE_UNALLOCATED_MOBILE_PREFIX'
  | 'PHONE_INVALID_SUBSCRIBER_NUMBER'
  | 'PHONE_TYPE_MISMATCH';
