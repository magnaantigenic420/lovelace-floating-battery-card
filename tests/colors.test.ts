import { describe, expect, it } from 'vitest';

import { normalizeConfig } from '../src/normalize';
import type { BatterySnapshot } from '../src/types';
import { resolveColors } from '../src/utils';

const config = normalizeConfig({
  type: 'custom:floating-battery-card',
  entity: 'sensor.battery',
});

function snapshot(overrides: Partial<BatterySnapshot> = {}): BatterySnapshot {
  return {
    rawLevel: 100,
    normalizedLevel: 100,
    displayLevel: 100,
    semanticState: 'full',
    available: true,
    icon: 'mdi:battery',
    threshold: config.thresholds[2],
    levelText: '100',
    unitText: '%',
    name: 'Battery',
    ...overrides,
  };
}

describe('color resolution', () => {
  it('uses threshold color as a foreground accent without painting the background', () => {
    const colors = resolveColors(snapshot(), config);

    expect(colors.icon).toBe('var(--success-color, #4caf50)');
    expect(colors.text).toBe('var(--success-color, #4caf50)');
    expect(colors.background).toBe(config.colors.background);
    expect(colors.border).toBe(config.colors.border);
  });

  it('uses explicit threshold background and border colors when configured', () => {
    const colors = resolveColors(
      snapshot({
        threshold: {
          max: 100,
          color: 'green',
          background_color: 'black',
          border_color: 'white',
        },
      }),
      config,
    );

    expect(colors.icon).toBe('green');
    expect(colors.text).toBe('green');
    expect(colors.background).toBe('black');
    expect(colors.border).toBe('white');
  });
});
