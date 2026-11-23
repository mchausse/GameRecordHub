import { ENGLISH } from './en';

export type TranslationKey = keyof typeof ENGLISH;
export type TranslationDictionary = Partial<Record<TranslationKey, string>>;
