const EN = {
  entities: 'Entities & values',
  state_mapping: 'State mapping',
  thresholds: 'Thresholds & colors',
  icons: 'Icons',
  display: 'Display',
  position: 'Position',
  appearance: 'Appearance',
  ring: 'Progress ring',
  animations: 'Animations',
  behavior: 'Visibility & behavior',
  actions: 'Actions',
  advanced: 'Advanced',
};

export type TranslationKey = keyof typeof EN;
export const localize = (key: TranslationKey): string => EN[key];
