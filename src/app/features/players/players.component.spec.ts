import { TestBed } from '@angular/core/testing';

import { GameRecordsService } from '../../core/games/game-records.service';
import { PlayersService } from '../../core/players/players.service';
import { PlayersComponent } from './players.component';

describe('PlayersComponent', () => {
  const player = {
    id: 'ada',
    ownerUid: 'user-1',
    name: 'Ada',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  let players: jasmine.SpyObj<PlayersService>;
  let records: jasmine.SpyObj<GameRecordsService>;

  beforeEach(async () => {
    players = jasmine.createSpyObj<PlayersService>('PlayersService', ['list', 'create', 'rename']);
    records = jasmine.createSpyObj<GameRecordsService>('GameRecordsService', ['history']);
    players.list.and.resolveTo([player]);
    players.create.and.resolveTo('grace');
    players.rename.and.resolveTo();
    records.history.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [PlayersComponent],
      providers: [
        { provide: PlayersService, useValue: players },
        { provide: GameRecordsService, useValue: records },
      ],
    }).compileComponents();
  });

  it('loads saved players and selects the first player', async () => {
    const fixture = TestBed.createComponent(PlayersComponent);
    await fixture.componentInstance.ngOnInit();

    expect(fixture.componentInstance.players()).toEqual([player]);
    expect(fixture.componentInstance.selectedPlayerId()).toBe('ada');
  });

  it('creates and refreshes a player', async () => {
    const fixture = TestBed.createComponent(PlayersComponent);
    const component = fixture.componentInstance;
    component.newPlayerName = 'Grace';
    players.list.and.resolveTo([player, { ...player, id: 'grace', name: 'Grace' }]);

    await component.createPlayer();

    expect(players.create).toHaveBeenCalledWith({ name: 'Grace' });
    expect(component.selectedPlayerId()).toBe('grace');
  });

  it('renames a player and refreshes the draft', async () => {
    const fixture = TestBed.createComponent(PlayersComponent);
    await fixture.componentInstance.ngOnInit();
    fixture.componentInstance.updateDraft('ada', 'Ada Lovelace');
    players.list.and.resolveTo([{ ...player, name: 'Ada Lovelace' }]);

    await fixture.componentInstance.renamePlayer('ada');

    expect(players.rename).toHaveBeenCalledWith('ada', 'Ada Lovelace');
    expect(fixture.componentInstance.draftNames()['ada']).toBe('Ada Lovelace');
  });
});
