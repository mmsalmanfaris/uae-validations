import { deepFreeze } from '../core/utils';
import type { AedErrorCode } from '../currency/parser';
import type { EmiratesIdErrorCode } from '../emirates-id/types';
import type { UaeIbanErrorCode } from '../iban/types';
import type { MrzErrorCode } from '../mrz/types';
import type { UaePhoneErrorCode } from '../phone/types';
import type { UaeServiceNumberErrorCode } from '../phone/service';
import type { BicErrorCode } from '../swift';
import type { TaxNumberErrorCode } from '../tax';
import type { MakaniErrorCode } from '../address';
import type { DubaiPlateErrorCode } from '../vehicle';
import type { PersonNameErrorCode } from '../arabic';

/** Languages with built-in validation messages: English and Arabic. */
export type ValidationLocale = 'en' | 'ar';

/** One validation message in each supported language. */
export interface ValidationMessages {
  /** English. */
  en: string;
  /** Arabic. */
  ar: string;
}

/** Every error code any validator in this package can return, plus the generic `VALIDATION_FAILED`. */
export type UaeValidationCode =
  | 'VALIDATION_FAILED'
  | EmiratesIdErrorCode
  | UaePhoneErrorCode
  | UaeServiceNumberErrorCode
  | UaeIbanErrorCode
  | TaxNumberErrorCode
  | BicErrorCode
  | MrzErrorCode
  | 'EMIRATE_REQUIRED'
  | 'EMIRATE_UNKNOWN'
  | MakaniErrorCode
  | DubaiPlateErrorCode
  | AedErrorCode
  | PersonNameErrorCode;

/**
 * English and Arabic messages for every validation code. English messages match what the
 * validators return, except where a validator puts a value in its message (such as a year
 * range or a length limit); those entries are general.
 */
export const VALIDATION_MESSAGES: Readonly<
  Record<UaeValidationCode, Readonly<ValidationMessages>>
