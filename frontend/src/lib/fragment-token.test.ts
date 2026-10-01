import { describe, expect, it } from 'vitest';

import { parseFragmentToken } from './fragment-token';

describe('parseFragmentToken', () => {
  it('decodes a valid token from the fragment', () => {
    expect(parseFragmentToken('#token=reset%2Ftoken&source=email')).toEqual({
      token: 'reset/token', invalid: false
    });
  });

  it('returns an invalid result for malformed percent escapes', () => {
    expect(parseFragmentToken('#token=%')).toEqual({ token: null, invalid: true });
  });

  it('distinguishes a missing token from an invalid token', () => {
    expect(parseFragmentToken('#source=email')).toEqual({ token: null, invalid: false });
  });
});
