import type { HassEntity } from 'home-assistant-js-websocket';
import type { HomeAssistant } from 'custom-card-helpers';
import type {
  BatterySemanticState,
  BatterySnapshot,
  NormalizedFloatingBatteryCardConfig,
  ThresholdConfig,
} from './types';

export function parseNumericState(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)\s*%?$/.test(trimmed)) return undefined;
  const parsed = Number.parseFloat(trimmed.replace('%', '').trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readEntityValue(entity: HassEntity | undefined, attribute?: string): unknown {
  if (!entity) return undefined;
  if (attribute) return entity.attributes[attribute];
  return entity.state;
}

export function normalizeLevel(raw: number, config: NormalizedFloatingBatteryCardConfig): number {
  let level = ((raw - config.min_level) / (config.max_level - config.min_level)) * 100;
  if (config.invert_level) level = 100 - level;
  if (config.clamp_level) level = Math.min(100, Math.max(0, level));
  return level;
}

function normalizedStateValue(value: unknown, config: NormalizedFloatingBatteryCardConfig): string {
  const raw = String(value ?? '');
  const whitespace = config.state_map.normalize_whitespace ? raw.trim().replace(/\s+/g, ' ') : raw;
  return config.state_map.case_sensitive ? whitespace : whitespace.toLowerCase();
}

function matchesMappedState(
  value: unknown,
  candidates: string[],
  config: NormalizedFloatingBatteryCardConfig,
): boolean {
  const normalized = normalizedStateValue(value, config);
  return candidates.some((candidate) => normalizedStateValue(candidate, config) === normalized);
}

export function mapSemanticState(
  value: unknown,
  normalizedLevel: number | undefined,
  config: NormalizedFloatingBatteryCardConfig,
): BatterySemanticState {
  if (matchesMappedState(value, config.state_map.unavailable, config)) return 'unavailable';
  if (matchesMappedState(value, config.state_map.charging, config)) return 'charging';
  if (matchesMappedState(value, config.state_map.not_charging, config)) return 'not_charging';
  if (matchesMappedState(value, config.state_map.full, config)) return 'full';
  if ((value === undefined || value === null || String(value).trim() === '') && normalizedLevel !== undefined) {
    return normalizedLevel >= config.full_threshold ? 'full' : 'unknown';
  }
  return 'unknown';
}

export function selectThreshold(
  level: number | undefined,
  thresholds: ThresholdConfig[],
): ThresholdConfig | undefined {
  if (level === undefined || thresholds.length === 0) return undefined;
  const exact = thresholds.find(
    (threshold) => level <= threshold.max && (threshold.min === undefined || level >= threshold.min),
  );
  if (exact) return exact;
  const upper = thresholds.find((threshold) => level <= threshold.max);
  return upper ?? thresholds[thresholds.length - 1];
}

function batteryLevelIcon(level: number): string {
  if (level <= 5) return 'mdi:battery-outline';
  if (level >= 95) return 'mdi:battery';
  const bucket = Math.min(90, Math.max(10, Math.round(level / 10) * 10));
  return `mdi:battery-${bucket}`;
}

function chargingLevelIcon(level: number): string {
  if (level >= 95) return 'mdi:battery-charging-100';
  const bucket = Math.min(90, Math.max(10, Math.round(level / 10) * 10));
  return `mdi:battery-charging-${bucket}`;
}

export function selectIcon(
  semanticState: BatterySemanticState,
  level: number | undefined,
  threshold: ThresholdConfig | undefined,
  config: NormalizedFloatingBatteryCardConfig,
): string {
  if (semanticState === 'unavailable') return config.icons.unavailable;
  if (threshold?.icon) return threshold.icon;
  if (semanticState === 'charging') {
    if (config.icons.dynamic_charging_level && level !== undefined) return chargingLevelIcon(level);
    return config.icons.charging;
  }
  if (semanticState === 'full') return config.icons.full;
  if (config.icons.dynamic_level && level !== undefined) return batteryLevelIcon(level);
  return config.icons.default;
}

export function getBatterySnapshot(
  hass: HomeAssistant,
  config: NormalizedFloatingBatteryCardConfig,
): BatterySnapshot {
  const levelEntity = hass.states[config.entity];
  const rawLevel = parseNumericState(readEntityValue(levelEntity, config.level_attribute));
  const normalized = rawLevel === undefined ? undefined : normalizeLevel(rawLevel, config);
  const rounded = normalized === undefined ? undefined : Number(normalized.toFixed(config.precision));

  const stateEntity = config.state_entity ? hass.states[config.state_entity] : levelEntity;
  const stateValue = config.state_entity
    ? readEntityValue(stateEntity, config.state_attribute)
    : config.state_attribute
      ? readEntityValue(levelEntity, config.state_attribute)
      : undefined;

  const levelEntityAvailable =
    levelEntity !== undefined && !['unknown', 'unavailable'].includes(levelEntity.state.toLowerCase());
  const stateEntityAvailable =
    !config.state_entity ||
    (stateEntity !== undefined && !['unavailable'].includes(stateEntity.state.toLowerCase()));
  const sourcesAvailable = rawLevel !== undefined && levelEntityAvailable && stateEntityAvailable;
  const semanticState = sourcesAvailable ? mapSemanticState(stateValue, normalized, config) : 'unavailable';
  const available = sourcesAvailable && semanticState !== 'unavailable';
  const threshold = selectThreshold(normalized, config.thresholds);
  const icon = selectIcon(semanticState, normalized, threshold, config);

  const friendlyName = levelEntity?.attributes?.friendly_name;
  const name = config.display.name || (typeof friendlyName === 'string' ? friendlyName : config.entity);
  const levelText =
    rounded === undefined
      ? semanticState === 'unavailable'
        ? config.display.unavailable_text
        : config.display.unknown_text
      : rounded.toFixed(config.precision);

  return {
    rawLevel,
    normalizedLevel: normalized,
    displayLevel: rounded,
    semanticState,
    available,
    icon,
    threshold,
    levelText,
    unitText: config.unit,
    name,
    sourceState: stateValue === undefined ? undefined : String(stateValue),
  };
}
