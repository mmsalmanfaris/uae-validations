import type { ValidationErrorCode } from '../core/types';

export type SupportedLocale = 'en' | 'ar';
export type MessageKey = ValidationErrorCode | 'REQUIRED' | 'INVALID_EMIRATE' | 'INVALID_DATE' | 'TOO_YOUNG';

const MESSAGES: Readonly<Record<SupportedLocale, Readonly<Record<MessageKey, string>>>> = {
  en: {
    INVALID_TYPE: 'The value has an invalid type.',
    INVALID_FORMAT: 'The value has an invalid format.',
    INVALID_LENGTH: 'The value has an invalid length.',
    INVALID_PREFIX: 'The value has an invalid prefix.',
    INVALID_CHECKSUM: 'The checksum is invalid.',
    REQUIRED: 'This field is required.',
    INVALID_EMIRATE: 'Select a recognized UAE emirate.',
    INVALID_DATE: 'Enter a valid Gregorian date.',
    TOO_YOUNG: 'The minimum age requirement is {age}.'
  },
  ar: {
    INVALID_TYPE: 'نوع القيمة غير صالح.',
    INVALID_FORMAT: 'تنسيق القيمة غير صالح.',
    INVALID_LENGTH: 'طول القيمة غير صالح.',
    INVALID_PREFIX: 'بادئة القيمة غير صالحة.',
    INVALID_CHECKSUM: 'رمز التحقق غير صالح.',
    REQUIRED: 'هذا الحقل مطلوب.',
    INVALID_EMIRATE: 'اختر إمارة معترفاً بها في دولة الإمارات.',
    INVALID_DATE: 'أدخل تاريخاً ميلادياً صالحاً.',
    TOO_YOUNG: 'الحد الأدنى للعمر هو {age} سنة.'
  }
};

export function getValidationMessage(key: MessageKey, locale: SupportedLocale = 'en', params: Readonly<Record<string, string | number>> = {}): string {
  return Object.entries(params).reduce((message, [name, value]) => message.replaceAll(`{${name}}`, String(value)), MESSAGES[locale][key]);
}

export const getValidationMessages = (locale: SupportedLocale = 'en'): Readonly<Record<MessageKey, string>> => MESSAGES[locale];
