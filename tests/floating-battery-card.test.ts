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
