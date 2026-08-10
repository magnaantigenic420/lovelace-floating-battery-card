import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HomeAssistant } from 'custom-card-helpers';
import type { HassEntity } from 'home-assistant-js-websocket';

import '../src/floating-battery-card';
import type { FloatingBatteryCard } from '../src/floating-battery-card';
import type { FloatingBatteryOverlay } from '../src/floating-battery-overlay';

function entity(state: string): HassEntity {
  return {
    entity_id: 'sensor.battery',
    state,
    attributes: {},
    context: { id: '', parent_id: null, user_id: null },
    last_changed: '',
    last_updated: '',
  };
}

function hass(state = '50'): HomeAssistant {
  return { states: { 'sensor.battery': entity(state) } } as unknown as HomeAssistant;
}

async function createCard(
  mode: 'inline' | 'viewport',
  autoHideDelay: number,
): Promise<{ card: FloatingBatteryCard; overlay: FloatingBatteryOverlay }> {
  const card = document.createElement('floating-battery-card') as FloatingBatteryCard;
  document.body.append(card);
  card.hass = hass();
  card.setConfig({
    type: 'custom:floating-battery-card',
    entity: 'sensor.battery',
    position: { mode },
    behavior: { auto_hide_delay: autoHideDelay },
  });
  await card.updateComplete;
  await Promise.resolve();
  const overlay =
    mode === 'inline'
      ? card.shadowRoot!.querySelector<FloatingBatteryOverlay>('floating-battery-overlay')
      : document.body.querySelector<FloatingBatteryOverlay>(
          'floating-battery-overlay[data-floating-battery-owner]',
        );
  expect(overlay).not.toBeNull();
  await overlay!.updateComplete;
  return { card, overlay: overlay! };
}

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe.each(['inline', 'viewport'] as const)('%s configuration lifecycle', (mode) => {
  it('clears an existing timer when auto-hide is disabled', async () => {
    vi.useFakeTimers();
    const { card, overlay } = await createCard(mode, 100);
    vi.advanceTimersByTime(50);

    card.setConfig({
      type: 'custom:floating-battery-card',
      entity: 'sensor.battery',
      position: { mode },
      behavior: { auto_hide_delay: 0 },
    });
    await card.updateComplete;
    await overlay.updateComplete;
    vi.advanceTimersByTime(100);
    await overlay.updateComplete;

    expect(overlay.shadowRoot!.querySelector('.surface')).not.toBeNull();
  });

  it('restores a previously auto-hidden overlay after configuration changes', async () => {
    vi.useFakeTimers();
    const { card, overlay } = await createCard(mode, 50);
    vi.advanceTimersByTime(50);
    await overlay.updateComplete;
    expect(overlay.shadowRoot!.querySelector('.surface')).toBeNull();

    card.setConfig({
      type: 'custom:floating-battery-card',
      entity: 'sensor.battery',
      position: { mode },
      behavior: { auto_hide_delay: 0 },
    });
    await card.updateComplete;
    await overlay.updateComplete;

    expect(overlay.shadowRoot!.querySelector('.surface')).not.toBeNull();
  });
});

describe('inline Home Assistant updates', () => {
  it('does not restart auto-hide as though the configuration changed', async () => {
    vi.useFakeTimers();
    const { card, overlay } = await createCard('inline', 100);
    vi.advanceTimersByTime(60);

    card.hass = hass('50');
    await card.updateComplete;
    await overlay.updateComplete;
    vi.advanceTimersByTime(40);
    await overlay.updateComplete;

    expect(overlay.shadowRoot!.querySelector('.surface')).toBeNull();
  });
});

describe('Home Assistant editor contexts', () => {
  it.each([
    'hui-card-options',
    'hui-card-edit-mode',
    'hui-card-preview',
    'hui-dialog-edit-card',
    'hui-card-element-editor',
  ])('renders viewport configuration inline and inert inside %s', async (tagName) => {
    const wrapper = document.createElement(tagName);
    const card = document.createElement('floating-battery-card') as FloatingBatteryCard;
    wrapper.append(card);
    document.body.append(wrapper);
    card.hass = hass();
    card.setConfig({
      type: 'custom:floating-battery-card',
      entity: 'sensor.battery',
      position: { mode: 'viewport' },
    });
    await card.updateComplete;

    const inlineOverlay = card.shadowRoot!.querySelector<FloatingBatteryOverlay>('floating-battery-overlay');
    expect(card.hasAttribute('inline')).toBe(true);
    expect(inlineOverlay).not.toBeNull();
    expect(inlineOverlay!.hasAttribute('inert')).toBe(true);
    expect(inlineOverlay!.config!.behavior.pointer_events).toBe(false);
    expect(document.body.querySelector('floating-battery-overlay[data-floating-battery-owner]')).toBeNull();
  });

  it('reacts to the Home Assistant card preview property', async () => {
    const { card, overlay } = await createCard('viewport', 0);

    card.preview = true;
    await card.updateComplete;

    const inlineOverlay = card.shadowRoot!.querySelector<FloatingBatteryOverlay>('floating-battery-overlay');
    expect(overlay.isConnected).toBe(false);
    expect(inlineOverlay).not.toBeNull();
    expect(inlineOverlay!.hasAttribute('inert')).toBe(true);
    expect(inlineOverlay!.config!.behavior.pointer_events).toBe(false);
  });

  it('keeps legacy card-preview class detection', async () => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('card-preview');
    const card = document.createElement('floating-battery-card') as FloatingBatteryCard;
    wrapper.append(card);
    document.body.append(wrapper);
    card.hass = hass();
    card.setConfig({
      type: 'custom:floating-battery-card',
      entity: 'sensor.battery',
      position: { mode: 'viewport' },
    });
    await card.updateComplete;

    expect(card.shadowRoot!.querySelector('floating-battery-overlay')).not.toBeNull();
    expect(document.body.querySelector('floating-battery-overlay[data-floating-battery-owner]')).toBeNull();
  });
});

