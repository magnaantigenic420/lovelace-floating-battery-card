import { afterEach, describe, expect, it } from 'vitest';
import type { HomeAssistant } from 'custom-card-helpers';
import type { HassEntity } from 'home-assistant-js-websocket';

import '../src/editor';
import '../src/floating-battery-overlay';
import type { FloatingBatteryCardEditor } from '../src/editor';
import type { FloatingBatteryOverlay } from '../src/floating-battery-overlay';
import { normalizeConfig } from '../src/normalize';
import { positionStyles } from '../src/position';
import type { FloatingBatteryCardConfig } from '../src/types';

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

function batteryEntity(state = '50'): HassEntity {
  return {
    entity_id: 'sensor.battery',
    state,
    attributes: {},
    context: { id: '', parent_id: null, user_id: null },
    last_changed: '',
    last_updated: '',
  };
}

function editTextField(
  editor: FloatingBatteryCardEditor,
  label: string,
  value: string,
): FloatingBatteryCardConfig {
  const field = [...editor.shadowRoot!.querySelectorAll('ha-textfield')].find(
    (candidate) => (candidate as HTMLElement & { label?: string }).label === label,
  ) as (HTMLElement & { value: string }) | undefined;
  expect(field).toBeDefined();

  let changed: FloatingBatteryCardConfig | undefined;
  editor.addEventListener(
    'config-changed',
    (event) => {
      changed = (event as CustomEvent<{ config: FloatingBatteryCardConfig }>).detail.config;
    },
    { once: true },
  );
  field!.value = value;
  field!.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  expect(changed).toBeDefined();
  return changed!;
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

describe('dimension editor', () => {
  it('stores bare numbers as pixels and keeps a circle square through rendering', async () => {
    const editor = createEditor();
    await editor.updateComplete;

    const changed = editTextField(editor, 'Size', '80');
    expect(changed.appearance?.size).toBe(80);

    const host = document.createElement('floating-battery-card');
    const overlay = document.createElement('floating-battery-overlay') as FloatingBatteryOverlay;
    overlay.hass = {
      states: { 'sensor.battery': batteryEntity() },
    } as unknown as HomeAssistant;
    overlay.sourceHost = host;
    overlay.setConfig(normalizeConfig(changed));
    document.body.append(host, overlay);
    await overlay.updateComplete;

    const surface = overlay.shadowRoot!.querySelector<HTMLElement>('.surface');
    expect(surface!.style.width).toBe('80px');
    expect(surface!.style.height).toBe('80px');
  });

  it('preserves explicit CSS lengths as strings', async () => {
    const editor = createEditor();
    await editor.updateComplete;

    const changed = editTextField(editor, 'Size', '1rem');

    expect(changed.appearance?.size).toBe('1rem');
    expect(normalizeConfig(changed).appearance.width).toBe('1rem');
  });

  it('produces valid pixel-based position calculations from bare numbers', async () => {
    const editor = createEditor();
    await editor.updateComplete;

    const changed = editTextField(editor, 'Horizontal offset', '20');
    const styles = positionStyles(normalizeConfig(changed));

    expect(changed.position?.offset_x).toBe(20);
    expect(styles.right).toBe('calc(20px + 0px + env(safe-area-inset-right, 0px))');
  });
});
