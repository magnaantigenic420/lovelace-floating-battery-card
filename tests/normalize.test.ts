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

  it.each([
    ['sources', { precision: 1.5 }, 'precision'],
    ['thresholds', { thresholds: [null] }, 'thresholds[0]'],
    ['state_map', { state_map: { case_sensitive: 'yes' } }, 'state_map.case_sensitive'],
    ['icons', { icons: { rotation: Number.POSITIVE_INFINITY } }, 'icons.rotation'],
    ['colors', { colors: { background: { color: 'red' } } }, 'colors.background'],
    ['display', { display: { layout: 'vertical' } }, 'display.layout'],
    ['appearance', { appearance: { opacity: 1.1 } }, 'appearance.opacity'],
    ['ring', { ring: { width: 0 } }, 'ring.width'],
    ['position', { position: { mode: 'fixed' } }, 'position.mode'],
    ['behavior', { behavior: { min_viewport_width: -1 } }, 'behavior.min_viewport_width'],
    ['animation', { animation: { duration: -1 } }, 'animation.duration'],
    ['actions', { tap_action: [] }, 'tap_action'],
  ])('rejects a representative invalid %s configuration', (_section, patch, field) => {
    expect(() =>
      normalizeConfig({ ...minimal, ...patch } as unknown as Parameters<typeof normalizeConfig>[0]),
    ).toThrow(String(field));
  });

  it.each([
    ['state_map', null],
    ['icons', []],
    ['colors', null],
    ['display', []],
    ['appearance', null],
    ['ring', []],
    ['position', null],
    ['behavior', []],
    ['animation', null],
  ])('rejects a null or unexpected %s section shape', (field, value) => {
    expect(() =>
      normalizeConfig({
        ...minimal,
        [field]: value,
      } as unknown as Parameters<typeof normalizeConfig>[0]),
    ).toThrow(`${field} must be an object.`);
  });

  it.each([
    [{ appearance: { transition_duration: -1 } }, 'appearance.transition_duration'],
    [{ animation: { transition_duration: -1 } }, 'animation.transition_duration'],
    [{ behavior: { auto_hide_delay: -1 } }, 'behavior.auto_hide_delay'],
    [{ ring: { inset: -1 } }, 'ring.inset'],
    [{ behavior: { max_viewport_width: Number.NaN } }, 'behavior.max_viewport_width'],
    [
      { behavior: { min_viewport_width: 800, max_viewport_width: 600 } },
      'behavior.max_viewport_width',
    ],
  ])('rejects an out-of-range value at %s', (patch, field) => {
    expect(() =>
      normalizeConfig({ ...minimal, ...patch } as unknown as Parameters<typeof normalizeConfig>[0]),
    ).toThrow(String(field));
  });

  it('accepts CSS dimensions and complete graphical-editor output', () => {
    const config = normalizeConfig({
      ...minimal,
      state_entity: 'sensor.battery_state',
      min_level: 0,
      max_level: 100,
      clamp_level: true,
      invert_level: false,
      precision: 1,
      unit: '%',
      full_threshold: 98,
      thresholds: [{ min: 0, max: 100, color: 'var(--primary-color)', animation: 'pulse' }],
      state_map: {
        case_sensitive: false,
        normalize_whitespace: true,
        charging: ['Charging'],
        not_charging: ['Idle'],
        full: ['Full'],
        unavailable: [],
      },
      icons: { default: 'mdi:battery', dynamic_level: true, size: '2rem', rotation: 0 },
      colors: {
        background: 'var(--ha-card-background)',
        state_overrides_threshold: true,
      },
      display: {
        show_icon: true,
        show_level: true,
        layout: 'horizontal',
        gap: '0.5rem',
        tooltip: 'custom',
        tooltip_text: 'Battery',
      },
      appearance: {
        size: 'calc(4rem + 8px)',
        shape: 'rounded-square',
        padding: 6,
        opacity: 0.9,
        background_opacity: 0.8,
        hover_opacity: 1,
        active_scale: 0.96,
        transition_duration: 160,
      },
      ring: {
        enabled: true,
        width: 4,
        inset: 2,
        color_mode: 'threshold',
        level_mode: 'normalized',
      },
      position: {
        mode: 'viewport',
        anchor: 'bottom-right',
        offset_x: '-0.5rem',
        offset_y: 16,
        edge_margin: 'env(safe-area-inset-right)',
        z_index: 1000,
        safe_area: true,
      },
      behavior: {
        unavailable: 'dim',
        min_viewport_width: 320,
        max_viewport_width: 1600,
        compact_below_width: 500,
        compact_size: '3rem',
        auto_hide_delay: 0,
        pointer_events: true,
      },
      animation: {
        charging: 'breathe',
        low_battery: 'blink',
        hover: 'lift',
        duration: 1200,
        timing_function: 'ease-in-out',
        low_battery_threshold: 15,
        transition_duration: 160,
        respect_reduced_motion: true,
        disabled: false,
      },
      tap_action: {
        action: 'more-info',
        confirmation: { text: 'Open?', exemptions: [{ user: 'abc123' }] },
      },
      hold_action: { action: 'navigate', navigation_path: '/energy' },
      double_tap_action: { action: 'none' },
    });

    expect(config.appearance.size).toBe('calc(4rem + 8px)');
    expect(config.icons.size).toBe('2rem');
    expect(config.position.offset_x).toBe('-0.5rem');
  });
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
