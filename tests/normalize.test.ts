import { describe, expect, it } from 'vitest';

import { normalizeConfig, normalizeThresholds } from '../src/normalize';

const minimal = { type: 'custom:floating-battery-card', entity: 'sensor.battery' } as const;

describe('normalizeConfig', () => {
  it('applies requested defaults', () => {
    const config = normalizeConfig(minimal);
    expect(config.position.anchor).toBe('bottom-right');
    expect(config.position.offset_x).toBe(16);
    expect(config.position.offset_y).toBe(16);
    expect(config.appearance.width).toBe(72);
    expect(config.appearance.height).toBe(72);
    expect(config.thresholds.map((threshold) => threshold.max)).toEqual([20, 50, 100]);
  });

  it('keeps a circle square even with only one dimension override', () => {
    const config = normalizeConfig({ ...minimal, appearance: { shape: 'circle', width: 88 } });
    expect(config.appearance.width).toBe(88);
    expect(config.appearance.height).toBe(88);
  });

  it('allows independent dimensions for non-circular shapes', () => {
    const config = normalizeConfig({
      ...minimal,
      appearance: { shape: 'rounded-square', width: 90, height: 70 },
    });
    expect(config.appearance.width).toBe(90);
    expect(config.appearance.height).toBe(70);
  });

  it('rejects invalid ranges', () => {
    expect(() => normalizeConfig({ ...minimal, min_level: 100, max_level: 100 })).toThrow(/max_level/);
  });

  it('preserves valid and intentionally empty state arrays', () => {
    const config = normalizeConfig({
      ...minimal,
      state_map: {
        charging: ['Charging', 'Powering up'],
        not_charging: [],
        full: ['Full'],
        unavailable: [],
      },
    });

    expect(config.state_map.charging).toEqual(['Charging', 'Powering up']);
    expect(config.state_map.not_charging).toEqual([]);
    expect(config.state_map.full).toEqual(['Full']);
    expect(config.state_map.unavailable).toEqual([]);
  });

  it.each(['charging', 'not_charging', 'full', 'unavailable'] as const)(
    'rejects malformed state_map.%s values during configuration',
    (key) => {
      for (const value of ['Charging', null, ['Charging', 1], [false]]) {
        const config = {
          ...minimal,
          state_map: { [key]: value },
        } as unknown as Parameters<typeof normalizeConfig>[0];

        expect(() => normalizeConfig(config)).toThrow(
          `state_map.${key} must be an array of strings.`,
        );
      }
    },
  );
});

describe('normalizeThresholds', () => {
  it('sorts thresholds by max', () => {
    expect(
      normalizeThresholds([{ max: 100 }, { max: 20 }, { max: 50 }]).map((threshold) => threshold.max),
    ).toEqual([20, 50, 100]);
  });

  it('rejects invalid thresholds', () => {
    expect(() => normalizeThresholds([{ min: 70, max: 20 }])).toThrow(/cannot exceed/);
    expect(() => normalizeThresholds([{ max: Number.NaN }])).toThrow(/finite/);
  });
});
