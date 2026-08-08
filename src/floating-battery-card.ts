import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';

import { CARD_VERSION } from './defaults';
import './floating-battery-overlay';
import type { FloatingBatteryOverlay } from './floating-battery-overlay';
import { normalizeConfig } from './normalize';
import type {
  FloatingBatteryCardConfig,
  NormalizedFloatingBatteryCardConfig,
} from './types';
import { isEditorContext } from './utils';

@customElement('floating-battery-card')
export class FloatingBatteryCard extends LitElement {
  private config?: NormalizedFloatingBatteryCardConfig;
  private _hass?: HomeAssistant;
  private overlay?: FloatingBatteryOverlay;
  private sourcePath = window.location.pathname;

  public set hass(value: HomeAssistant) {
    this._hass = value;
    if (this.overlay) this.overlay.hass = value;
    else this.syncOverlay(false);
    this.requestUpdate();
  }

  public get hass(): HomeAssistant | undefined {
    return this._hass;
  }

  public setConfig(config: FloatingBatteryCardConfig): void {
    this.config = normalizeConfig(config);
    this.syncPresentationMode();
    this.syncOverlay(true);
    this.requestUpdate();
  }

  public static async getConfigElement(): Promise<HTMLElement> {
    await import('./editor');
    return document.createElement('floating-battery-card-editor');
  }

  public static getStubConfig(hass?: HomeAssistant, entities?: string[]): FloatingBatteryCardConfig {
    const suggested =
      entities?.find((entity) => hass?.states[entity]?.attributes?.device_class === 'battery') ??
      Object.keys(hass?.states ?? {}).find(
        (entity) => hass?.states[entity]?.attributes?.device_class === 'battery',
      ) ??
      'sensor.battery_level';
    return {
      type: 'custom:floating-battery-card',
      entity: suggested,
    };
  }

  public getCardSize(): number {
    return this.config?.position.mode === 'inline' ? 1 : 0;
  }

  public override connectedCallback(): void {
    super.connectedCallback();
    this.sourcePath = window.location.pathname;
    window.addEventListener('popstate', this.onLocationChanged);
    window.addEventListener('hashchange', this.onLocationChanged);
    window.addEventListener('location-changed', this.onLocationChanged as EventListener);
    document.addEventListener('location-changed', this.onLocationChanged as EventListener);
    queueMicrotask(() => {
      this.syncPresentationMode();
      this.syncOverlay(true);
    });
  }

  public override disconnectedCallback(): void {
    window.removeEventListener('popstate', this.onLocationChanged);
    window.removeEventListener('hashchange', this.onLocationChanged);
    window.removeEventListener('location-changed', this.onLocationChanged as EventListener);
    document.removeEventListener('location-changed', this.onLocationChanged as EventListener);
    this.removeOverlay();
    super.disconnectedCallback();
  }

  protected override render(): TemplateResult | typeof nothing {
    if (!this.config) return nothing;
    const inline = this.config.position.mode === 'inline' || isEditorContext(this);
    if (!inline) return nothing;

    const inlineConfig: NormalizedFloatingBatteryCardConfig = {
      ...this.config,
      position: { ...this.config.position, mode: 'inline' },
    };
    return html`<floating-battery-overlay
      .hass=${this._hass}
      .active=${true}
      .sourceHost=${this}
      .config=${inlineConfig}
    ></floating-battery-overlay>`;
  }

  private syncPresentationMode(): void {
    if (!this.config) return;
    const inline = this.config.position.mode === 'inline' || isEditorContext(this);
    this.toggleAttribute('inline', inline);
  }

  private syncOverlay(configChanged = false): void {
    if (!this.isConnected || !this.config) return;
    const shouldPortal = this.config.position.mode === 'viewport' && !isEditorContext(this);
    if (!shouldPortal) {
      this.removeOverlay();
      return;
    }

    let created = false;
    if (!this.overlay || !this.overlay.isConnected) {
      const overlay = document.createElement('floating-battery-overlay');
      overlay.dataset.floatingBatteryOwner = this.instanceId;
      overlay.sourceHost = this;
      document.body.appendChild(overlay);
      this.overlay = overlay;
      created = true;
    }
    this.overlay.hass = this._hass;
    this.overlay.sourceHost = this;
    if (created || configChanged) this.overlay.setConfig(this.config);
    this.overlay.active = window.location.pathname === this.sourcePath;
  }

  private removeOverlay(): void {
    this.overlay?.remove();
    this.overlay = undefined;
  }

  private readonly onLocationChanged = (): void => {
    if (this.overlay) {
      this.overlay.active = window.location.pathname === this.sourcePath;
    }
  };

  private readonly instanceId = `fbc-${Math.random().toString(36).slice(2, 10)}`;

  static override styles = css`
    :host {
      display: contents;
    }
    :host([inline]) {
      display: inline-block;
    }
  `;
}

declare global {
  interface Window {
    customCards?: Array<{
      type: string;
      name: string;
      description?: string;
      preview?: boolean;
      documentationURL?: string;
    }>;
  }
}

window.customCards = window.customCards ?? [];
if (!window.customCards.some((card) => card.type === 'floating-battery-card')) {
  window.customCards.push({
    type: 'floating-battery-card',
    name: 'Floating Battery Card',
    description: 'A configurable viewport-floating battery indicator.',
    preview: true,
    documentationURL: 'https://github.com/moryoav/lovelace-floating-battery-card',
  });
}

console.info(
  `%c FLOATING-BATTERY-CARD %c v${CARD_VERSION} `,
  'color: white; background: #03a9f4; font-weight: 700;',
  'color: #03a9f4; background: white; font-weight: 700;',
);
