import type { FloatingBatteryCardConfig } from './types';

type ConfigRecord = Record<string, unknown>;

const ANCHORS = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'center',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
  'custom',
] as const;
const CHARGING_ANIMATIONS = ['none', 'pulse', 'breathe', 'glow', 'rotate'] as const;
const LOW_BATTERY_ANIMATIONS = ['none', 'pulse', 'blink'] as const;

function isRecord(value: unknown): value is ConfigRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function section(config: ConfigRecord, field: string): ConfigRecord | undefined {
  const value = config[field];
  if (value === undefined) return undefined;
  if (!isRecord(value)) throw new Error(`${field} must be an object.`);
  return value;
}

function assertString(field: string, value: unknown, nonEmpty = false): void {
  if (value === undefined) return;
  if (typeof value !== 'string' || (nonEmpty && !value.trim())) {
    throw new Error(`${field} must be ${nonEmpty ? 'a non-empty string' : 'a string'}.`);
  }
}

function assertBoolean(field: string, value: unknown): void {
  if (value !== undefined && typeof value !== 'boolean') {
    throw new Error(`${field} must be a boolean.`);
  }
}

interface NumberRules {
  min?: number;
  max?: number;
  integer?: boolean;
}

function numberDescription(rules: NumberRules): string {
  if (rules.integer && rules.min !== undefined && rules.max !== undefined) {
    return `an integer from ${rules.min} to ${rules.max}`;
  }
  if (rules.min !== undefined && rules.max !== undefined) {
    return `a finite number from ${rules.min} to ${rules.max}`;
  }
  if (rules.min !== undefined) return `a finite number greater than or equal to ${rules.min}`;
  if (rules.max !== undefined) return `a finite number less than or equal to ${rules.max}`;
  return 'a finite number';
}

function assertNumber(field: string, value: unknown, rules: NumberRules = {}): void {
  if (value === undefined) return;
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    (rules.integer === true && !Number.isInteger(value)) ||
    (rules.min !== undefined && value < rules.min) ||
    (rules.max !== undefined && value > rules.max)
  ) {
    throw new Error(`${field} must be ${numberDescription(rules)}.`);
  }
}

function assertNumericValue(field: string, value: unknown, rules: NumberRules = {}): void {
  if (value === undefined) return;
  const numeric =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : Number.NaN;
  if (
    !Number.isFinite(numeric) ||
    (rules.integer === true && !Number.isInteger(numeric)) ||
    (rules.min !== undefined && numeric < rules.min) ||
    (rules.max !== undefined && numeric > rules.max)
  ) {
    throw new Error(`${field} must be ${numberDescription(rules)}.`);
  }
}

function assertEnum(field: string, value: unknown, allowed: readonly string[]): void {
  if (value !== undefined && (typeof value !== 'string' || !allowed.includes(value))) {
    throw new Error(`${field} must be one of: ${allowed.join(', ')}.`);
  }
}

function assertDimension(
  field: string,
  value: unknown,
  options: { allowEmpty?: boolean; allowNegative?: boolean } = {},
): void {
  if (value === undefined) return;
  const validNumber =
    typeof value === 'number' && Number.isFinite(value) && (options.allowNegative === true || value >= 0);
  const validString = typeof value === 'string' && (options.allowEmpty === true || value.trim().length > 0);
  if (!validNumber && !validString) {
    const range = options.allowNegative === true ? 'finite number' : 'non-negative finite number';
    throw new Error(`${field} must be a ${range} or CSS length string.`);
  }
}

function assertStringFields(sectionValue: ConfigRecord | undefined, prefix: string, fields: string[]): void {
  if (!sectionValue) return;
  for (const field of fields) assertString(`${prefix}.${field}`, sectionValue[field]);
}

function assertBooleanFields(sectionValue: ConfigRecord | undefined, prefix: string, fields: string[]): void {
  if (!sectionValue) return;
  for (const field of fields) assertBoolean(`${prefix}.${field}`, sectionValue[field]);
}

function validateThresholds(value: unknown): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) throw new Error('thresholds must be an array.');
  value.forEach((threshold, index) => {
    const prefix = `thresholds[${index}]`;
    if (!isRecord(threshold)) throw new Error(`${prefix} must be an object.`);
    if (threshold.max === undefined) throw new Error(`${prefix}.max is required.`);
    assertNumericValue(`${prefix}.max`, threshold.max);
    assertNumericValue(`${prefix}.min`, threshold.min);
    for (const field of [
      'color',
      'icon_color',
      'text_color',
      'background_color',
      'border_color',
      'ring_color',
      'icon',
    ]) {
      assertString(`${prefix}.${field}`, threshold[field]);
    }
    assertEnum(`${prefix}.animation`, threshold.animation, [
      ...CHARGING_ANIMATIONS,
      ...LOW_BATTERY_ANIMATIONS,
    ]);
  });
}

