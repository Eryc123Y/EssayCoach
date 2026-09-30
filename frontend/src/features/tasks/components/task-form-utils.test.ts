import { describe, expect, it } from 'vitest';
import {
  OPTIONAL_SELECT_SENTINEL,
  fromOptionalSelectValue,
  fromRequiredSelectValue,
  toOptionalSelectValue,
  toDatetimeLocalValue,
} from './task-form-utils';

describe('task-form-utils', () => {
  it('maps optional values to sentinel and back', () => {
    expect(toOptionalSelectValue(undefined)).toBe(OPTIONAL_SELECT_SENTINEL);
    expect(toOptionalSelectValue(null)).toBe(OPTIONAL_SELECT_SENTINEL);
    expect(toOptionalSelectValue(12)).toBe('12');

    expect(fromOptionalSelectValue(OPTIONAL_SELECT_SENTINEL)).toBeUndefined();
    expect(fromOptionalSelectValue('12')).toBe(12);
  });

  it('guards against invalid numeric parsing', () => {
    expect(fromOptionalSelectValue('abc')).toBeUndefined();
    expect(fromRequiredSelectValue('abc', 7)).toBe(7);
    expect(fromRequiredSelectValue('42', 7)).toBe(42);
  });

  it('round trips a local due time through the API ISO value', () => {
    const chosenLocalTime = '2026-10-02T12:00';
    expect(toDatetimeLocalValue(new Date(chosenLocalTime).toISOString())).toBe(chosenLocalTime);
  });
});