describe('configuration validation', () => {
  it('surfaces malformed state maps from setConfig', () => {
    const card = document.createElement('floating-battery-card') as FloatingBatteryCard;

    expect(() =>
      card.setConfig({
        type: 'custom:floating-battery-card',
        entity: 'sensor.battery',
        state_map: { charging: ['Charging', 1] },
      } as unknown as Parameters<FloatingBatteryCard['setConfig']>[0]),
    ).toThrow('state_map.charging must be an array of strings.');
  });

  it('surfaces nested runtime validation errors from setConfig', () => {
    const card = document.createElement('floating-battery-card') as FloatingBatteryCard;

    expect(() =>
      card.setConfig({
        type: 'custom:floating-battery-card',
        entity: 'sensor.battery',
        appearance: { opacity: 2 },
      }),
    ).toThrow('appearance.opacity');
  });
});

describe('action execution', () => {
  it('opens more-info from a viewport overlay through the in-tree card host', async () => {
    const homeAssistant = document.createElement('home-assistant');
    const card = document.createElement('floating-battery-card') as FloatingBatteryCard;
    const received: CustomEvent[] = [];
    homeAssistant.addEventListener('hass-more-info', (event) => {
      received.push(event as CustomEvent);
    });
    homeAssistant.append(card);
    document.body.append(homeAssistant);
    card.hass = hass();
    card.setConfig({
      type: 'custom:floating-battery-card',
      entity: 'sensor.battery',
      position: { mode: 'viewport' },
      tap_action: { action: 'more-info' },
    });
    await card.updateComplete;

    const overlay = document.body.querySelector<FloatingBatteryOverlay>(
      'floating-battery-overlay[data-floating-battery-owner]',
    );
    await overlay!.updateComplete;
    const surface = overlay!.shadowRoot!.querySelector<HTMLElement>('.surface');
    surface!.dispatchEvent(new Event('pointerup', { bubbles: true, composed: true }));

    expect(received).toHaveLength(1);
    expect(received[0]!.target).toBe(card);
    expect(received[0]!.detail).toEqual({ entityId: 'sensor.battery' });
  });

  it('honors a more-info entity override without changing the configured source entity', async () => {
    const homeAssistant = document.createElement('home-assistant');
    const card = document.createElement('floating-battery-card') as FloatingBatteryCard;
    const received: CustomEvent[] = [];
    homeAssistant.addEventListener('hass-more-info', (event) => {
      received.push(event as CustomEvent);
    });
    homeAssistant.append(card);
    document.body.append(homeAssistant);
    card.hass = hass();
    card.setConfig({
      type: 'custom:floating-battery-card',
      entity: 'sensor.battery',
      behavior: { more_info_entity: 'sensor.battery_details' },
      tap_action: { action: 'more-info' },
    });
    await card.updateComplete;

    const overlay = document.body.querySelector<FloatingBatteryOverlay>(
      'floating-battery-overlay[data-floating-battery-owner]',
    );
    await overlay!.updateComplete;
    overlay!.shadowRoot!.querySelector<HTMLElement>('.surface')!.dispatchEvent(
      new Event('pointerup', { bubbles: true, composed: true }),
    );

    expect(received[0]!.detail).toEqual({ entityId: 'sensor.battery_details' });
  });
});

describe('Home Assistant grid sizing', () => {
  it('uses the hidden-card contract for viewport mode without disconnecting', async () => {
    const { card, overlay } = await createCard('viewport', 0);

    expect(card.hidden).toBe(true);
    expect(card.style.display).toBe('none');
    expect(card.connectedWhileHidden).toBe(true);
    expect(card.getGridOptions()).toEqual({
      columns: 3,
      rows: 1,
      min_columns: 1,
      min_rows: 1,
    });
    expect(overlay.isConnected).toBe(true);
  });

  it('reports a compact grid footprint for inline mode', async () => {
    const { card } = await createCard('inline', 0);

    expect(card.hidden).toBe(false);
    expect(card.getGridOptions()).toEqual({
      columns: 3,
      rows: 1,
      min_columns: 1,
      min_rows: 1,
    });
  });

  it('makes a viewport card visible and selectable in Sections edit mode', async () => {
    const { card } = await createCard('viewport', 0);
    const wrapper = document.createElement('hui-card-edit-mode');

    wrapper.append(card);
    document.body.append(wrapper);
    await Promise.resolve();
    await card.updateComplete;

    expect(card.hidden).toBe(false);
    expect(card.style.display).toBe('');
    expect(card.hasAttribute('inline')).toBe(true);
    expect(card.shadowRoot!.querySelector('floating-battery-overlay')).not.toBeNull();
  });
});