function validateStateMap(value: ConfigRecord | undefined): void {
  if (!value) return;
  assertBoolean('state_map.case_sensitive', value.case_sensitive);
  assertBoolean('state_map.normalize_whitespace', value.normalize_whitespace);
}

function validateIcons(value: ConfigRecord | undefined): void {
  assertStringFields(value, 'icons', ['default', 'charging', 'full', 'unavailable']);
  assertBooleanFields(value, 'icons', ['dynamic_level', 'dynamic_charging_level']);
  if (!value) return;
  assertDimension('icons.size', value.size);
  assertNumber('icons.rotation', value.rotation);
}

function validateColors(value: ConfigRecord | undefined): void {
  assertStringFields(value, 'colors', [
    'icon',
    'text',
    'background',
    'border',
    'shadow',
    'charging',
    'full',
    'unavailable',
    'focus_ring',
    'ring_track',
    'ring',
  ]);
  if (value) {
    assertBoolean('colors.state_overrides_threshold', value.state_overrides_threshold);
  }
}

function validateDisplay(value: ConfigRecord | undefined): void {
  assertBooleanFields(value, 'display', ['show_icon', 'show_level', 'show_unit', 'show_name']);
  assertStringFields(value, 'display', [
    'name',
    'unknown_text',
    'unavailable_text',
    'tooltip_text',
    'aria_label',
  ]);
  if (!value) return;
  assertEnum('display.layout', value.layout, ['stacked', 'horizontal', 'overlay']);
  assertDimension('display.gap', value.gap);
  assertEnum('display.tooltip', value.tooltip, ['automatic', 'custom', 'disabled']);
}

function validateAppearance(value: ConfigRecord | undefined): void {
  if (!value) return;
  for (const field of [
    'size',
    'width',
    'height',
    'border_radius',
    'padding',
    'icon_size',
    'text_size',
    'name_size',
    'line_height',
    'border_width',
    'backdrop_blur',
  ]) {
    assertDimension(`appearance.${field}`, value[field]);
  }
  assertDimension('appearance.font_weight', value.font_weight);
  assertEnum('appearance.shape', value.shape, ['circle', 'rounded-square', 'square']);
  assertNumber('appearance.opacity', value.opacity, { min: 0, max: 1 });
  assertNumber('appearance.background_opacity', value.background_opacity, { min: 0, max: 1 });
  assertNumber('appearance.hover_opacity', value.hover_opacity, { min: 0, max: 1 });
  assertNumber('appearance.active_scale', value.active_scale, { min: 0 });
  if (value.active_scale === 0) {
    throw new Error('appearance.active_scale must be greater than 0.');
  }
  assertNumber('appearance.transition_duration', value.transition_duration, { min: 0 });
  assertStringFields(value, 'appearance', ['border_style', 'box_shadow']);
}

function validateRing(value: ConfigRecord | undefined): void {
  assertBooleanFields(value, 'ring', ['enabled', 'clockwise', 'rounded_caps']);
  assertStringFields(value, 'ring', ['track_color', 'color']);
  if (!value) return;
  assertNumber('ring.width', value.width, { min: 1 });
  assertNumber('ring.inset', value.inset, { min: 0 });
  assertEnum('ring.color_mode', value.color_mode, ['fixed', 'threshold']);
  assertNumber('ring.start_angle', value.start_angle);
  assertEnum('ring.level_mode', value.level_mode, ['normalized', 'raw']);
}

function validatePosition(value: ConfigRecord | undefined): void {
  if (!value) return;
  assertEnum('position.mode', value.mode, ['viewport', 'inline']);
  assertEnum('position.anchor', value.anchor, ANCHORS);
  for (const field of ['offset_x', 'offset_y']) {
    assertDimension(`position.${field}`, value[field], { allowNegative: true });
  }
  for (const field of ['top', 'right', 'bottom', 'left']) {
    assertDimension(`position.${field}`, value[field], { allowEmpty: true, allowNegative: true });
  }
  assertNumber('position.z_index', value.z_index);
  assertBoolean('position.safe_area', value.safe_area);
  assertDimension('position.edge_margin', value.edge_margin);
}

