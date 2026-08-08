import { handleAction, type HomeAssistant } from 'custom-card-helpers';
import type { NormalizedFloatingBatteryCardConfig } from './types';

export class ActionController {
  private holdTimer?: number;
  private singleTapTimer?: number;
  private held = false;
  private lastTap = 0;

  public constructor(
    private readonly element: HTMLElement,
    private readonly getHass: () => HomeAssistant | undefined,
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
    const hass = this.getHass();
    const config = this.getConfig();
    if (!hass || !config) return;
    const entity = config.behavior.more_info_entity || config.entity;
    handleAction(this.element, hass, { ...config, entity }, action);
  }
}
