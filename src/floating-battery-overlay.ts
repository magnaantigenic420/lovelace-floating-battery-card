import { LitElement, css, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { HomeAssistant } from 'custom-card-helpers';

import { ActionController } from './action-controller';
import { getBatterySnapshot } from './battery';
import { positionStyles } from './position';
import type { BatterySnapshot, NormalizedFloatingBatteryCardConfig } from './types';
import { cssDimension, numericDimension, resolveColors, safeIcon, snapshotFingerprint } from './utils';

const THEME_VARIABLES = [
  '--ha-card-background',
  '--card-background-color',
  '--primary-text-color',
  '--secondary-text-color',
  '--disabled-text-color',
  '--primary-color',
  '--error-color',
  '--warning-color',
  '--success-color',
  '--divider-color',
];

@customElement('floating-battery-overlay')
export class FloatingBatteryOverlay extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @property({ type: Boolean, reflect: true }) public active = true;
  @property({ attribute: false }) public sourceHost?: HTMLElement;

  @property({ attribute: false }) public config?: NormalizedFloatingBatteryCardConfig;
  @state() private viewportWidth = window.innerWidth;
  @state() private autoHidden = false;

  private lastFingerprint = '';
  private autoHideTimer?: number;
  private readonly actions = new ActionController(
    () => this.sourceHost,
    () => this.config,
  );

  public setConfig(config: NormalizedFloatingBatteryCardConfig): void {
    this.config = config;
    this.autoHidden = false;
    this.lastFingerprint = '';
    this.clearAutoHide();
    this.requestUpdate();
  }

  public override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('resize', this.onResize, { passive: true });
  }

  public override disconnectedCallback(): void {
    window.removeEventListener('resize', this.onResize);
    this.clearAutoHide();
    this.actions.disconnect();
    super.disconnectedCallback();
  }

  protected override updated(_changed: PropertyValues): void {
    this.mirrorTheme();
    if (!this.hass || !this.config) return;
    const snapshot = getBatterySnapshot(this.hass, this.config);
    const fingerprint = snapshotFingerprint(snapshot);
    if (fingerprint !== this.lastFingerprint) {
      this.lastFingerprint = fingerprint;
      if (this.config.behavior.restore_on_change) this.autoHidden = false;
      this.scheduleAutoHide();
    }
  }

  protected override render(): TemplateResult | typeof nothing {
    if (!this.hass || !this.config) return nothing;
    const snapshot = getBatterySnapshot(this.hass, this.config);
    if (!this.shouldShow(snapshot)) return nothing;

    const colors = resolveColors(snapshot, this.config);
    const compact =
      this.config.behavior.compact_below_width > 0 &&
      this.viewportWidth < this.config.behavior.compact_below_width;
    const configuredWidth = compact ? this.config.behavior.compact_size : this.config.appearance.width;
    const configuredHeight = compact ? this.config.behavior.compact_size : this.config.appearance.height;
    const width = cssDimension(configuredWidth, '72px');
    const height = cssDimension(configuredHeight, '72px');
    const padding = cssDimension(this.config.appearance.padding, '6px');
    const borderWidth = cssDimension(this.config.appearance.border_width, '0px');
    const blur = cssDimension(this.config.appearance.backdrop_blur, '0px');
    const gap = cssDimension(this.config.display.gap, '0px');
    const iconSize = cssDimension(this.config.appearance.icon_size, '27px');
    const textSize = cssDimension(this.config.appearance.text_size, '13px');
    const nameSize = cssDimension(this.config.appearance.name_size, '10px');
    const opacity =
      snapshot.available || this.config.behavior.unavailable !== 'dim' ? this.config.appearance.opacity : 0.45;
    const bgOpacity = Math.min(1, Math.max(0, this.config.appearance.background_opacity));
    const background =
      bgOpacity >= 0.999
        ? colors.background
        : `color-mix(in srgb, ${colors.background} ${Math.round(bgOpacity * 100)}%, transparent)`;

    const wrapperStyle = {
      ...positionStyles(this.config),
      pointerEvents: this.config.behavior.pointer_events ? 'auto' : 'none',
      opacity: String(opacity),
    };
    const surfaceStyle = {
      width,
      height,
      minWidth: width,
      minHeight: height,
      maxWidth: width,
      maxHeight: height,
      boxSizing: 'border-box',
      padding,
      borderRadius: cssDimension(this.config.appearance.border_radius, '50%'),
      borderWidth,
      borderStyle: this.config.appearance.border_style,
      borderColor: colors.border,
      background,
      color: colors.text,
      boxShadow: this.config.appearance.box_shadow,
      backdropFilter:
        numericDimension(this.config.appearance.backdrop_blur, 0) > 0 ? `blur(${blur})` : 'none',
      gap,
      fontWeight: String(this.config.appearance.font_weight),
      transitionDuration: `${
        this.config.animation.transition_duration || this.config.appearance.transition_duration
      }ms`,
      '--fbc-active-scale': String(this.config.appearance.active_scale),
      '--fbc-hover-opacity': String(this.config.appearance.hover_opacity),
      '--fbc-focus-color': this.config.colors.focus_ring,
      '--fbc-animation-duration': `${this.config.animation.duration}ms`,
      '--fbc-animation-timing': this.config.animation.timing_function,
    } as Record<string, string>;

    const animationClasses = this.animationClasses(snapshot);
    const tooltip = this.tooltip(snapshot);
    const ariaLabel = this.ariaText(snapshot);

    return html`
      <div class="viewport-anchor" style=${styleMap(wrapperStyle)}>
        <div
          class="surface layout-${this.config.display.layout} ${animationClasses}"
          style=${styleMap(surfaceStyle)}
          role="button"
          tabindex=${this.config.behavior.pointer_events ? '0' : '-1'}
          aria-label=${ariaLabel}
          title=${tooltip}
          @pointerdown=${() => this.actions.pointerDown()}
          @pointerup=${() => this.actions.pointerUp()}
          @pointercancel=${() => this.actions.cancel()}
          @pointerleave=${() => this.actions.cancel()}
          @keydown=${(event: KeyboardEvent) => this.actions.keyDown(event)}
          @keyup=${(event: KeyboardEvent) => this.actions.keyUp(event)}
        >
          ${this.renderRing(snapshot, colors.ring, colors.ringTrack)}
          <div class="content">
            ${this.config.display.show_icon
              ? html`<ha-icon
                  class="battery-icon"
                  style=${styleMap({
                    color: colors.icon,
                    width: iconSize,
                    height: iconSize,
                    transform: `rotate(${this.config.icons.rotation}deg)`,
                  })}
                  .icon=${safeIcon(snapshot.icon, this.config.icons.default)}
                ></ha-icon>`
              : nothing}
            ${this.config.display.show_level
              ? html`<div
                  class="level"
                  style=${styleMap({
                    fontSize: textSize,
                    lineHeight: cssDimension(this.config.appearance.line_height, '16px'),
                  })}
                >
                  ${snapshot.levelText}${
                    this.config.display.show_unit && snapshot.displayLevel !== undefined
                      ? html`<span class="unit">${snapshot.unitText}</span>`
                      : nothing
                  }
                </div>`
              : nothing}
            ${this.config.display.show_name
              ? html`<div class="name" style=${styleMap({ fontSize: nameSize })}>${snapshot.name}</div>`
              : nothing}
          </div>
        </div>
      </div>
    `;
  }

  private renderRing(
    snapshot: BatterySnapshot,
    color: string,
    trackColor: string,
  ): TemplateResult | typeof nothing {
    if (!this.config?.ring.enabled || snapshot.displayLevel === undefined) return nothing;
    const strokeWidth = Math.max(1, this.config.ring.width);
    const radius = Math.max(1, 50 - this.config.ring.inset - strokeWidth / 2);
    const circumference = 2 * Math.PI * radius;
    const raw =
      this.config.ring.level_mode === 'raw'
        ? snapshot.rawLevel ?? 0
        : snapshot.normalizedLevel ?? 0;
    const progress = Math.min(100, Math.max(0, raw));
    const dashOffset = circumference * (1 - progress / 100);
    const direction = this.config.ring.clockwise ? 1 : -1;
    const transform = `rotate(${this.config.ring.start_angle} 50 50) scale(${direction} 1) translate(${
      direction === -1 ? -100 : 0
    } 0)`;

    return html`
      <svg class="ring" viewBox="0 0 100 100" aria-hidden="true">
        <circle
          class="ring-track"
          cx="50"
          cy="50"
          r=${radius}
          stroke=${trackColor}
          stroke-width=${strokeWidth}
        ></circle>
        <circle
          class="ring-progress"
          cx="50"
          cy="50"
          r=${radius}
          stroke=${color}
          stroke-width=${strokeWidth}
          stroke-linecap=${this.config.ring.rounded_caps ? 'round' : 'butt'}
          stroke-dasharray=${circumference}
          stroke-dashoffset=${dashOffset}
          transform=${transform}
        ></circle>
      </svg>
    `;
  }

  private animationClasses(snapshot: BatterySnapshot): string {
    if (!this.config || this.config.animation.disabled) return '';
    const classes: string[] = [];
    if (snapshot.semanticState === 'charging' && this.config.animation.charging !== 'none') {
      classes.push(`charging-${this.config.animation.charging}`);
    }
    if (
      snapshot.displayLevel !== undefined &&
      snapshot.displayLevel <= this.config.animation.low_battery_threshold &&
      this.config.animation.low_battery !== 'none'
    ) {
      classes.push(`low-${this.config.animation.low_battery}`);
    }
    const thresholdAnimation = snapshot.threshold?.animation;
    if (thresholdAnimation === 'pulse') classes.push('low-pulse');
    else if (thresholdAnimation === 'blink') classes.push('low-blink');
    else if (thresholdAnimation === 'breathe') classes.push('charging-breathe');
    else if (thresholdAnimation === 'glow') classes.push('charging-glow');
    else if (thresholdAnimation === 'rotate') classes.push('charging-rotate');
    if (this.config.animation.hover !== 'none') classes.push(`hover-${this.config.animation.hover}`);
    if (!this.config.animation.respect_reduced_motion) classes.push('ignore-reduced-motion');
    return classes.join(' ');
  }

  private shouldShow(snapshot: BatterySnapshot): boolean {
    if (!this.config || !this.active || this.autoHidden) return false;
    const { behavior } = this.config;
    if (behavior.unavailable === 'hide' && !snapshot.available) return false;
    if (behavior.hide_when_full && snapshot.semanticState === 'full') return false;
    if (behavior.hide_when_charging && snapshot.semanticState === 'charging') return false;
    if (behavior.hide_when_not_charging && snapshot.semanticState === 'not_charging') return false;
    if (behavior.min_viewport_width > 0 && this.viewportWidth < behavior.min_viewport_width) return false;
    if (behavior.max_viewport_width > 0 && this.viewportWidth > behavior.max_viewport_width) return false;
    return true;
  }

  private tooltip(snapshot: BatterySnapshot): string {
    if (!this.config) return '';
    if (this.config.display.tooltip === 'disabled') return '';
    if (this.config.display.tooltip === 'custom') return this.config.display.tooltip_text;
    const level =
      snapshot.displayLevel === undefined
        ? snapshot.levelText
        : `${snapshot.levelText}${snapshot.unitText}`;
    const state =
      snapshot.semanticState === 'unknown' ? '' : ` · ${snapshot.semanticState.replace('_', ' ')}`;
    return `${snapshot.name}: ${level}${state}`;
  }

  private ariaText(snapshot: BatterySnapshot): string {
    if (!this.config) return '';
    if (this.config.display.aria_label) return this.config.display.aria_label;
    const level =
      snapshot.displayLevel === undefined
        ? snapshot.levelText
        : `${snapshot.levelText}${snapshot.unitText}`;
    return `${snapshot.name}, ${level}, ${snapshot.semanticState.replace('_', ' ')}`;
  }

  private scheduleAutoHide(): void {
    if (!this.config) return;
    this.clearAutoHide();
    if (this.config.behavior.auto_hide_delay <= 0) return;
    this.autoHideTimer = window.setTimeout(() => {
      this.autoHidden = true;
    }, this.config.behavior.auto_hide_delay);
  }

  private clearAutoHide(): void {
    if (this.autoHideTimer) window.clearTimeout(this.autoHideTimer);
    this.autoHideTimer = undefined;
  }

  private mirrorTheme(): void {
    if (!this.sourceHost || !this.sourceHost.isConnected) return;
    const computed = getComputedStyle(this.sourceHost);
    for (const variable of THEME_VARIABLES) {
      const value = computed.getPropertyValue(variable).trim();
      if (value) this.style.setProperty(variable, value);
    }
  }

  private readonly onResize = (): void => {
    this.viewportWidth = window.innerWidth;
  };

  static override styles = css`
    :host {
      display: contents;
    }
    .viewport-anchor {
      margin: 0;
      padding: 0;
    }
    .surface {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      transition-property: transform, opacity, box-shadow, filter;
      transition-timing-function: ease;
      touch-action: manipulation;
      font-family: var(--paper-font-body1_-_font-family, inherit);
    }
    .surface:focus-visible {
      outline: 3px solid var(--fbc-focus-color);
      outline-offset: 2px;
    }
    .surface:active {
      transform: scale(var(--fbc-active-scale));
    }
    .content {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      gap: inherit;
    }
    .layout-stacked .content {
      flex-direction: column;
    }
    .layout-horizontal .content {
      flex-direction: row;
    }
    .layout-overlay .content {
      display: grid;
      place-items: center;
    }
    .layout-overlay .battery-icon,
    .layout-overlay .level,
    .layout-overlay .name {
      grid-area: 1 / 1;
    }
    .layout-overlay .name {
      align-self: end;
      margin-bottom: 4px;
    }
    .battery-icon {
      flex: 0 0 auto;
    }
    .level {
      font-weight: inherit;
      white-space: nowrap;
      text-align: center;
    }
    .unit {
      margin-left: 1px;
    }
    .name {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      opacity: 0.8;
    }
    .ring {
      position: absolute;
      inset: 0;
      z-index: 1;
      width: 100%;
      height: 100%;
      overflow: visible;
      pointer-events: none;
    }
    .ring-track,
    .ring-progress {
      fill: none;
    }
    .ring-progress {
      transition: stroke-dashoffset 300ms ease, stroke 200ms ease;
    }
    .hover-scale:hover {
      transform: scale(1.05);
      opacity: var(--fbc-hover-opacity);
    }
    .hover-lift:hover {
      transform: translateY(-2px);
      opacity: var(--fbc-hover-opacity);
      filter: brightness(1.05);
    }
    .charging-pulse,
    .low-pulse {
      animation: fbc-pulse var(--fbc-animation-duration) var(--fbc-animation-timing) infinite;
    }
    .charging-breathe {
      animation: fbc-breathe var(--fbc-animation-duration) var(--fbc-animation-timing) infinite;
    }
    .charging-glow {
      animation: fbc-glow var(--fbc-animation-duration) var(--fbc-animation-timing) infinite;
    }
    .charging-rotate .battery-icon {
      animation: fbc-rotate var(--fbc-animation-duration) linear infinite;
    }
    .low-blink {
      animation: fbc-blink var(--fbc-animation-duration) steps(2, jump-none) infinite;
    }
    @keyframes fbc-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.06); }
    }
    @keyframes fbc-breathe {
      0%, 100% { opacity: 0.72; }
      50% { opacity: 1; }
    }
    @keyframes fbc-glow {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.3); }
    }
    @keyframes fbc-rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes fbc-blink {
      50% { opacity: 0.3; }
    }
    @media (prefers-reduced-motion: reduce) {
      .surface:not(.ignore-reduced-motion),
      .surface:not(.ignore-reduced-motion) .battery-icon {
        animation: none !important;
        transition-duration: 0ms !important;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'floating-battery-overlay': FloatingBatteryOverlay;
  }
}
