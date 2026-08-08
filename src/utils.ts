import type {
  BatterySemanticState,
  BatterySnapshot,
  NormalizedFloatingBatteryCardConfig,
  ThresholdConfig,
} from './types';

export function cssDimension(value: number | string | undefined, fallback = '0px'): string {
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`;
  if (typeof value === 'string' && value.trim()) return value.trim();
  return fallback;
}

export function numericDimension(value: number | string | undefined, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function isValidIcon(icon: string | undefined): boolean {
  return Boolean(icon && /^(mdi|hass|phu):[a-z0-9][a-z0-9-]*$/i.test(icon));
}

export function safeIcon(icon: string | undefined, fallback: string): string {
  return isValidIcon(icon) ? icon! : fallback;
}

function thresholdSpecificColor(
  threshold: ThresholdConfig | undefined,
  key: keyof ThresholdConfig,
): string {
  const direct = threshold?.[key];
  return typeof direct === 'string' && direct.trim() ? direct : '';
}

/**
 * Threshold `color` is an accent shorthand. It applies to foreground accents
 * (icon, text and ring), but never to the card background or border. Those
 * require their explicit threshold properties so the default card remains
 * readable against the Home Assistant card background.
 */
function thresholdAccentColor(
  threshold: ThresholdConfig | undefined,
  key: keyof ThresholdConfig,
): string {
  const direct = thresholdSpecificColor(threshold, key);
  if (direct) return direct;
  return typeof threshold?.color === 'string' && threshold.color.trim() ? threshold.color : '';
}

function stateColor(
  semanticState: BatterySemanticState,
  config: NormalizedFloatingBatteryCardConfig,
): string {
  if (semanticState === 'charging') return config.colors.charging;
  if (semanticState === 'full') return config.colors.full;
  if (semanticState === 'unavailable') return config.colors.unavailable;
  return '';
}

export interface ResolvedColors {
  icon: string;
  text: string;
  background: string;
  border: string;
  ring: string;
  ringTrack: string;
}

export function resolveColors(
  snapshot: BatterySnapshot,
  config: NormalizedFloatingBatteryCardConfig,
): ResolvedColors {
  const state = stateColor(snapshot.semanticState, config);
  const allowState = config.colors.state_overrides_threshold;
  const pickAccent = (thresholdKey: keyof ThresholdConfig, global: string): string => {
    const threshold = thresholdAccentColor(snapshot.threshold, thresholdKey);
    if (allowState && state) return state;
    if (threshold) return threshold;
    if (!allowState && state) return state;
    return global;
  };

  return {
    icon: pickAccent('icon_color', config.colors.icon || 'var(--primary-text-color)'),
    text: pickAccent('text_color', config.colors.text),
    background:
      thresholdSpecificColor(snapshot.threshold, 'background_color') || config.colors.background,
    border: thresholdSpecificColor(snapshot.threshold, 'border_color') || config.colors.border,
    ring:
      config.ring.color_mode === 'fixed'
        ? config.ring.color || config.colors.ring || pickAccent('ring_color', config.colors.icon)
        : pickAccent('ring_color', config.ring.color || config.colors.ring || config.colors.icon),
    ringTrack: config.ring.track_color || config.colors.ring_track,
  };
}

export function isEditorContext(element: HTMLElement): boolean {
  let current: Node | null = element;
  const editorTags = ['hui-card-preview', 'hui-dialog-edit-card', 'hui-card-element-editor'];
  for (let i = 0; current && i < 30; i += 1) {
    if (current instanceof HTMLElement) {
      const tag = current.tagName.toLowerCase();
      if (editorTags.some((candidate) => tag.includes(candidate))) return true;
      if (current.classList.contains('card-preview')) return true;
    }
    if (current.parentNode) {
      current = current.parentNode;
      continue;
    }
    const root = current.getRootNode?.();
    current = root instanceof ShadowRoot ? root.host : null;
  }
  return false;
}

export function snapshotFingerprint(snapshot: BatterySnapshot): string {
  return `${snapshot.displayLevel ?? 'x'}|${snapshot.semanticState}|${snapshot.icon}`;
}