function validateBehavior(value: ConfigRecord | undefined): void {
  assertBooleanFields(value, 'behavior', [
    'hide_when_full',
    'hide_when_charging',
    'hide_when_not_charging',
    'pointer_events',
    'restore_on_change',
  ]);
  if (!value) return;
  assertEnum('behavior.unavailable', value.unavailable, ['show', 'dim', 'hide']);
  for (const field of [
    'min_viewport_width',
    'max_viewport_width',
    'compact_below_width',
    'auto_hide_delay',
  ]) {
    assertNumber(`behavior.${field}`, value[field], { min: 0 });
  }
  assertDimension('behavior.compact_size', value.compact_size);
  assertString('behavior.more_info_entity', value.more_info_entity);
  const minimum = value.min_viewport_width;
  const maximum = value.max_viewport_width;
  if (
    typeof minimum === 'number' &&
    minimum > 0 &&
    typeof maximum === 'number' &&
    maximum > 0 &&
    maximum < minimum
  ) {
    throw new Error('behavior.max_viewport_width must be 0 or at least min_viewport_width.');
  }
}

function validateAnimation(value: ConfigRecord | undefined): void {
  assertBooleanFields(value, 'animation', ['respect_reduced_motion', 'disabled']);
  if (!value) return;
  assertEnum('animation.charging', value.charging, CHARGING_ANIMATIONS);
  assertEnum('animation.low_battery', value.low_battery, LOW_BATTERY_ANIMATIONS);
  assertEnum('animation.hover', value.hover, ['none', 'scale', 'lift']);
  assertNumber('animation.duration', value.duration, { min: 0 });
  assertString('animation.timing_function', value.timing_function, true);
  assertNumber('animation.low_battery_threshold', value.low_battery_threshold, {
    min: 0,
    max: 100,
  });
  assertNumber('animation.transition_duration', value.transition_duration, { min: 0 });
}

function validateAction(config: ConfigRecord, field: string): void {
  const action = section(config, field);
  if (!action) return;
  assertString(`${field}.action`, action.action, true);
  if (action.action === undefined) throw new Error(`${field}.action is required.`);
  assertStringFields(action, field, [
    'entity',
    'navigation_path',
    'url_path',
    'service',
    'perform_action',
    'pipeline_id',
  ]);
  assertBoolean(`${field}.navigation_replace`, action.navigation_replace);
  assertBoolean(`${field}.start_listening`, action.start_listening);
  for (const nested of ['service_data', 'data', 'target']) {
    if (action[nested] !== undefined && !isRecord(action[nested])) {
      throw new Error(`${field}.${nested} must be an object.`);
    }
  }
  if (action.confirmation === undefined) return;
  if (!isRecord(action.confirmation)) {
    throw new Error(`${field}.confirmation must be an object.`);
  }
  assertStringFields(action.confirmation, `${field}.confirmation`, [
    'text',
    'title',
    'confirm_text',
    'dismiss_text',
  ]);
  const exemptions = action.confirmation.exemptions;
  if (exemptions === undefined) return;
  if (!Array.isArray(exemptions)) {
    throw new Error(`${field}.confirmation.exemptions must be an array.`);
  }
  exemptions.forEach((exemption, index) => {
    if (!isRecord(exemption)) {
      throw new Error(`${field}.confirmation.exemptions[${index}] must be an object.`);
    }
    assertString(`${field}.confirmation.exemptions[${index}].user`, exemption.user, true);
    if (exemption.user === undefined) {
      throw new Error(`${field}.confirmation.exemptions[${index}].user is required.`);
    }
  });
}

export function validateConfig(config: FloatingBatteryCardConfig): void {
  const root = config as unknown as ConfigRecord;

  assertString('state_entity', root.state_entity);
  assertString('level_attribute', root.level_attribute);
  assertString('state_attribute', root.state_attribute);
  assertNumericValue('min_level', root.min_level);
  assertNumericValue('max_level', root.max_level);
  assertBoolean('clamp_level', root.clamp_level);
  assertBoolean('invert_level', root.invert_level);
  assertNumericValue('precision', root.precision, { min: 0, max: 4, integer: true });
  assertString('unit', root.unit);
  assertNumericValue('full_threshold', root.full_threshold, { min: 0, max: 100 });
  validateThresholds(root.thresholds);

  validateStateMap(section(root, 'state_map'));
  validateIcons(section(root, 'icons'));
  validateColors(section(root, 'colors'));
  validateDisplay(section(root, 'display'));
  validateAppearance(section(root, 'appearance'));
  validateRing(section(root, 'ring'));
  validatePosition(section(root, 'position'));
  validateBehavior(section(root, 'behavior'));
  validateAnimation(section(root, 'animation'));
  validateAction(root, 'tap_action');
  validateAction(root, 'hold_action');
  validateAction(root, 'double_tap_action');
}
