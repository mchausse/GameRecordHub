import { TestBed } from '@angular/core/testing';

import { I18nService, LOCALE_OPTIONS } from './i18n.service';

describe('I18nService', () => {
  beforeEach(() => {
    localStorage.removeItem('game-record-hub-locale');
    TestBed.resetTestingModule();
  });

  afterEach(() => localStorage.removeItem('game-record-hub-locale'));

  it('offers all seven requested locale variants', () => {
    expect(LOCALE_OPTIONS.map(({ value }) => value)).toEqual([
      'en-CA', 'en-US', 'en-GB', 'fr-CA', 'fr-FR', 'es', 'de',
    ]);
  });

  it('normalizes the user-provided UK spelling to en-GB', () => {
    const service = TestBed.inject(I18nService);
    service.setLocale('en-uk');
    expect(service.locale()).toBe('en-GB');
    expect(document.documentElement.lang).toBe('en-GB');
  });

  [
    ['fr-CA', 'Jeux'],
    ['fr-FR', 'Jeux'],
    ['es', 'Juegos'],
    ['de', 'Spiele'],
  ].forEach(([locale, translation]) => {
    it(`translates into ${locale}`, () => {
      const service = TestBed.inject(I18nService);
      service.setLocale(locale);
      expect(service.translate('Games')).toBe(translation);
    });
  });

  it('interpolates dynamic values and falls back to English', () => {
    const service = TestBed.inject(I18nService);
    service.setLocale('fr-FR');
    expect(service.translate('{{count}} players', { count: 4 })).toBe('4 joueurs');
    expect(service.translate('Unknown label')).toBe('Unknown label');
  });

  it('uses the selected regional locale for dates and persists it', () => {
    const service = TestBed.inject(I18nService);
    service.setLocale('de');
    const formatted = service.formatDate(new Date(2026, 0, 2));

    expect(formatted).toContain('02.01.2026');
    expect(localStorage.getItem('game-record-hub-locale')).toBe('de');
  });
});
