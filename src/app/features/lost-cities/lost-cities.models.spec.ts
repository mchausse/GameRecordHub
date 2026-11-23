import { emptyRound, expeditionsForCount, scoreExpedition } from './lost-cities.models';

describe('Lost Cities expedition scoring', () => {
  it('provides five classic expeditions with white Himalayas', () => {
    const expeditions = expeditionsForCount(5);
    expect(expeditions.map(({ id }) => id)).toEqual(['yellow', 'blue', 'red', 'green', 'white']);
    expect(expeditions.some(({ id }) => id === 'purple')).toBeFalse();
    expect(expeditions.find(({ id }) => id === 'white')?.name).toBe('Himalayas');
  });

  it('adds the purple lane in six-lane mode', () => {
    expect(expeditionsForCount(6).map(({ id }) => id)).toEqual([
      'yellow',
      'blue',
      'red',
      'green',
      'white',
      'purple',
    ]);
  });

  it('creates independent score inputs for every lane and player', () => {
    const round = emptyRound();
    expect(Object.keys(round.player1)).toHaveSize(6);
    expect(Object.keys(round.player2)).toHaveSize(6);
    expect(round.player1.white).not.toBe(round.player1.purple);
    expect(round.player1.white).not.toBe(round.player2.white);
  });

  it('scores an untouched expedition as zero', () => {
    expect(scoreExpedition({ values: [], investments: 0 })).toBe(0);
  });

  it('subtracts the expedition cost from a started expedition', () => {
    expect(scoreExpedition({ values: [2, 5], investments: 0 })).toBe(-13);
  });

  it('applies the investment multiplier to the cost-adjusted total', () => {
    expect(scoreExpedition({ values: [7, 8, 10], investments: 2 })).toBe(15);
  });

  it('applies the eight-card bonus after multiplication', () => {
    expect(scoreExpedition({ values: [2, 3, 4, 5, 6, 7, 8], investments: 1 })).toBe(50);
  });

  it('penalizes investment-only expeditions', () => {
    expect(scoreExpedition({ values: [], investments: 3 })).toBe(-80);
  });
});
