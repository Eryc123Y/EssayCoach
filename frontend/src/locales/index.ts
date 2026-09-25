import { en } from './en';
import { zh } from './zh';

export type MessageId = keyof typeof en;
export type Locale = 'en' | 'zh';

const catalogs: Record<Locale, Record<MessageId, string>> = { en, zh };

export function message(id: MessageId, locale: Locale): string {
  return catalogs[locale][id];
}

// Dynamic copy still uses two arguments until its interpolation is migrated.
// Static copy uses a stable ID and comes from the catalogs above.
export function localized(locale: string, idOrEnglish: string, inlineChinese?: string): string {
  if (inlineChinese !== undefined) return locale === 'zh' ? inlineChinese : idOrEnglish;
  const selected = locale === 'zh' ? zh : en;
  return selected[idOrEnglish as MessageId] ?? idOrEnglish;
}
