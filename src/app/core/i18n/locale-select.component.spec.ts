import { TestBed } from '@angular/core/testing';

import { LocaleSelectComponent } from './locale-select.component';
import { I18nService } from './i18n.service';

describe('LocaleSelectComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LocaleSelectComponent] }).compileComponents();
  });

  afterEach(() => localStorage.removeItem('game-record-hub-locale'));

  it('changes and persists the selected locale', () => {
    localStorage.removeItem('game-record-hub-locale');
    const fixture = TestBed.createComponent(LocaleSelectComponent);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'de';

    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(TestBed.inject(I18nService).locale()).toBe('de');
    expect(localStorage.getItem('game-record-hub-locale')).toBe('de');
    expect(select.getAttribute('aria-label')).toBe('Sprache');
  });
});
