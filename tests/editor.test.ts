import { afterEach, describe, expect, it } from 'vitest';
import type { HomeAssistant } from 'custom-card-helpers';

import '../src/editor';
import type { FloatingBatteryCardEditor } from '../src/editor';

function createEditor(config: Record<string, unknown> = {}): FloatingBatteryCardEditor {
  const editor = document.createElement('floating-battery-card-editor') as FloatingBatteryCardEditor;
  editor.hass = { states: {} } as unknown as HomeAssistant;
  editor.setConfig({
    type: 'custom:floating-battery-card',
    entity: 'sensor.battery',
    ...config,
  });
  document.body.append(editor);
  return editor;
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('state mapping editor', () => {
  it('renders editable multi-value selectors with visible defaults', async () => {
    const editor = createEditor();
    await editor.updateComplete;

    const sections = [...editor.shadowRoot!.querySelectorAll('details')];
    const stateMapping = sections.find((section) => section.querySelector('summary')?.textContent === 'State mapping');
    expect(stateMapping).toBeDefined();

    const selectors = [...stateMapping!.querySelectorAll('ha-selector')] as Array<HTMLElement & {
      selector?: Record<string, unknown>;
      value?: unknown;
      label?: string;
    }>;

    expect(selectors).toHaveLength(6);

    const mappingSelectors = selectors.slice(0, 4);
    for (const selector of mappingSelectors) {
      expect(selector.selector).toEqual({ text: { multiple: true } });
      expect(Array.isArray(selector.value)).toBe(true);
      expect((selector.value as string[]).length).toBeGreaterThan(0);
    }

    expect(mappingSelectors[0]!.value).toEqual(['Charging']);
    expect(mappingSelectors[1]!.value).toEqual(['Not Charging', 'Discharging']);
    expect(mappingSelectors[2]!.value).toEqual(['Full']);
    expect(mappingSelectors[3]!.value).toEqual(['Unknown', 'Unavailable', 'unknown', 'unavailable']);
    expect(selectors[4]!.selector).toEqual({ boolean: {} });
    expect(selectors[5]!.selector).toEqual({ boolean: {} });
  });

  it('preserves custom state mappings supplied in YAML', async () => {
    const editor = createEditor({
      state_map: {
        charging: ['Charging', 'Fast charging'],
        not_charging: ['Idle'],
        full: ['full', 'charged'],
        unavailable: ['offline'],
      },
    });
    await editor.updateComplete;

    const sections = [...editor.shadowRoot!.querySelectorAll('details')];
    const stateMapping = sections.find((section) => section.querySelector('summary')?.textContent === 'State mapping');
    const selectors = [...stateMapping!.querySelectorAll('ha-selector')] as Array<HTMLElement & { value?: unknown }>;

    expect(selectors[0]!.value).toEqual(['Charging', 'Fast charging']);
    expect(selectors[1]!.value).toEqual(['Idle']);
    expect(selectors[2]!.value).toEqual(['full', 'charged']);
    expect(selectors[3]!.value).toEqual(['offline']);
  });
});
