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

  it('handles an empty library and exposes empty selections', async () => {
    players.list.and.resolveTo([]);
    const component = TestBed.createComponent(PlayersComponent).componentInstance;

    await component.ngOnInit();

    expect(component.loading()).toBeFalse();
    expect(component.selectedPlayerId()).toBeNull();
    expect(component.selectedPlayerName()).toBe('');
    expect(component.selectedGames()).toEqual([]);
  });

  it('selects players, updates drafts, and calculates games and results', async () => {
    records.history.and.resolveTo([
      {
        id: 'game-1',
        playerIds: ['ada', null],
        winnerPlayerId: 'ada',
      } as never,
      {
        id: 'game-2',
        playerIds: ['ada', null],
        winnerPlayerId: null,
      } as never,
      {
        id: 'game-3',
        playerIds: ['ada', null],
        winnerPlayerId: 'other',
      } as never,
    ]);
    const component = TestBed.createComponent(PlayersComponent).componentInstance;
    await component.ngOnInit();

    component.selectPlayer('ada');
    component.updateDraft('ada', 'Updated Ada');

    expect(component.stats('ada').gamesPlayed).toBe(3);
    expect(component.selectedGames()).toHaveSize(3);
    expect(component.selectedPlayerName()).toBe('Ada');
    expect(component.draftNames()['ada']).toBe('Updated Ada');
    expect(component.gameResult(component.games()[0], 'ada')).toBe('Won');
    expect(component.gameResult(component.games()[1], 'ada')).toBe('Tied');
    expect(component.gameResult(component.games()[2], 'ada')).toBe('Played');
  });

  it('reports load, create, and rename failures', async () => {
    const component = TestBed.createComponent(PlayersComponent).componentInstance;
    players.list.and.rejectWith(new Error('load failed'));
    await component.ngOnInit();
    expect(component.error()).toContain('Unable to load');

    players.create.and.rejectWith(new Error('custom create error'));
    await component.createPlayer();
    expect(component.error()).toBe('custom create error');
    expect(component.saving()).toBeFalse();

    players.rename.and.rejectWith('failed');
    await component.renamePlayer('ada');
    expect(component.error()).toContain('Unable to rename');
    expect(component.saving()).toBeFalse();
  });
});
