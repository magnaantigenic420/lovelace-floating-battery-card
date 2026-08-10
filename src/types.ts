import type { HomeAssistant, LovelaceCardConfig } from 'custom-card-helpers';
import type { HassServiceTarget } from 'home-assistant-js-websocket';

export interface ActionConfirmationConfig {
  text?: string;
  title?: string;
  confirm_text?: string;
  dismiss_text?: string;
  exemptions?: Array<{ user: string }>;
}

export interface ActionConfig {
  action: string;
  confirmation?: ActionConfirmationConfig;
  entity?: string;
  navigation_path?: string;
  navigation_replace?: boolean;
  url_path?: string;
  service?: string;
  perform_action?: string;
  service_data?: Record<string, unknown>;
  data?: Record<string, unknown>;
  target?: HassServiceTarget;
  pipeline_id?: string;
  start_listening?: boolean;
  [key: string]: unknown;
}

export type BatterySemanticState = 'charging' | 'not_charging' | 'full' | 'unavailable' | 'unknown';
export type Anchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'custom';
export type Shape = 'circle' | 'rounded-square' | 'square';
export type DisplayLayout = 'stacked' | 'horizontal' | 'overlay';
export type UnavailableBehavior = 'show' | 'dim' | 'hide';
export type ChargingAnimation = 'none' | 'pulse' | 'breathe' | 'glow' | 'rotate';
export type LowBatteryAnimation = 'none' | 'pulse' | 'blink';
export type HoverAnimation = 'none' | 'scale' | 'lift';
export type TooltipMode = 'automatic' | 'custom' | 'disabled';

export interface ThresholdConfig {
  min?: number;
  max: number;
  color?: string;
  icon_color?: string;
  text_color?: string;
  background_color?: string;
  border_color?: string;
  ring_color?: string;
  icon?: string;
  animation?: ChargingAnimation | LowBatteryAnimation;
}

export interface StateMapConfig {
  case_sensitive?: boolean;
  normalize_whitespace?: boolean;
  charging?: string[];
  not_charging?: string[];
  full?: string[];
  unavailable?: string[];
}

export interface IconsConfig {
  default?: string;
  charging?: string;
  full?: string;
  unavailable?: string;
  dynamic_level?: boolean;
  dynamic_charging_level?: boolean;
  size?: number | string;
  rotation?: number;
}

export interface ColorsConfig {
  icon?: string;
  text?: string;
  background?: string;
  border?: string;
  shadow?: string;
  charging?: string;
  full?: string;
  unavailable?: string;
  focus_ring?: string;
  ring_track?: string;
  ring?: string;
  state_overrides_threshold?: boolean;
}

export interface DisplayConfig {
  show_icon?: boolean;
  show_level?: boolean;
  show_unit?: boolean;
  show_name?: boolean;
  name?: string;
  unknown_text?: string;
  unavailable_text?: string;
  layout?: DisplayLayout;
  gap?: number | string;
  tooltip?: TooltipMode;
  tooltip_text?: string;
  aria_label?: string;
}

export interface AppearanceConfig {
  size?: number | string;
  width?: number | string;
  height?: number | string;
  shape?: Shape;
  border_radius?: number | string;
  padding?: number | string;
  icon_size?: number | string;
  text_size?: number | string;
  name_size?: number | string;
  font_weight?: number | string;
  line_height?: number | string;
  opacity?: number;
  background_opacity?: number;
  border_width?: number | string;
  border_style?: string;
  box_shadow?: string;
  backdrop_blur?: number | string;
  hover_opacity?: number;
  active_scale?: number;
  transition_duration?: number;
}

export interface RingConfig {
  enabled?: boolean;
  width?: number;
  inset?: number;
  track_color?: string;
  color?: string;
  color_mode?: 'fixed' | 'threshold';
  start_angle?: number;
  clockwise?: boolean;
  rounded_caps?: boolean;
  level_mode?: 'normalized' | 'raw';
}

export interface PositionConfig {
  mode?: 'viewport' | 'inline';
  anchor?: Anchor;
  offset_x?: number | string;
  offset_y?: number | string;
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
  z_index?: number;
  safe_area?: boolean;
  edge_margin?: number | string;
}

export interface BehaviorConfig {
  unavailable?: UnavailableBehavior;
  hide_when_full?: boolean;
  hide_when_charging?: boolean;
  hide_when_not_charging?: boolean;
  min_viewport_width?: number;
  max_viewport_width?: number;
  compact_below_width?: number;
  compact_size?: number | string;
  pointer_events?: boolean;
  auto_hide_delay?: number;
  restore_on_change?: boolean;
  more_info_entity?: string;
}

export interface AnimationConfig {
  charging?: ChargingAnimation;
  low_battery?: LowBatteryAnimation;
  hover?: HoverAnimation;
  duration?: number;
  timing_function?: string;
  low_battery_threshold?: number;
  transition_duration?: number;
  respect_reduced_motion?: boolean;
  disabled?: boolean;
}

export interface FloatingBatteryCardConfig extends LovelaceCardConfig {
  type: string;
  entity: string;
  state_entity?: string;
  level_attribute?: string;
  state_attribute?: string;
  min_level?: number;
  max_level?: number;
  clamp_level?: boolean;
  invert_level?: boolean;
  precision?: number;
  unit?: string;
  full_threshold?: number;
  thresholds?: ThresholdConfig[];
  state_map?: StateMapConfig;
  icons?: IconsConfig;
  colors?: ColorsConfig;
  display?: DisplayConfig;
  appearance?: AppearanceConfig;
  ring?: RingConfig;
  position?: PositionConfig;
  behavior?: BehaviorConfig;
  animation?: AnimationConfig;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

export interface NormalizedFloatingBatteryCardConfig extends FloatingBatteryCardConfig {
  min_level: number;
  max_level: number;
  clamp_level: boolean;
  invert_level: boolean;
  precision: number;
  unit: string;
  full_threshold: number;
  thresholds: ThresholdConfig[];
  state_map: Required<StateMapConfig>;
  icons: Required<IconsConfig>;
  colors: Required<ColorsConfig>;
  display: Required<DisplayConfig>;
  appearance: Required<AppearanceConfig>;
  ring: Required<RingConfig>;
  position: Required<PositionConfig>;
  behavior: Required<BehaviorConfig>;
  animation: Required<AnimationConfig>;
  tap_action: ActionConfig;
  hold_action: ActionConfig;
  double_tap_action: ActionConfig;
}

export interface BatterySnapshot {
  rawLevel?: number;
  normalizedLevel?: number;
  displayLevel?: number;
  semanticState: BatterySemanticState;
  available: boolean;
  icon: string;
  threshold?: ThresholdConfig;
  levelText: string;
  unitText: string;
  name: string;
  sourceState?: string;
}

export interface FloatingBatteryOverlayElement extends HTMLElement {
  hass?: HomeAssistant;
  setConfig(config: NormalizedFloatingBatteryCardConfig): void;
  sourceHost?: HTMLElement;
}
