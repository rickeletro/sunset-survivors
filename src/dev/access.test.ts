import { expect, it } from 'vitest';
import { developerAccess } from './access';
import { developerSelection } from './selection';
it('enables development tools only on loopback addresses in a dev build', () => {
  for (const host of ['localhost', '127.0.0.1', '::1', '[::1]']) {
    expect(developerAccess(true, host)).toBe(true);
    expect(developerAccess(false, host)).toBe(false);
  }
  for (const host of ['', '192.168.1.5', 'example.com', 'localhost.example.com', '127.0.0.1.example.com']) {
    expect(developerAccess(true, host)).toBe(false); expect(developerAccess(false, host)).toBe(false);
  }
});
it('resolves all eight stages, four characters and three difficulties without changing preferences', () => {
  for (let stage = 1; stage <= 8; stage++) for (const hero of ['steve', 'billy', 'bob', 'cormano'] as const) {
    for (const difficulty of ['easy', 'normal', 'hardcore'] as const) expect(developerSelection({ stage, hero, difficulty })).toMatchObject({ stage, hero, difficulty });
  }
  expect(developerSelection({ stage: 99 })).toMatchObject({ stage: 1, hero: 'billy', difficulty: 'normal' });
  expect(developerSelection({ stage: NaN })).toMatchObject({ stage: 1 });
});
