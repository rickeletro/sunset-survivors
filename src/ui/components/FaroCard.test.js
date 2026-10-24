import { expect, it, vi } from 'vitest';
import { drawFaroSuit, faroPips } from './FaroCard';
vi.mock('../layout/pulpSceneKit', () => ({ pulpText: vi.fn() }));
it('draws all four suits without depending on Unicode font coverage', () => {
  for (let suit = 0; suit < 4; suit++) {
    const g = { fillStyle: vi.fn(), fillCircle: vi.fn(), fillTriangle: vi.fn() };
    Object.values(g).forEach(f => f.mockReturnValue(g)); drawFaroSuit(g, suit, 0, 0, 20);
    expect(g.fillStyle).toHaveBeenCalledWith(suit === 1 || suit === 2 ? 0xa51e16 : 0x120b08);
    expect(g.fillTriangle).toHaveBeenCalled();
    expect(g.fillCircle.mock.calls.length).toBe([2, 2, 0, 3][suit]);
  }
});

it('uses traditional pip counts with distinct positions for every numbered card', () => {
  for (let rank = 1; rank <= 10; rank++) {
    const pips = faroPips(rank); expect(pips).toHaveLength(rank);
    expect(new Set(pips.map(p => `${p.x}:${p.y}`)).size).toBe(rank);
  }
  expect(faroPips(3).every(p => p.x === 0)).toBe(true);
  expect(faroPips(13)).toEqual([]);
});
