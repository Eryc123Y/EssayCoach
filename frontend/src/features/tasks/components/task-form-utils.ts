export const OPTIONAL_SELECT_SENTINEL = 'none';

export function toOptionalSelectValue(value: number | null | undefined): string {
  if (typeof value !== 'number') {
    return OPTIONAL_SELECT_SENTINEL;
  }
  return String(value);
}

export function fromOptionalSelectValue(value: string): number | undefined {
  if (value === OPTIONAL_SELECT_SENTINEL) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export function fromRequiredSelectValue(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function toDatetimeLocalValue(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
