import { en } from './en';
import { zh } from './zh';

export type MessageId = keyof typeof en;
export type Locale = 'en' | 'zh';

const catalogs: Record<Locale, Record<MessageId, string>> = { en, zh };

export function message(id: MessageId, locale: Locale): string {
  return catalogs[locale][id];
}
