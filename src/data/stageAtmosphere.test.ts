import { describe, expect, it } from 'vitest';
import { STAGES } from './stages';
import { atmosphereFor, portalPulse, windSway } from './stageAtmosphere';

describe('bounded western ambience', () => {
  it.each(STAGES)('keeps stage $id within a fixed particle budget', stage => {
    const profile = atmosphereFor(stage.theme);
    expect(profile.maxParticles).toBeLessThanOrEqual(36);
    expect(profile.frequency).toBeGreaterThanOrEqual(100);
    expect(profile.alpha).toBeLessThan(0.5);
    if (profile.indoor) expect(profile.wind).toBeLessThan(10);
  });
  it('separates ember lighting from desert dust and bounds wind and portal motion', () => {
    expect(atmosphereFor('burning-town').embers).toBe(true);
    expect(atmosphereFor('canyon').embers).toBe(false);
    for (let t = 0; t < 100000; t += 37) {
      expect(Math.abs(windSway(t, 4000, 4000))).toBeLessThanOrEqual(0.035);
      const pulse = portalPulse(t);
      expect(pulse.alpha).toBeGreaterThanOrEqual(0.16);
      expect(pulse.alpha).toBeLessThanOrEqual(0.32);
      expect(pulse.scale).toBeGreaterThanOrEqual(0.92);
      expect(pulse.scale).toBeLessThanOrEqual(1);
    }
  });
});
