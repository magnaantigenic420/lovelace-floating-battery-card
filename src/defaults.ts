import type {
  AnimationConfig,
  AppearanceConfig,
  BehaviorConfig,
  ColorsConfig,
  DisplayConfig,
  IconsConfig,
  PositionConfig,
  RingConfig,
  StateMapConfig,
  ThresholdConfig,
} from './types';

export const CARD_VERSION = '0.1.1';

export const DEFAULT_THRESHOLDS: ThresholdConfig[] = [
  { max: 20, color: 'var(--error-color, #f44336)' },
  { max: 50, color: 'var(--warning-color, #ff9800)' },
  { max: 100, color: 'var(--success-color, #4caf50)' },
];

export const DEFAULT_STATE_MAP: Required<StateMapConfig> = {
  case_sensitive: false,
  normalize_whitespace: true,
  charging: ['Charging'],
  not_charging: ['Not Charging', 'Discharging'],
  full: ['Full'],
  unavailable: ['Unknown', 'Unavailable', 'unknown', 'unavailable'],
};

export const DEFAULT_ICONS: Required<IconsConfig> = {
  default: 'mdi:battery',
  charging: 'mdi:battery-charging',
  full: 'mdi:battery',
  unavailable: 'mdi:battery-unknown',
  dynamic_level: false,
  dynamic_charging_level: false,
  size: 27,
  rotation: 0,
};

export const DEFAULT_COLORS: Required<ColorsConfig> = {
  icon: '',
  text: 'var(--primary-text-color)',
  background: 'var(--ha-card-background, var(--card-background-color, #1c1c1c))',
  border: 'transparent',
  shadow: 'rgba(0, 0, 0, 0.4)',
  charging: '',
  full: '',
  unavailable: 'var(--disabled-text-color, #9e9e9e)',
  focus_ring: 'var(--primary-color, #03a9f4)',
  ring_track: 'rgba(127, 127, 127, 0.25)',
  ring: '',
  state_overrides_threshold: true,
};

export const DEFAULT_DISPLAY: Required<DisplayConfig> = {
  show_icon: true,
  show_level: true,
  show_unit: true,
  show_name: false,
  name: '',
  unknown_text: '?',
  unavailable_text: '—',
  layout: 'stacked',
  gap: 0,
  tooltip: 'automatic',
  tooltip_text: '',
  aria_label: '',
};

export const DEFAULT_APPEARANCE: Required<AppearanceConfig> = {
  size: 72,
  width: 72,
  height: 72,
  shape: 'circle',
  border_radius: '50%',
  padding: 6,
  icon_size: 27,
  text_size: 13,
  name_size: 10,
  font_weight: 600,
  line_height: 16,
  opacity: 1,
  background_opacity: 1,
  border_width: 0,
  border_style: 'solid',
  box_shadow: '0 3px 10px rgba(0, 0, 0, 0.4)',
  backdrop_blur: 0,
  hover_opacity: 1,
  active_scale: 0.96,
  transition_duration: 160,
};

export const DEFAULT_RING: Required<RingConfig> = {
  enabled: false,
  width: 4,
  inset: 2,
  track_color: 'rgba(127, 127, 127, 0.25)',
  color: '',
  color_mode: 'threshold',
  start_angle: -90,
  clockwise: true,
  rounded_caps: true,
  level_mode: 'normalized',
};

export const DEFAULT_POSITION: Required<PositionConfig> = {
  mode: 'viewport',
  anchor: 'bottom-right',
  offset_x: 16,
  offset_y: 16,
  top: '',
  right: '',
  bottom: '',
  left: '',
  z_index: 1000,
  safe_area: true,
  edge_margin: 0,
};

export const DEFAULT_BEHAVIOR: Required<BehaviorConfig> = {
  unavailable: 'dim',
  hide_when_full: false,
  hide_when_charging: false,
  hide_when_not_charging: false,
  min_viewport_width: 0,
  max_viewport_width: 0,
  compact_below_width: 0,
  compact_size: 56,
  pointer_events: true,
  auto_hide_delay: 0,
  restore_on_change: true,
  more_info_entity: '',
};

export const DEFAULT_ANIMATION: Required<AnimationConfig> = {
  charging: 'none',
  low_battery: 'none',
  hover: 'lift',
  duration: 1200,
  timing_function: 'ease-in-out',
  low_battery_threshold: 15,
  transition_duration: 160,
  respect_reduced_motion: true,
  disabled: false,
};
