import { Component, inject } from '@angular/core';

import { I18nService } from './i18n.service';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-locale-select',
  imports: [TranslatePipe],
  template: `
    <label class="locale-select">
      <span class="sr-only">{{ 'Language' | translate }}</span>
      <select
        [value]="i18n.locale()"
        (change)="selectLocale($event)"
        [attr.aria-label]="'Language' | translate">
        @for (option of i18n.options; track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
    </label>
  `,
  styles: [`
    :host { display: block; }
    select { max-width: 165px; padding: 7px 9px; border: 1px solid #d2cbc0; border-radius: 9px; background: #fffdf8; color: #425148; cursor: pointer; font: inherit; font-size: .78rem; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
    @media (max-width: 650px) {
      select { width: 112px; max-width: 100%; min-height: 40px; font-size: .72rem; }
    }
  `],
})
export class LocaleSelectComponent {
  readonly i18n = inject(I18nService);

  selectLocale(event: Event): void {
    this.i18n.setLocale((event.target as HTMLSelectElement).value);
  }
}
