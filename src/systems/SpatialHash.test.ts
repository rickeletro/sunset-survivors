import { describe, it, expect } from 'vitest';
import { SpatialHash } from './SpatialHash';

describe('SpatialHash System', () => {
  it('encontra entidades apenas dentro do raio consultado', () => {
    const hash = new SpatialHash<{ id: string; sprite: { x: number; y: number } }>(64);
    const items = [
      { id: 'near_1', sprite: { x: 100, y: 100 } },
      { id: 'near_2', sprite: { x: 120, y: 110 } },
      { id: 'far', sprite: { x: 1000, y: 1000 } },
    ];

    hash.rebuild(items);
    const results = hash.query(100, 100, 50);

    const ids = results.map((r) => r.id);
    expect(ids).toContain('near_1');
    expect(ids).toContain('near_2');
    expect(ids).not.toContain('far');
  });

  it('limpa entidades antigas após rebuild', () => {
    const hash = new SpatialHash<{ id: string; sprite: { x: number; y: number } }>(64);
    const oldItems = [{ id: 'old', sprite: { x: 50, y: 50 } }];
    hash.rebuild(oldItems);

    const newItems = [{ id: 'new', sprite: { x: 500, y: 500 } }];
    hash.rebuild(newItems);

    const resultsAtOldPos = hash.query(50, 50, 50);
    expect(resultsAtOldPos).toHaveLength(0);

    const resultsAtNewPos = hash.query(500, 500, 50);
    expect(resultsAtNewPos.map((r) => r.id)).toContain('new');
  });
});
