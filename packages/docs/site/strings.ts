export type Locale = 'ja' | 'en';

export const strings = {
  ja: {
    prop: 'Prop',
    part: 'パーツ',
    type: '型・説明',
    default: '既定値',
    props: 'Props',
    none: 'なし',
    required: '必須',
    unspecified: '—',
  },
  en: {
    prop: 'Prop',
    part: 'Part',
    type: 'Type / notes',
    default: 'Default',
    props: 'Props',
    none: 'None',
    required: 'Required',
    unspecified: '—',
  },
} as const;
