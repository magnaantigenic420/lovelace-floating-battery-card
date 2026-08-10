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
  index = 0,
): FloatingBatteryCardConfig {
  const field = [...editor.shadowRoot!.querySelectorAll('ha-textfield')].filter(
    (candidate) => (candidate as HTMLElement & { label?: string }).label === label,
  )[index] as (HTMLElement & { value: string }) | undefined;
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

function editSelector(
  editor: FloatingBatteryCardEditor,
  label: string,
  value: unknown,
  index = 0,
): FloatingBatteryCardConfig {
  const selector = [...editor.shadowRoot!.querySelectorAll('ha-selector')].filter(
    (candidate) => (candidate as HTMLElement & { label?: string }).label === label,
  )[index] as HTMLElement | undefined;
  expect(selector).toBeDefined();

  let changed: FloatingBatteryCardConfig | undefined;
  editor.addEventListener(
    'config-changed',
    (event) => {
      changed = (event as CustomEvent<{ config: FloatingBatteryCardConfig }>).detail.config;
    },
    { once: true },
  );
  selector!.dispatchEvent(
    new CustomEvent('value-changed', {
      detail: { value },
      bubbles: true,
      composed: true,
    }),
  );
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

describe('threshold editor defaults', () => {
  it.each([
    { name: 'color', property: 'color', label: 'Band 2 color', value: '#123456', selector: false },
    { name: 'min', property: 'min', label: 'Band 2 minimum', value: '21', selector: false },
    { name: 'max', property: 'max', label: 'Band 2 maximum', value: '55', selector: false },
    {
      name: 'icon',
      property: 'icon',
      label: 'Band 2 icon override',
      value: 'mdi:battery-50',
      selector: true,
    },
    {
      name: 'animation',
      property: 'animation',
      label: 'Band 2 animation',
      value: 'pulse',
      selector: true,
    },
  ] as const)(
    'materializes all default rows before editing $name',
    async ({ property, label, value, selector }) => {
      const editor = createEditor();
      await editor.updateComplete;

      const changed = selector
        ? editSelector(editor, label, value)
        : editTextField(editor, label, value);
      const expected = property === 'min' || property === 'max' ? Number(value) : value;

      expect(changed.thresholds).toHaveLength(3);
      expect(changed.thresholds!.every((threshold) => threshold !== undefined)).toBe(true);
      expect(changed.thresholds!.map((threshold) => threshold.max)).toEqual(
        property === 'max' ? [20, 55, 100] : [20, 50, 100],
      );
      expect(changed.thresholds![1]![property]).toBe(expected);
      expect(changed.thresholds![0]).toMatchObject({ max: 20 });
      expect(changed.thresholds![2]).toMatchObject({ max: 100 });
    },
  );
});

describe('threshold editor controls', () => {
  it('gives every control a descriptive accessible name and omits move controls', async () => {
    const editor = createEditor();
    await editor.updateComplete;

    const thresholdSection = [...editor.shadowRoot!.querySelectorAll('details')].find(
      (section) => section.querySelector('summary')?.textContent === 'Thresholds & colors',
    )!;
    const controls = [
      ...thresholdSection.querySelectorAll<HTMLElement>('ha-textfield, ha-selector, button'),
    ];

    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      const name =
        (control as HTMLElement & { label?: string }).label ??
        control.getAttribute('aria-label') ??
        control.textContent?.trim();
      expect(name).toBeTruthy();
    }
    expect(thresholdSection.textContent).not.toContain('↑');
    expect(thresholdSection.textContent).not.toContain('↓');
  });

  it('displays and edits bands in the same order used at runtime', async () => {
    const thresholds = [
      { max: 100, color: 'green' },
      { max: 20, color: 'red' },
      { max: 50, color: 'orange' },
    ];
    const editor = createEditor({ thresholds });
    await editor.updateComplete;

    const maximums = [...editor.shadowRoot!.querySelectorAll('ha-textfield')]
      .filter((field) =>
        ((field as HTMLElement & { label?: string }).label ?? '').endsWith(' maximum'),
      )
      .map((field) => Number((field as HTMLElement & { value?: string }).value));

    expect(maximums).toEqual([20, 50, 100]);
    expect(maximums).toEqual(
      normalizeConfig({
        type: 'custom:floating-battery-card',
        entity: 'sensor.battery',
        thresholds,
      }).thresholds.map((threshold) => threshold.max),
    );

    const changed = editTextField(editor, 'Band 1 maximum', '70');
    expect(changed.thresholds!.map((threshold) => threshold.max)).toEqual([50, 70, 100]);
    expect(changed.thresholds!.map((threshold) => threshold.color)).toEqual([
      'orange',
      'red',
      'green',
    ]);
    await editor.updateComplete;
    const renderedAfterEdit = [...editor.shadowRoot!.querySelectorAll('ha-textfield')]
      .filter((field) =>
        ((field as HTMLElement & { label?: string }).label ?? '').endsWith(' maximum'),
      )
      .map((field) => Number((field as HTMLElement & { value?: string }).value));
    expect(renderedAfterEdit).toEqual([50, 70, 100]);
  });

  it('keeps the named remove action keyboard focusable and operable', async () => {
    const editor = createEditor();
    await editor.updateComplete;

    const remove = editor.shadowRoot!.querySelector<HTMLButtonElement>(
      'button[aria-label="Remove threshold band 1"]',
    )!;
    let changed: FloatingBatteryCardConfig | undefined;
    editor.addEventListener(
      'config-changed',
      (event) => {
        changed = (event as CustomEvent<{ config: FloatingBatteryCardConfig }>).detail.config;
      },
      { once: true },
    );

    expect(remove.tagName).toBe('BUTTON');
    expect(remove.tabIndex).toBe(0);
    remove.focus();
    expect(editor.shadowRoot!.activeElement).toBe(remove);
    expect(
      remove.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })),
    ).toBe(true);
    // Synthetic keyboard events do not perform browser default actions in Happy DOM.
    // This click is the native button activation that Enter produces in a browser.
    remove.click();

    expect(changed?.thresholds?.map((threshold) => threshold.max)).toEqual([50, 100]);
  });
});
