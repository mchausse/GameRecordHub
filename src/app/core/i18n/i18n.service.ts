import { Injectable, signal } from '@angular/core';
import { DE } from './translations/de';
import { ENGLISH } from './translations/en';
import { ES } from './translations/es';
import { FR } from './translations/fr';
import { TranslationDictionary, TranslationKey } from './translations/types';

export type SupportedLocale = 'en-CA' | 'en-US' | 'en-GB' | 'fr-CA' | 'fr-FR' | 'es' | 'de';

export const LOCALE_OPTIONS: ReadonlyArray<{ value: SupportedLocale; label: string }> = [
  { value: 'en-CA', label: 'English (Canada)' },
  { value: 'en-US', label: 'English (United States)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'fr-CA', label: 'Français (Canada)' },
  { value: 'fr-FR', label: 'Français (France)' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
];

const TRANSLATIONS: Record<SupportedLocale, TranslationDictionary> = {
  'en-CA': ENGLISH,
  'en-US': ENGLISH,
  'en-GB': ENGLISH,
  'fr-CA': FR,
  'fr-FR': FR,
  es: ES,
  de: DE,
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly locale = signal<SupportedLocale>(this.initialLocale());
  readonly options = LOCALE_OPTIONS;

  setLocale(locale: string): void {
    const normalized = this.normalizeLocale(locale);
    this.locale.set(normalized);
    localStorage.setItem('game-record-hub-locale', normalized);
    document.documentElement.lang = normalized;
  }

  translate(key: string, params: Record<string, string | number> = {}): string {
    const dictionary = TRANSLATIONS[this.locale()];
    let value = dictionary[key as TranslationKey] ?? ENGLISH[key as TranslationKey] ?? key;
    for (const [name, replacement] of Object.entries(params)) {
      value = value.replaceAll(`{{${name}}}`, String(replacement));
    }
    return value;
  }

  formatDate(value: Date): string {
    return new Intl.DateTimeFormat(this.locale(), { dateStyle: 'medium' }).format(value);
  }

  private initialLocale(): SupportedLocale {
    const saved = localStorage.getItem('game-record-hub-locale');
    const locale = this.normalizeLocale(saved ?? 'en-US');
    document.documentElement.lang = locale;
    return locale;
  }

  private normalizeLocale(locale: string): SupportedLocale {
    const normalized = locale.replace('_', '-').toLowerCase();
    if (normalized === 'en-ca') return 'en-CA';
    if (normalized === 'en-gb' || normalized === 'en-uk') return 'en-GB';
    if (normalized.startsWith('fr-ca')) return 'fr-CA';
    if (normalized.startsWith('fr')) return 'fr-FR';
    if (normalized.startsWith('es')) return 'es';
    if (normalized.startsWith('de')) return 'de';
    return 'en-US';
  }
}
