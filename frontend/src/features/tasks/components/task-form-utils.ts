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
