import { describe, expect, it } from 'vitest';

import { mapSemanticState, normalizeLevel, parseNumericState, selectIcon, selectThreshold } from '../src/battery';
import { normalizeConfig } from '../src/normalize';

const config = normalizeConfig({
  type: 'custom:floating-battery-card',
  entity: 'sensor.battery',
});

describe('parseNumericState', () => {
  it.each([
    ['0', 0],
    ['5', 5],
    ['20%', 20],
    ['21 %', 21],
    ['50.5', 50.5],
    [99, 99],
    ['100', 100],
  ])('parses %p', (input, expected) => {
    expect(parseNumericState(input)).toBe(expected);
  });

  it.each(['', 'unknown', '85 percent', 'abc85', Number.NaN])('rejects %p', (input) => {
    expect(parseNumericState(input)).toBeUndefined();
  });
});

describe('normalizeLevel', () => {
  it('normalizes, clamps and inverts', () => {
    const ranged = normalizeConfig({
      type: 'custom:floating-battery-card',
      entity: 'sensor.battery',
      min_level: 20,
      max_level: 80,
    });
    expect(normalizeLevel(20, ranged)).toBe(0);
    expect(normalizeLevel(50, ranged)).toBe(50);
    expect(normalizeLevel(100, ranged)).toBe(100);

    const inverted = normalizeConfig({
      type: 'custom:floating-battery-card',
      entity: 'sensor.battery',
      invert_level: true,
    });
    expect(normalizeLevel(20, inverted)).toBe(80);
  });
});

describe('state mapping', () => {
  it('matches charging case-insensitively and normalizes whitespace', () => {
    expect(mapSemanticState(' charging ', 50, config)).toBe('charging');
    expect(mapSemanticState('Not   Charging', 50, config)).toBe('not_charging');
    expect(mapSemanticState('FULL', 100, config)).toBe('full');
    expect(mapSemanticState('unavailable', undefined, config)).toBe('unavailable');
  });
});

describe('threshold evaluation', () => {
  it.each([
    [0, 20],
    [20, 20],
    [21, 50],
    [50, 50],
    [51, 100],
    [100, 100],
  ])('selects threshold at %s', (level, expectedMax) => {
    expect(selectThreshold(level, config.thresholds)?.max).toBe(expectedMax);
  });

  it('handles explicit mins and gaps deterministically', () => {
    const thresholds = [
      { min: 0, max: 10, color: 'red' },
      { min: 20, max: 40, color: 'orange' },
      { max: 100, color: 'green' },
    ];
    expect(selectThreshold(15, thresholds)?.max).toBe(40);
  });
});

describe('icon selection', () => {
  it('uses charging, full and dynamic level icons', () => {
    expect(selectIcon('charging', 50, undefined, config)).toBe('mdi:battery-charging');
    expect(selectIcon('full', 100, undefined, config)).toBe('mdi:battery');
    const dynamic = normalizeConfig({
      type: 'custom:floating-battery-card',
      entity: 'sensor.battery',
      icons: { dynamic_level: true },
    });
    expect(selectIcon('not_charging', 53, undefined, dynamic)).toBe('mdi:battery-50');
  });
});
