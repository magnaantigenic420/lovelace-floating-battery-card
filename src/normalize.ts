import {
  DEFAULT_ANIMATION,
  DEFAULT_APPEARANCE,
  DEFAULT_BEHAVIOR,
  DEFAULT_COLORS,
  DEFAULT_DISPLAY,
  DEFAULT_ICONS,
  DEFAULT_POSITION,
  DEFAULT_RING,
  DEFAULT_STATE_MAP,
  DEFAULT_THRESHOLDS,
} from './defaults';
import type {
  FloatingBatteryCardConfig,
  NormalizedFloatingBatteryCardConfig,
  StateMapConfig,
  ThresholdConfig,
} from './types';

const cloneThresholds = (thresholds: ThresholdConfig[]): ThresholdConfig[] =>
  thresholds.map((threshold) => ({ ...threshold }));

const STATE_ARRAY_KEYS = ['charging', 'not_charging', 'full', 'unavailable'] as const;

export function normalizeStateMap(input?: StateMapConfig): Required<StateMapConfig> {
  const normalized: Required<StateMapConfig> = {
    ...DEFAULT_STATE_MAP,
    ...(input ?? {}),
    charging: [...DEFAULT_STATE_MAP.charging],
    not_charging: [...DEFAULT_STATE_MAP.not_charging],
    full: [...DEFAULT_STATE_MAP.full],
    unavailable: [...DEFAULT_STATE_MAP.unavailable],
  };

  for (const key of STATE_ARRAY_KEYS) {
    const values = input?.[key];
    if (values === undefined) continue;
    if (!Array.isArray(values) || values.some((value) => typeof value !== 'string')) {
      throw new Error(`state_map.${key} must be an array of strings.`);
    }
    normalized[key] = [...values];
  }

  return normalized;
}

export function normalizeThresholds(input?: ThresholdConfig[]): ThresholdConfig[] {
  const source = input?.length ? input : DEFAULT_THRESHOLDS;
  const normalized = cloneThresholds(source).map((threshold) => {
    if (!Number.isFinite(Number(threshold.max))) {
      throw new Error('Each threshold requires a finite numeric max value.');
    }
    if (threshold.min !== undefined && !Number.isFinite(Number(threshold.min))) {
      throw new Error('Threshold min must be numeric when provided.');
    }
    const min = threshold.min === undefined ? undefined : Number(threshold.min);
    const max = Number(threshold.max);
    if (min !== undefined && min > max) {
      throw new Error(`Threshold min (${min}) cannot exceed max (${max}).`);
    }
    return { ...threshold, min, max };
  });
  return normalized.sort(
    (a, b) =>
      a.max - b.max || (a.min ?? Number.NEGATIVE_INFINITY) - (b.min ?? Number.NEGATIVE_INFINITY),
  );
}

export function normalizeConfig(config: FloatingBatteryCardConfig): NormalizedFloatingBatteryCardConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('Floating Battery Card requires a configuration object.');
  }
  if (!config.entity || typeof config.entity !== 'string') {
    throw new Error('Floating Battery Card requires an entity.');
  }

  const minLevel = Number.isFinite(Number(config.min_level)) ? Number(config.min_level) : 0;
  const maxLevel = Number.isFinite(Number(config.max_level)) ? Number(config.max_level) : 100;
  if (maxLevel <= minLevel) {
    throw new Error('max_level must be greater than min_level.');
  }

  const size = config.appearance?.size ?? DEFAULT_APPEARANCE.size;
  const explicitWidth = config.appearance?.width;
  const explicitHeight = config.appearance?.height;
  const shape = config.appearance?.shape ?? DEFAULT_APPEARANCE.shape;
  const circleSize = explicitWidth ?? explicitHeight ?? size;

  return {
    ...config,
    type: config.type || 'custom:floating-battery-card',
    min_level: minLevel,
    max_level: maxLevel,
    clamp_level: config.clamp_level ?? true,
    invert_level: config.invert_level ?? false,
    precision: Math.min(4, Math.max(0, Math.trunc(config.precision ?? 0))),
    unit: config.unit ?? '%',
    full_threshold: Number.isFinite(Number(config.full_threshold)) ? Number(config.full_threshold) : 100,
    thresholds: normalizeThresholds(config.thresholds),
    state_map: normalizeStateMap(config.state_map),
    icons: { ...DEFAULT_ICONS, ...(config.icons ?? {}) },
    colors: { ...DEFAULT_COLORS, ...(config.colors ?? {}) },
    display: { ...DEFAULT_DISPLAY, ...(config.display ?? {}) },
    appearance: {
      ...DEFAULT_APPEARANCE,
      ...(config.appearance ?? {}),
      size,
      width: shape === 'circle' ? circleSize : explicitWidth ?? size,
      height: shape === 'circle' ? circleSize : explicitHeight ?? size,
      shape,
      border_radius:
        config.appearance?.border_radius ??
        (shape === 'circle' ? '50%' : shape === 'square' ? 0 : '24%'),
      icon_size: config.appearance?.icon_size ?? config.icons?.size ?? DEFAULT_APPEARANCE.icon_size,
    },
    ring: { ...DEFAULT_RING, ...(config.ring ?? {}) },
    position: { ...DEFAULT_POSITION, ...(config.position ?? {}) },
    behavior: { ...DEFAULT_BEHAVIOR, ...(config.behavior ?? {}) },
    animation: { ...DEFAULT_ANIMATION, ...(config.animation ?? {}) },
    tap_action: config.tap_action ?? { action: 'more-info' },
    hold_action: config.hold_action ?? { action: 'none' },
    double_tap_action: config.double_tap_action ?? { action: 'none' },
  };
}