> = deepFreeze({
  VALIDATION_FAILED: { en: 'Validation failed.', ar: 'فشل التحقق من صحة القيمة.' },

  EMIRATES_ID_REQUIRED: { en: 'Emirates ID is required.', ar: 'رقم الهوية الإماراتية مطلوب.' },
  EMIRATES_ID_INVALID_FORMAT: {
    en: 'Emirates ID must be 15 digits, written as 784-YYYY-NNNNNNN-C or without separators.',
    ar: 'يجب أن يتكون رقم الهوية الإماراتية من 15 رقماً، بالصيغة 784-YYYY-NNNNNNN-C أو بدون فواصل.',
  },
  EMIRATES_ID_INVALID_COUNTRY_CODE: {
    en: 'Emirates ID must start with 784.',
    ar: 'يجب أن يبدأ رقم الهوية الإماراتية بالرقم 784.',
  },
  EMIRATES_ID_INVALID_YEAR: {
    en: 'Emirates ID year is not valid.',
    ar: 'السنة في رقم الهوية الإماراتية غير صالحة.',
  },
  EMIRATES_ID_CHECKSUM_MISMATCH: {
    en: 'Emirates ID check digit does not match.',
    ar: 'رقم التحقق في رقم الهوية الإماراتية غير مطابق.',
  },

  PHONE_REQUIRED: { en: 'Phone number is required.', ar: 'رقم الهاتف مطلوب.' },
  PHONE_INVALID_FORMAT: {
    en: 'Phone number must be a UAE mobile (05X XXX XXXX) or landline (0X XXX XXXX).',
    ar: 'يجب أن يكون رقم الهاتف رقم هاتف متحرك إماراتياً (05X XXX XXXX) أو رقماً أرضياً (0X XXX XXXX).',
  },
  PHONE_NOT_UAE: {
    en: 'Phone number must use the UAE country code +971.',
    ar: 'يجب أن يستخدم رقم الهاتف رمز دولة الإمارات +971.',
  },
  PHONE_INVALID_PREFIX: {
    en: 'Phone number does not start with a UAE mobile or area code.',
    ar: 'لا يبدأ رقم الهاتف برمز هاتف متحرك أو رمز منطقة في دولة الإمارات.',
  },
  PHONE_UNALLOCATED_MOBILE_PREFIX: {
    en: 'Mobile prefix is not an allocated UAE mobile range.',
    ar: 'بادئة الهاتف المتحرك ليست ضمن النطاقات المخصصة في دولة الإمارات.',
  },
  PHONE_INVALID_SUBSCRIBER_NUMBER: {
    en: 'Landline number is not in a valid subscriber range.',
    ar: 'رقم الهاتف الأرضي ليس ضمن نطاق مشتركين صالح.',
  },
  PHONE_TYPE_MISMATCH: {
    en: 'Phone number is not the expected type.',
    ar: 'نوع رقم الهاتف لا يطابق النوع المطلوب.',
  },

  SERVICE_NUMBER_REQUIRED: { en: 'Service number is required.', ar: 'رقم الخدمة مطلوب.' },
  SERVICE_NUMBER_INVALID_FORMAT: {
    en: 'Service number must contain only digits and separators.',
    ar: 'يجب أن يحتوي رقم الخدمة على أرقام وفواصل فقط.',
  },
  SERVICE_NUMBER_NOT_UAE: {
    en: 'Service number must use the UAE country code +971.',
    ar: 'يجب أن يستخدم رقم الخدمة رمز دولة الإمارات +971.',
  },
  SERVICE_NUMBER_INVALID_PREFIX: {
    en: 'Service number must start with 400, 600, 700, 800, or 900.',
    ar: 'يجب أن يبدأ رقم الخدمة بـ 400 أو 600 أو 700 أو 800 أو 900.',
  },
  SERVICE_NUMBER_INVALID_LENGTH: {
    en: 'Service number has the wrong number of digits.',
    ar: 'عدد أرقام رقم الخدمة غير صحيح.',
  },
  SERVICE_NUMBER_RESERVED_RANGE: {
    en: 'Service number is in a range reserved for future use.',
    ar: 'رقم الخدمة ضمن نطاق محجوز للاستخدام المستقبلي.',
  },
  SERVICE_NUMBER_TYPE_MISMATCH: {
    en: 'Service number is not the expected type.',
    ar: 'نوع رقم الخدمة لا يطابق النوع المطلوب.',
  },

  IBAN_REQUIRED: { en: 'IBAN is required.', ar: 'رقم الحساب المصرفي الدولي (IBAN) مطلوب.' },
  IBAN_INVALID_FORMAT: {
    en: 'UAE IBAN must be AE followed by 21 digits.',
    ar: 'يجب أن يتكون رقم IBAN الإماراتي من AE يليها 21 رقماً.',
  },
  IBAN_NOT_UAE: {
    en: 'IBAN must be a UAE IBAN starting with AE.',
    ar: 'يجب أن يكون رقم IBAN إماراتياً يبدأ بـ AE.',
  },
  IBAN_INVALID_LENGTH: {
    en: 'UAE IBAN must be 23 characters long.',
    ar: 'يجب أن يتكون رقم IBAN الإماراتي من 23 خانة.',
  },
  IBAN_CHECKSUM_MISMATCH: {
    en: 'IBAN check digits do not match.',
    ar: 'رقما التحقق في رقم IBAN غير مطابقين.',
  },

  TRN_REQUIRED: { en: 'TRN is required.', ar: 'رقم التسجيل الضريبي مطلوب.' },
  TRN_INVALID_FORMAT: {
    en: 'TRN must contain only digits, spaces, or hyphens.',
    ar: 'يجب أن يحتوي رقم التسجيل الضريبي على أرقام أو مسافات أو شرطات فقط.',
  },
  TRN_INVALID_LENGTH: {
    en: 'TRN must be 15 digits.',
    ar: 'يجب أن يتكون رقم التسجيل الضريبي من 15 رقماً.',
  },
  TIN_REQUIRED: { en: 'TIN is required.', ar: 'رقم التعريف الضريبي مطلوب.' },
  TIN_INVALID_FORMAT: {
    en: 'TIN must contain only digits, spaces, or hyphens.',
    ar: 'يجب أن يحتوي رقم التعريف الضريبي على أرقام أو مسافات أو شرطات فقط.',
  },
  TIN_INVALID_LENGTH: {
    en: 'TIN must be 10 digits.',
    ar: 'يجب أن يتكون رقم التعريف الضريبي من 10 أرقام.',
  },

  BIC_REQUIRED: { en: 'BIC is required.', ar: 'رمز التعريف المصرفي (BIC) مطلوب.' },
  BIC_INVALID_FORMAT: {
    en: 'BIC must be 8 or 11 characters: AAAA BB CC (DDD).',
    ar: 'يجب أن يتكون رمز BIC من 8 أو 11 خانة: AAAA BB CC (DDD).',
  },
  BIC_NOT_UAE: {
    en: 'BIC must have the UAE country code AE.',
    ar: 'يجب أن يحتوي رمز BIC على رمز دولة الإمارات AE.',
  },

  MRZ_REQUIRED: { en: 'MRZ is required.', ar: 'منطقة القراءة الآلية (MRZ) مطلوبة.' },
  MRZ_INVALID_FORMAT: {
    en: 'MRZ must be 3 lines of 30, or 2 lines of 36 or 44, characters A-Z, 0-9, and <.',
    ar: 'يجب أن تتكون منطقة القراءة الآلية من 3 أسطر من 30 حرفاً، أو سطرين من 36 أو 44 حرفاً، من الأحرف A-Z والأرقام 0-9 والرمز <.',
  },
  MRZ_INVALID_DATE: {
    en: 'MRZ contains an impossible date.',
    ar: 'تحتوي منطقة القراءة الآلية على تاريخ غير ممكن.',
  },
  MRZ_CHECK_DIGIT_MISMATCH: {
    en: 'An MRZ check digit does not match.',
    ar: 'أحد أرقام التحقق في منطقة القراءة الآلية غير مطابق.',
  },

  EMIRATE_REQUIRED: { en: 'Emirate is required.', ar: 'الإمارة مطلوبة.' },
  EMIRATE_UNKNOWN: {
    en: 'Emirate is not one of the seven UAE emirates.',
    ar: 'القيمة ليست إحدى إمارات الدولة السبع.',
  },

  MAKANI_REQUIRED: { en: 'Makani number is required.', ar: 'رقم مكاني مطلوب.' },
  MAKANI_INVALID_FORMAT: {
    en: 'Makani number must be a string of digits, optionally grouped with spaces or hyphens.',
    ar: 'يجب أن يتكون رقم مكاني من أرقام فقط، ويمكن تجميعها بمسافات أو شرطات.',
  },
  MAKANI_INVALID_LENGTH: {
    en: 'Makani number must be 10 digits.',
    ar: 'يجب أن يتكون رقم مكاني من 10 أرقام.',
  },

  PLATE_REQUIRED: { en: 'Plate number is required.', ar: 'رقم اللوحة مطلوب.' },
  PLATE_INVALID_FORMAT: {
    en: 'Plate must be a letter code followed by a number.',
    ar: 'يجب أن تتكون اللوحة من رمز بالأحرف يليه رقم.',
  },
  PLATE_INVALID_CODE: {
    en: 'Plate code must be one letter or a doubled letter such as AA.',
    ar: 'يجب أن يتكون رمز اللوحة من حرف واحد أو حرف مكرر مثل AA.',
  },
  PLATE_INVALID_NUMBER: {
    en: 'Plate number must be one to five digits and must not start with 0.',
    ar: 'يجب أن يتكون رقم اللوحة من رقم واحد إلى خمسة أرقام، وألا يبدأ بالصفر.',
  },

  AED_REQUIRED: { en: 'Amount is required.', ar: 'المبلغ مطلوب.' },
  AED_INVALID_FORMAT: {
    en: 'Amount must be a number such as 1234.50 or 1,234.50.',
    ar: 'يجب أن يكون المبلغ رقماً مثل 1234.50 أو 1,234.50.',
  },
  AED_TOO_MANY_DECIMALS: {
    en: 'Amount can have at most 2 decimal places (fils).',
    ar: 'لا يمكن أن يحتوي المبلغ على أكثر من منزلتين عشريتين (فلس).',
  },
  AED_NEGATIVE: { en: 'Amount cannot be negative.', ar: 'لا يمكن أن يكون المبلغ سالباً.' },
  AED_TOO_LARGE: { en: 'Amount is too large.', ar: 'المبلغ كبير جداً.' },

  NAME_REQUIRED: { en: 'Name is required.', ar: 'الاسم مطلوب.' },
  NAME_TOO_SHORT: { en: 'Name is too short.', ar: 'الاسم قصير جداً.' },
  NAME_TOO_LONG: { en: 'Name is too long.', ar: 'الاسم طويل جداً.' },
  NAME_INVALID_CHARACTERS: {
    en: 'Name contains characters that are not allowed.',
    ar: 'يحتوي الاسم على أحرف غير مسموح بها.',
  },
  NAME_MIXED_SCRIPTS: {
    en: 'Name must use one script, Arabic or Latin.',
    ar: 'يجب أن يُكتب الاسم بخط واحد، عربي أو لاتيني.',
  },
});
