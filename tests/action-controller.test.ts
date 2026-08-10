import { afterEach, describe, expect, it, vi } from 'vitest';

import { ActionController } from '../src/action-controller';
import { normalizeConfig } from '../src/normalize';
import type { ActionConfig, NormalizedFloatingBatteryCardConfig } from '../src/types';

type Gesture = 'tap' | 'hold' | 'double_tap';

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
  vi.useRealTimers();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

function activate(controller: ActionController, gesture: Gesture): void {
  if (gesture === 'tap') {
    controller.pointerUp();
  } else if (gesture === 'hold') {
    controller.pointerDown();
    vi.advanceTimersByTime(500);
  } else {
    controller.pointerUp();
    vi.advanceTimersByTime(100);
    controller.pointerUp();
  }
}

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

  it.each([
    {
      name: 'perform-action',
      action: {
        action: 'perform-action',
        perform_action: 'light.turn_on',
        target: { entity_id: 'light.kitchen' },
        data: { brightness_pct: 50 },
      },
    },
    {
      name: 'assist',
      action: {
        action: 'assist',
        pipeline_id: 'preferred',
        start_listening: true,
      },
    },
  ])('forwards graphical editor $name configurations for every gesture', ({ action }) => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const gestures: Gesture[] = ['tap', 'hold', 'double_tap'];

    for (const gesture of gestures) {
      const { homeAssistant, host } = createLovelaceTree();
      const field = gesture === 'double_tap' ? 'double_tap_action' : `${gesture}_action`;
      const actionConfig = config({ [field]: action as ActionConfig });
      const listener = vi.fn();
      homeAssistant.addEventListener('hass-action', listener);
      const controller = new ActionController(
        () => host,
        () => actionConfig,
      );

      activate(controller, gesture);

      expect(listener).toHaveBeenCalledOnce();
      const event = listener.mock.calls[0]![0] as CustomEvent;
      expect(event.detail.action).toBe(gesture);
      expect(event.detail.config[field]).toEqual(action);
      document.body.replaceChildren();
    }
  });

  it('shows a Home Assistant notification and warns for unknown action types', () => {
    const { homeAssistant, host } = createLovelaceTree();
    const actionConfig = config({ tap_action: { action: 'launch-rocket' } });
    const actionListener = vi.fn();
    const notificationListener = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    homeAssistant.addEventListener('hass-action', actionListener);
    homeAssistant.addEventListener('hass-notification', notificationListener);

    new ActionController(
      () => host,
      () => actionConfig,
    ).pointerUp();

    const message = 'Floating Battery Card: unsupported action type "launch-rocket" in tap_action.';
    expect(actionListener).not.toHaveBeenCalled();
    expect(notificationListener).toHaveBeenCalledOnce();
    expect((notificationListener.mock.calls[0]![0] as CustomEvent).detail).toEqual({ message });
    expect(warn).toHaveBeenCalledWith(message, { action: 'launch-rocket' });
  });

  it.each([
    'http://example.com/battery',
    'https://example.com/battery?device=phone#level',
    '/lovelace/batteries',
    '#battery-details',
  ])('delegates the accepted URL %s without opening it locally', (url) => {
    const { homeAssistant, host } = createLovelaceTree();
    const actionConfig = config({ tap_action: { action: 'url', url_path: url } });
    const actionListener = vi.fn();
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    homeAssistant.addEventListener('hass-action', actionListener);

    new ActionController(
      () => host,
      () => actionConfig,
    ).pointerUp();

    expect(actionListener).toHaveBeenCalledOnce();
    const event = actionListener.mock.calls[0]![0] as CustomEvent;
    expect(event.target).toBe(host);
    expect(event.detail.config.tap_action).toEqual({ action: 'url', url_path: url });
    expect(open).not.toHaveBeenCalled();
  });

  it.each([
    'javascript:alert(1)',
    '  JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
  ])('blocks the dangerous URL %s with useful feedback', (url) => {
    const { homeAssistant, host } = createLovelaceTree();
    const actionConfig = config({ tap_action: { action: 'url', url_path: url } });
    const actionListener = vi.fn();
    const notificationListener = vi.fn();
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    homeAssistant.addEventListener('hass-action', actionListener);
    homeAssistant.addEventListener('hass-notification', notificationListener);

    new ActionController(
      () => host,
      () => actionConfig,
    ).pointerUp();

    const message = 'Floating Battery Card: blocked an unsafe URL in tap_action.';
    expect(actionListener).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(notificationListener).toHaveBeenCalledOnce();
    expect((notificationListener.mock.calls[0]![0] as CustomEvent).detail).toEqual({ message });
    expect(warn).toHaveBeenCalledWith(message, actionConfig.tap_action);
  });
});
