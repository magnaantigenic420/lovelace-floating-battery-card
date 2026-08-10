import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActionController } from '../src/action-controller';
import { normalizeConfig } from '../src/normalize';
import type { NormalizedFloatingBatteryCardConfig } from '../src/types';

function config(
  overrides: Partial<NormalizedFloatingBatteryCardConfig> = {},
): NormalizedFloatingBatteryCardConfig {
  return {
    ...normalizeConfig({
      type: 'custom:floating-battery-card',
      entity: 'sensor.battery',
    }),
    ...overrides,
  };
}

function createLovelaceTree(): { homeAssistant: HTMLElement; host: HTMLElement; overlay: HTMLElement } {
  const homeAssistant = document.createElement('home-assistant');
  const host = document.createElement('floating-battery-card');
  const overlay = document.createElement('floating-battery-overlay');
  homeAssistant.append(host);
  document.body.append(homeAssistant, overlay);
  return { homeAssistant, host, overlay };
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('ActionController', () => {
  it('dispatches viewport actions from the in-tree Lovelace host', () => {
    const { homeAssistant, host, overlay } = createLovelaceTree();
    const actionConfig = config();
    const received: CustomEvent[] = [];
    homeAssistant.addEventListener('hass-action', (event) => {
      received.push(event as CustomEvent);
    });
    overlay.addEventListener('hass-action', () => {
      throw new Error('The body-level overlay must not be the action event origin.');
    });

    new ActionController(
      () => host,
      () => actionConfig,
    ).pointerUp();

    expect(received).toHaveLength(1);
    expect(received[0]!.target).toBe(host);
    expect(received[0]!.bubbles).toBe(true);
    expect(received[0]!.composed).toBe(true);
    expect(received[0]!.detail).toEqual({ config: actionConfig, action: 'tap' });
    expect(actionConfig.tap_action).toEqual({ action: 'more-info' });
  });

  it('routes fire-dom-event through the host in inline mode too', () => {
    const { homeAssistant, host, overlay } = createLovelaceTree();
    host.append(overlay);
    const actionConfig = config({
      position: { ...config().position, mode: 'inline' },
      tap_action: { action: 'fire-dom-event' },
    });
    const listener = vi.fn();
    homeAssistant.addEventListener('hass-action', listener);

    new ActionController(
      () => host,
      () => actionConfig,
    ).pointerUp();

    expect(listener).toHaveBeenCalledOnce();
    const event = listener.mock.calls[0]![0] as CustomEvent;
    expect(event.target).toBe(host);
    expect(event.detail.config.tap_action).toEqual({ action: 'fire-dom-event' });
  });
});
