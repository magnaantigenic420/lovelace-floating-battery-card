import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { HomeAssistant, LovelaceCardEditor } from 'custom-card-helpers';
import {
  DEFAULT_ANIMATION,
  DEFAULT_APPEARANCE,
  DEFAULT_BEHAVIOR,
  DEFAULT_DISPLAY,
  DEFAULT_ICONS,
  DEFAULT_POSITION,
  DEFAULT_RING,
  DEFAULT_STATE_MAP,
  DEFAULT_THRESHOLDS,
} from './defaults';
import type { FloatingBatteryCardConfig } from './types';

@customElement('floating-battery-card-editor')
export class FloatingBatteryCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config?: FloatingBatteryCardConfig;

  public setConfig(config: FloatingBatteryCardConfig): void {
    this.config = structuredClone(config);
  }

  protected override render(): TemplateResult | typeof nothing {
    if (!this.config || !this.hass) return nothing;
    const c = this.config;
    return html`<div class="editor">
      ${this.section('Entities & values', html`
        ${this.selector('entity', 'Battery level entity', { entity: {} }, c.entity, true)}
        ${this.selector('state_entity', 'Battery state entity', { entity: {} }, c.state_entity ?? '')}
        <div class="grid">${this.text('level_attribute', 'Level attribute', c.level_attribute ?? '')}${this.text('state_attribute', 'State attribute', c.state_attribute ?? '')}</div>
        <div class="grid">${this.number('min_level', 'Minimum raw level', c.min_level ?? 0)}${this.number('max_level', 'Maximum raw level', c.max_level ?? 100)}${this.number('precision', 'Decimals', c.precision ?? 0, 1, 0, 4)}${this.number('full_threshold', 'Full threshold', c.full_threshold ?? 100, 1, 0, 100)}</div>
        ${this.text('unit', 'Unit', c.unit ?? '%')}
        <div class="switches">${this.toggle('clamp_level', 'Clamp 0–100%', c.clamp_level ?? true)}${this.toggle('invert_level', 'Invert level', c.invert_level ?? false)}</div>
      `, true)}

      ${this.section('State mapping', html`
        <p class="hint">Add the exact raw values your battery-state entity can report. Matching is case-insensitive by default.</p>
        ${this.multiText('state_map.charging', 'Charging states', c.state_map?.charging ?? DEFAULT_STATE_MAP.charging)}
        ${this.multiText('state_map.not_charging', 'Not charging states', c.state_map?.not_charging ?? DEFAULT_STATE_MAP.not_charging)}
        ${this.multiText('state_map.full', 'Full states', c.state_map?.full ?? DEFAULT_STATE_MAP.full)}
        ${this.multiText('state_map.unavailable', 'Unavailable states', c.state_map?.unavailable ?? DEFAULT_STATE_MAP.unavailable)}
        <div class="grid">${this.selector('state_map.case_sensitive', 'Case sensitive', { boolean: {} }, c.state_map?.case_sensitive ?? false)}${this.selector('state_map.normalize_whitespace', 'Normalize whitespace', { boolean: {} }, c.state_map?.normalize_whitespace ?? true)}</div>
      `)}

      ${this.section('Thresholds & colors', this.thresholds())}

      ${this.section('Icons & display', html`
        ${this.selector('icons.default', 'Default icon', { icon: {} }, c.icons?.default ?? DEFAULT_ICONS.default)}
        ${this.selector('icons.charging', 'Charging icon', { icon: {} }, c.icons?.charging ?? DEFAULT_ICONS.charging)}
        ${this.selector('icons.full', 'Full icon', { icon: {} }, c.icons?.full ?? DEFAULT_ICONS.full)}
        ${this.selector('icons.unavailable', 'Unavailable icon', { icon: {} }, c.icons?.unavailable ?? DEFAULT_ICONS.unavailable)}
        <div class="switches">${this.toggle('icons.dynamic_level', 'Dynamic level icons', c.icons?.dynamic_level ?? false)}${this.toggle('icons.dynamic_charging_level', 'Dynamic charging icons', c.icons?.dynamic_charging_level ?? false)}</div>
        <div class="switches">${this.toggle('display.show_icon', 'Show icon', c.display?.show_icon ?? true)}${this.toggle('display.show_level', 'Show level', c.display?.show_level ?? true)}${this.toggle('display.show_unit', 'Show unit', c.display?.show_unit ?? true)}${this.toggle('display.show_name', 'Show name', c.display?.show_name ?? false)}</div>
        ${this.text('display.name', 'Custom name', c.display?.name ?? '')}
        ${this.select('display.layout', 'Layout', c.display?.layout ?? DEFAULT_DISPLAY.layout, [['stacked','Stacked'],['horizontal','Horizontal'],['overlay','Overlay']])}
        ${this.select('display.tooltip', 'Tooltip', c.display?.tooltip ?? DEFAULT_DISPLAY.tooltip, [['automatic','Automatic'],['custom','Custom'],['disabled','Disabled']])}
        ${this.text('display.tooltip_text', 'Custom tooltip', c.display?.tooltip_text ?? '')}
      `)}

      ${this.section('Position', html`
        ${this.select('position.mode', 'Mode', c.position?.mode ?? DEFAULT_POSITION.mode, [['viewport','Viewport floating'],['inline','Inline']])}
        ${this.select('position.anchor', 'Anchor', c.position?.anchor ?? DEFAULT_POSITION.anchor, [['top-left','Top left'],['top-center','Top center'],['top-right','Top right'],['middle-left','Middle left'],['center','Center'],['middle-right','Middle right'],['bottom-left','Bottom left'],['bottom-center','Bottom center'],['bottom-right','Bottom right'],['custom','Custom']])}
        <div class="grid">${this.dimension('position.offset_x','Horizontal offset',c.position?.offset_x ?? 16)}${this.dimension('position.offset_y','Vertical offset',c.position?.offset_y ?? 16)}${this.dimension('position.edge_margin','Edge margin',c.position?.edge_margin ?? 0)}${this.number('position.z_index','Z-index',c.position?.z_index ?? 1000)}</div>
        ${this.toggle('position.safe_area','Respect safe areas',c.position?.safe_area ?? true)}
        <div class="grid">${this.dimension('position.top','Custom top',c.position?.top ?? '')}${this.dimension('position.right','Custom right',c.position?.right ?? '')}${this.dimension('position.bottom','Custom bottom',c.position?.bottom ?? '')}${this.dimension('position.left','Custom left',c.position?.left ?? '')}</div>
      `)}

      ${this.section('Appearance', html`
        <div class="grid">${this.dimension('appearance.size','Size',c.appearance?.size ?? 72)}${this.select('appearance.shape','Shape',c.appearance?.shape ?? DEFAULT_APPEARANCE.shape,[['circle','Circle'],['rounded-square','Rounded square'],['square','Square']])}${this.dimension('appearance.width','Width override',c.appearance?.width ?? '')}${this.dimension('appearance.height','Height override',c.appearance?.height ?? '')}${this.dimension('appearance.padding','Padding',c.appearance?.padding ?? 6)}${this.dimension('appearance.border_radius','Border radius',c.appearance?.border_radius ?? '')}${this.dimension('appearance.icon_size','Icon size',c.appearance?.icon_size ?? 27)}${this.dimension('appearance.text_size','Text size',c.appearance?.text_size ?? 13)}</div>
        ${this.text('colors.background','Background color',c.colors?.background ?? '')}${this.text('colors.icon','Default icon color',c.colors?.icon ?? '')}${this.text('colors.text','Default text color',c.colors?.text ?? '')}${this.text('colors.border','Border color',c.colors?.border ?? '')}${this.text('appearance.box_shadow','Box shadow',c.appearance?.box_shadow ?? DEFAULT_APPEARANCE.box_shadow)}
        <div class="grid">${this.dimension('appearance.border_width','Border width',c.appearance?.border_width ?? 0)}${this.dimension('appearance.backdrop_blur','Backdrop blur',c.appearance?.backdrop_blur ?? 0)}${this.number('appearance.opacity','Opacity',c.appearance?.opacity ?? 1,0.05,0,1)}${this.number('appearance.background_opacity','Background opacity',c.appearance?.background_opacity ?? 1,0.05,0,1)}</div>
      `)}

      ${this.section('Progress ring', html`
        ${this.toggle('ring.enabled','Enable ring',c.ring?.enabled ?? false)}
        <div class="grid">${this.number('ring.width','Ring width',c.ring?.width ?? DEFAULT_RING.width,1,1)}${this.number('ring.inset','Ring inset',c.ring?.inset ?? DEFAULT_RING.inset,1,0)}${this.text('ring.track_color','Track color',c.ring?.track_color ?? DEFAULT_RING.track_color)}${this.text('ring.color','Fixed ring color',c.ring?.color ?? '')}</div>
        ${this.select('ring.color_mode','Ring color mode',c.ring?.color_mode ?? DEFAULT_RING.color_mode,[['threshold','Threshold'],['fixed','Fixed']])}
        ${this.toggle('ring.clockwise','Clockwise',c.ring?.clockwise ?? true)}${this.toggle('ring.rounded_caps','Rounded caps',c.ring?.rounded_caps ?? true)}
      `)}

      ${this.section('Animations', html`
        ${this.select('animation.charging','Charging animation',c.animation?.charging ?? DEFAULT_ANIMATION.charging,[['none','None'],['pulse','Pulse'],['breathe','Breathe'],['glow','Glow'],['rotate','Rotate']])}
        ${this.select('animation.low_battery','Low battery animation',c.animation?.low_battery ?? DEFAULT_ANIMATION.low_battery,[['none','None'],['pulse','Pulse'],['blink','Blink']])}
        ${this.select('animation.hover','Hover animation',c.animation?.hover ?? DEFAULT_ANIMATION.hover,[['none','None'],['scale','Scale'],['lift','Lift']])}
        <div class="grid">${this.number('animation.duration','Duration (ms)',c.animation?.duration ?? 1200,50,0)}${this.number('animation.low_battery_threshold','Low threshold',c.animation?.low_battery_threshold ?? 15,1,0,100)}</div>
        <div class="switches">${this.toggle('animation.respect_reduced_motion','Respect reduced motion',c.animation?.respect_reduced_motion ?? true)}${this.toggle('animation.disabled','Disable all animations',c.animation?.disabled ?? false)}</div>
      `)}

      ${this.section('Visibility & behavior', html`
        ${this.select('behavior.unavailable','Unavailable behavior',c.behavior?.unavailable ?? DEFAULT_BEHAVIOR.unavailable,[['show','Show'],['dim','Dim'],['hide','Hide']])}
        <div class="switches">${this.toggle('behavior.hide_when_full','Hide when full',c.behavior?.hide_when_full ?? false)}${this.toggle('behavior.hide_when_charging','Hide when charging',c.behavior?.hide_when_charging ?? false)}${this.toggle('behavior.hide_when_not_charging','Hide when not charging',c.behavior?.hide_when_not_charging ?? false)}${this.toggle('behavior.pointer_events','Pointer events',c.behavior?.pointer_events ?? true)}</div>
        <div class="grid">${this.number('behavior.min_viewport_width','Min viewport width',c.behavior?.min_viewport_width ?? 0,1,0)}${this.number('behavior.max_viewport_width','Max viewport width',c.behavior?.max_viewport_width ?? 0,1,0)}${this.number('behavior.compact_below_width','Compact below width',c.behavior?.compact_below_width ?? 0,1,0)}${this.dimension('behavior.compact_size','Compact size',c.behavior?.compact_size ?? 56)}${this.number('behavior.auto_hide_delay','Auto-hide delay (ms)',c.behavior?.auto_hide_delay ?? 0,100,0)}</div>
        ${this.selector('behavior.more_info_entity','More-info entity override',{ entity: {} },c.behavior?.more_info_entity ?? '')}
      `)}

      ${this.section('Actions', html`
        ${this.selector('tap_action','Tap action',{ ui_action: {} },c.tap_action ?? { action: 'more-info' })}
        ${this.selector('hold_action','Hold action',{ ui_action: {} },c.hold_action ?? { action: 'none' })}
        ${this.selector('double_tap_action','Double-tap action',{ ui_action: {} },c.double_tap_action ?? { action: 'none' })}
      `)}
    </div>`;
  }

  private thresholds(): TemplateResult {
    const rows = this.config?.thresholds ?? DEFAULT_THRESHOLDS;
    return html`<p class="hint">Rows are normalized by ascending max. Color is shorthand; per-property colors override it.</p>${rows.map((t,i)=>html`<div class="threshold"><header><b>Band ${i+1}</b><span><button @click=${()=>this.moveThreshold(i,-1)} ?disabled=${i===0}>↑</button><button @click=${()=>this.moveThreshold(i,1)} ?disabled=${i===rows.length-1}>↓</button><button @click=${()=>this.removeThreshold(i)}>×</button></span></header><div class="grid">${this.number(`thresholds.${i}.min`,'Min',t.min ?? '')}${this.number(`thresholds.${i}.max`,'Max',t.max)}</div>${this.text(`thresholds.${i}.color`,'Color',t.color ?? '')}<div class="grid">${this.text(`thresholds.${i}.icon_color`,'Icon color',t.icon_color ?? '')}${this.text(`thresholds.${i}.text_color`,'Text color',t.text_color ?? '')}${this.text(`thresholds.${i}.background_color`,'Background',t.background_color ?? '')}${this.text(`thresholds.${i}.border_color`,'Border',t.border_color ?? '')}${this.text(`thresholds.${i}.ring_color`,'Ring',t.ring_color ?? '')}${this.selector(`thresholds.${i}.icon`,'Icon override',{ icon: {} },t.icon ?? '')}</div></div>`)}<button @click=${this.addThreshold}>+ Add threshold</button>`;
  }

  private section(title:string, content:TemplateResult, open=false):TemplateResult { return html`<details ?open=${open}><summary>${title}</summary><div class="body">${content}</div></details>`; }
  private selector(path:string,label:string,selector:object,value:unknown,required=false):TemplateResult { return html`<ha-selector .hass=${this.hass} .selector=${selector} .value=${value} .label=${label} .required=${required} @value-changed=${(e:CustomEvent)=>this.setPath(path,e.detail.value)}></ha-selector>`; }
  private text(path:string,label:string,value:string):TemplateResult { return html`<ha-textfield .label=${label} .value=${value} @input=${(e:Event)=>this.setPath(path,(e.target as HTMLInputElement).value)}></ha-textfield>`; }
  private dimension(path:string,label:string,value:number|string):TemplateResult { return this.text(path,label,String(value ?? '')); }
  private number(path:string,label:string,value:number|string,step=1,min?:number,max?:number):TemplateResult { return html`<ha-textfield type="number" .label=${label} .value=${String(value ?? '')} .step=${String(step)} .min=${min===undefined?'':String(min)} .max=${max===undefined?'':String(max)} @input=${(e:Event)=>{const raw=(e.target as HTMLInputElement).value;this.setPath(path,raw===''?undefined:Number(raw));}}></ha-textfield>`; }
  private toggle(path:string,label:string,checked:boolean):TemplateResult { return html`<ha-formfield .label=${label}><ha-switch .checked=${checked} @change=${(e:Event)=>this.setPath(path,(e.target as HTMLInputElement).checked)}></ha-switch></ha-formfield>`; }
  private select(path:string,label:string,value:unknown,options:Array<[string,string]>):TemplateResult { return this.selector(path,label,{select:{options:options.map(([v,l])=>({value:v,label:l})),mode:'dropdown'}},value); }
  private multiText(path:string,label:string,values:string[]):TemplateResult { return this.selector(path,label,{text:{multiple:true}},values); }

  private readonly addThreshold=():void=>{const rows=[...(this.config?.thresholds ?? DEFAULT_THRESHOLDS)].map(v=>({...v}));rows.push({max:Math.min(100,(rows.at(-1)?.max ?? 0)+10),color:'var(--primary-color)'});this.setPath('thresholds',rows);};
  private removeThreshold(index:number):void { const rows=[...(this.config?.thresholds ?? DEFAULT_THRESHOLDS)].map(v=>({...v}));rows.splice(index,1);this.setPath('thresholds',rows.length?rows:[{max:100,color:'var(--primary-color)'}]); }
  private moveThreshold(index:number,direction:-1|1):void { const rows=[...(this.config?.thresholds ?? DEFAULT_THRESHOLDS)].map(v=>({...v}));const target=index+direction;if(target<0||target>=rows.length)return;[rows[index],rows[target]]=[rows[target]!,rows[index]!];this.setPath('thresholds',rows); }

  private setPath(path:string,value:unknown):void {
    if(!this.config)return;
    const next=structuredClone(this.config) as Record<string,any>;
    const parts=path.split('.'); let cursor:Record<string,any>|any[]=next;
    for(let i=0;i<parts.length-1;i+=1){const p=parts[i]!;const np=parts[i+1]!;if(Array.isArray(cursor)){const n=Number(p);cursor[n]??=/^\d+$/.test(np)?[]:{};cursor=cursor[n];}else{cursor[p]??=/^\d+$/.test(np)?[]:{};cursor=cursor[p];}}
    const last=parts.at(-1)!;
    if(Array.isArray(cursor)){const n=Number(last);if(value===undefined||value==='')delete cursor[n];else cursor[n]=value;}else if(value===undefined||value==='')delete cursor[last];else cursor[last]=value;
    this.config=next as FloatingBatteryCardConfig;
    this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this.config},bubbles:true,composed:true}));
  }

  static override styles=css`
    :host{display:block}.editor{display:grid;gap:10px}details{border:1px solid var(--divider-color,rgba(127,127,127,.3));border-radius:12px;overflow:hidden}summary{cursor:pointer;padding:14px 16px;font-weight:600}.body{display:grid;gap:13px;padding:3px 16px 16px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.switches{display:flex;flex-wrap:wrap;gap:10px 18px}ha-selector,ha-textfield{display:block;width:100%}.hint{margin:0;color:var(--secondary-text-color);font-size:.9em}.threshold{display:grid;gap:9px;padding:11px;border:1px solid var(--divider-color,rgba(127,127,127,.25));border-radius:10px}.threshold header{display:flex;align-items:center;justify-content:space-between}.threshold header span{display:flex;gap:4px}button{border:0;border-radius:8px;padding:6px 9px;cursor:pointer;background:var(--secondary-background-color,rgba(127,127,127,.15));color:var(--primary-text-color)}button:disabled{opacity:.35;cursor:default}@media(max-width:500px){.grid{grid-template-columns:1fr}}
  `;
}

declare global { interface HTMLElementTagNameMap { 'floating-battery-card-editor': FloatingBatteryCardEditor; } }
