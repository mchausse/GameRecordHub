import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { GamesComponent } from './games.component';

describe('GamesComponent', () => {
  let fixture: ComponentFixture<GamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamesComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: signal({ displayName: 'Maxime' }) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(GamesComponent);
    fixture.detectChanges();
  });

  it('shows links for all currently supported games', () => {
    const element = fixture.nativeElement as HTMLElement;
    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>('.game-card'));
    expect(links.length).toBe(2);
    expect(links[0].textContent).toContain('Lost Cities');
    expect(links[1].textContent).toContain('Sea Salt & Paper');
    expect(links[1].getAttribute('href')).toContain('/games/sea-salt-paper');
  });
});
