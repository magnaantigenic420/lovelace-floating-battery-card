import { describe, expect, it } from 'vitest';

import { normalizeConfig } from '../src/normalize';
import { positionStyles } from '../src/position';

const base = { type: 'custom:floating-battery-card', entity: 'sensor.battery' } as const;

describe('positionStyles', () => {
  it('defaults to fixed bottom-right and safe-area offsets', () => {
    const styles = positionStyles(normalizeConfig(base));
    expect(styles.position).toBe('fixed');
    expect(styles.right).toContain('16px');
    expect(styles.right).toContain('safe-area-inset-right');
    expect(styles.bottom).toContain('safe-area-inset-bottom');
  });

  it('supports bottom-left and inline mode', () => {
    const left = positionStyles(normalizeConfig({ ...base, position: { anchor: 'bottom-left' } }));
    expect(left.left).toContain('16px');
    expect(left.right).toBeUndefined();

    const inline = positionStyles(normalizeConfig({ ...base, position: { mode: 'inline' } }));
    expect(inline.position).toBe('relative');
  });
});
