import { afterEach, describe, expect, it } from 'vitest';
import type { HomeAssistant } from 'custom-card-helpers';
import type { HassEntity } from 'home-assistant-js-websocket';

import '../src/floating-battery-overlay';
import type { FloatingBatteryOverlay } from '../src/floating-battery-overlay';
import { normalizeConfig } from '../src/normalize';
import type { UnavailableBehavior } from '../src/types';

function entity(entityId: string, state: string): HassEntity {
  return {
    entity_id: entityId,
    state,
    attributes: {},
    context: { id: '', parent_id: null, user_id: null },
    last_changed: '',
    last_updated: '',
  };
}

function hassWithState(state: string): HomeAssistant {
  return {
    states: {
      'sensor.battery': entity('sensor.battery', '50'),
      'sensor.battery_state': entity('sensor.battery_state', state),
    },
  } as unknown as HomeAssistant;
}

async function renderOverlay(
  unavailable: UnavailableBehavior,
  state = 'unknown',
): Promise<FloatingBatteryOverlay> {
  const host = document.createElement('floating-battery-card');
  const overlay = document.createElement('floating-battery-overlay');
  overlay.hass = hassWithState(state);
  overlay.sourceHost = host;
  overlay.setConfig(
    normalizeConfig({
      type: 'custom:floating-battery-card',
      entity: 'sensor.battery',
      state_entity: 'sensor.battery_state',
      behavior: { unavailable },
    }),
  );
  document.body.append(host, overlay);
  await overlay.updateComplete;
  return overlay;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('unavailable visibility', () => {
  it.each([
    ['show', true, '1'],
    ['dim', true, '0.45'],
    ['hide', false, undefined],
  ] as const)('renders mapped unavailable states in %s mode', async (mode, visible, opacity) => {
    const overlay = await renderOverlay(mode);
    const surface = overlay.shadowRoot!.querySelector<HTMLElement>('.surface');

    expect(Boolean(surface)).toBe(visible);
    if (visible) {
      const anchor = overlay.shadowRoot!.querySelector<HTMLElement>('.viewport-anchor');
      expect(anchor!.style.opacity).toBe(opacity);
    }
  });

  it('does not hide an available state that is only semantically unknown', async () => {
    const overlay = await renderOverlay('hide', 'idle');

    expect(overlay.shadowRoot!.querySelector('.surface')).not.toBeNull();
  });
});
