import type { IconName } from '@/components/ui/Icon';

const RULES: Array<[RegExp, IconName]> = [
  [/(rent|housing|mortgage|home|utilit|electric|water|gas\b)/i, 'home-icon'],
  [/(grocer|supermarket|food|carrefour|sonae|aldi|lidl)/i, 'food'],
  [/(restaurant|dining|cafe|coffee|bar|pub)/i, 'food'],
  [/(transit|transport|bolt|uber|taxi|metro|bus|train|tram|fuel|petrol|gasoline|car)/i, 'car'],
  [/(travel|flight|airfare|hotel|airbnb|vacation|holiday|tap|ryanair|lufthansa)/i, 'plane'],
  [/(shop|clothes|fashion|amazon|zalando)/i, 'shopping'],
  [/(subscription|spotify|netflix|youtube|music|movie|cinema|entertain)/i, 'film'],
  [/(health|pharma|doctor|dentist|medic|hospital|gym|fitness)/i, 'health'],
  [/(book|education|course|learning|udemy)/i, 'book'],
  [/(gift|present|donation|charity)/i, 'gift'],
  [/(salary|payroll|deel|wage|income|bonus)/i, 'briefcase'],
  [/(tool|repair|maintenance|service)/i, 'tools'],
];

/** Best-effort category-name → icon. Falls back to `tag`. */
export function categoryIcon(name: string | null | undefined): IconName {
  const s = (name ?? '').trim();
  if (!s) return 'tag';
  for (const [re, icon] of RULES) {
    if (re.test(s)) return icon;
  }
  return 'tag';
}
