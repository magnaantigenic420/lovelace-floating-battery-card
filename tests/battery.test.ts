import { describe, expect, it } from 'vitest';
import type { HomeAssistant } from 'custom-card-helpers';
import type { HassEntity } from 'home-assistant-js-websocket';

import {
  getBatterySnapshot,
  mapSemanticState,
  normalizeLevel,
  parseNumericState,
  selectIcon,
  selectThreshold,
} from '../src/battery';
import { normalizeConfig } from '../src/normalize';
import type { FloatingBatteryCardConfig } from '../src/types';

const config = normalizeConfig({
  type: 'custom:floating-battery-card',
  entity: 'sensor.battery',
});

function entity(entityId: string, state: string): HassEntity {
  return {
    entity_id: entityId,
    state,
    attributes: {},
    context: { id: '', parent_id: null, user_id: null },
    last_changed: '',
    last_updated: '',
  };
}

function hassWithState(state: string): HomeAssistant {
  return {
    states: {
      'sensor.battery': entity('sensor.battery', '50'),
      'sensor.battery_state': entity('sensor.battery_state', state),
    },
  } as unknown as HomeAssistant;
}

function snapshotAt(
  level: number,
  precision: number,
  overrides: Partial<FloatingBatteryCardConfig> = {},
) {
  const snapshotConfig = normalizeConfig({
    type: 'custom:floating-battery-card',
    entity: 'sensor.battery',
    precision,
    ...overrides,
  });
  const hass = {
    states: { 'sensor.battery': entity('sensor.battery', String(level)) },
  } as unknown as HomeAssistant;
  return getBatterySnapshot(hass, snapshotConfig);
}

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

  it('treats a default mapped unknown state as unavailable', () => {
    const stateConfig = normalizeConfig({
      type: 'custom:floating-battery-card',
      entity: 'sensor.battery',
      state_entity: 'sensor.battery_state',
    });

    const snapshot = getBatterySnapshot(hassWithState('unknown'), stateConfig);

    expect(snapshot.semanticState).toBe('unavailable');
    expect(snapshot.available).toBe(false);
  });

  it('treats custom unavailable mappings as unavailable', () => {
    const stateConfig = normalizeConfig({
      type: 'custom:floating-battery-card',
      entity: 'sensor.battery',
      state_entity: 'sensor.battery_state',
      state_map: { unavailable: ['offline'] },
    });

    const snapshot = getBatterySnapshot(hassWithState('offline'), stateConfig);

    expect(snapshot.semanticState).toBe('unavailable');
    expect(snapshot.available).toBe(false);
  });

  it('keeps an available unmapped state semantically unknown', () => {
    const stateConfig = normalizeConfig({
      type: 'custom:floating-battery-card',
      entity: 'sensor.battery',
      state_entity: 'sensor.battery_state',
    });

    const snapshot = getBatterySnapshot(hassWithState('idle'), stateConfig);

    expect(snapshot.semanticState).toBe('unknown');
    expect(snapshot.available).toBe(true);
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

  it('uses a matching catch-all threshold for gaps', () => {
    const thresholds = [
      { min: 0, max: 10, color: 'red' },
      { min: 20, max: 40, color: 'orange' },
      { max: 100, color: 'green' },
    ];
    expect(selectThreshold(15, thresholds)?.max).toBe(100);
  });

  it('falls forward to the next upper band when no threshold matches a gap', () => {
    const thresholds = [
      { min: 0, max: 10, color: 'red' },
      { min: 20, max: 40, color: 'orange' },
      { min: 50, max: 100, color: 'green' },
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

describe('display precision', () => {
  it('does not change threshold selection immediately around a boundary', () => {
    const thresholds = [
      { max: 50, color: 'red' },
      { max: 100, color: 'green' },
    ];

    for (const precision of [0, 3]) {
      expect(snapshotAt(49.999, precision, { thresholds }).threshold?.max).toBe(50);
      expect(snapshotAt(50.001, precision, { thresholds }).threshold?.max).toBe(100);
    }
    expect(snapshotAt(49.999, 0, { thresholds }).displayLevel).toBe(50);
    expect(snapshotAt(50.001, 0, { thresholds }).displayLevel).toBe(50);
  });

  it('does not change full-state detection immediately around the cutoff', () => {
    for (const precision of [0, 3]) {
      expect(snapshotAt(49.999, precision, { full_threshold: 50 }).semanticState).toBe('unknown');
      expect(snapshotAt(50.001, precision, { full_threshold: 50 }).semanticState).toBe('full');
    }
    expect(snapshotAt(49.999, 0, { full_threshold: 50 }).displayLevel).toBe(50);
  });

  it('does not let precision change dynamic icon selection', () => {
    const overrides = { icons: { dynamic_level: true } };

    expect(snapshotAt(94.6, 0, overrides).icon).toBe('mdi:battery-90');
    expect(snapshotAt(94.6, 2, overrides).icon).toBe('mdi:battery-90');
  });

  it('still rounds display values and text to the requested precision', () => {
    const whole = snapshotAt(50.456, 0);
    const decimals = snapshotAt(50.456, 2);

    expect(whole.displayLevel).toBe(50);
    expect(whole.levelText).toBe('50');
    expect(decimals.displayLevel).toBe(50.46);
    expect(decimals.levelText).toBe('50.46');
    expect(decimals.normalizedLevel).toBeCloseTo(50.456);
  });
});
