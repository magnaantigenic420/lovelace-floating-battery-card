import { sanitizeUrl } from '@braintree/sanitize-url';
import type { ActionConfig, NormalizedFloatingBatteryCardConfig } from './types';

const SUPPORTED_ACTIONS = new Set([
  'none',
  'more-info',
  'navigate',
  'url',
  'toggle',
  'perform-action',
  'call-service',
  'assist',
  'fire-dom-event',
]);

export class ActionController {
  private holdTimer?: number;
  private singleTapTimer?: number;
  private held = false;
  private lastTap = 0;

  public constructor(
    private readonly getActionTarget: () => HTMLElement | undefined,
    private readonly getConfig: () => NormalizedFloatingBatteryCardConfig | undefined,
  ) {}

  public pointerDown(): void {
    const config = this.getConfig();
    if (!config || config.hold_action?.action === 'none') return;
    this.held = false;
    this.holdTimer = window.setTimeout(() => {
      this.held = true;
      this.fire('hold');
    }, 500);
  }

  public pointerUp(): void {
    this.clearHold();
    if (this.held) {
      this.held = false;
      return;
    }
    const config = this.getConfig();
    if (!config) return;
    const hasDouble = config.double_tap_action?.action !== 'none';
    if (!hasDouble) {
      this.fire('tap');
      return;
    }
    const now = Date.now();
    if (now - this.lastTap <= 275) {
      if (this.singleTapTimer) window.clearTimeout(this.singleTapTimer);
      this.singleTapTimer = undefined;
      this.lastTap = 0;
      this.fire('double_tap');
      return;
    }
    this.lastTap = now;
    this.singleTapTimer = window.setTimeout(() => {
      this.singleTapTimer = undefined;
      this.lastTap = 0;
      this.fire('tap');
    }, 280);
  }

  public cancel(): void {
    this.clearHold();
    this.held = false;
  }

  public keyDown(event: KeyboardEvent): void {
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
      event.preventDefault();
    }
  }

  public keyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.fire('tap');
    }
  }

  public disconnect(): void {
    this.clearHold();
    if (this.singleTapTimer) window.clearTimeout(this.singleTapTimer);
  }

  private clearHold(): void {
    if (this.holdTimer) window.clearTimeout(this.holdTimer);
    this.holdTimer = undefined;
  }

  private fire(action: 'tap' | 'hold' | 'double_tap'): void {
    const config = this.getConfig();
    const target = this.getActionTarget();
    if (!config || !target) return;
    const field = action === 'double_tap' ? 'double_tap_action' : `${action}_action`;
    const actionConfig = config[field];
    const actionType = actionConfig?.action;
    if (typeof actionType !== 'string' || !SUPPORTED_ACTIONS.has(actionType)) {
      const message = `Floating Battery Card: unsupported action type "${String(actionType)}" in ${field}.`;
      this.warn(target, message, actionConfig);
      return;
    }
    const url = actionConfig.url_path;
    if (actionType === 'url' && url && (typeof url !== 'string' || sanitizeUrl(url) !== url)) {
      const message = `Floating Battery Card: blocked an unsafe URL in ${field}.`;
      this.warn(target, message, actionConfig);
      return;
    }
    target.dispatchEvent(
      new CustomEvent('hass-action', {
        detail: { config, action },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private warn(target: HTMLElement, message: string, actionConfig?: ActionConfig): void {
    console.warn(message, actionConfig);
    target.dispatchEvent(
      new CustomEvent('hass-notification', {
        detail: { message },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
