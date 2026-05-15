import {
  assertGstinChecksumValid,
  computeGstinCheckChar,
  GstinWithChecksumSchema,
} from './gstin-checksum.js';

describe('computeGstinCheckChar', () => {
  it('returns "V" for the known-good vector 27AAPFU0939F1ZV', () => {
    // The 15th char in the known-good GSTIN is `V`. Strip it + a
    // placeholder + recompute.
    expect(computeGstinCheckChar('27AAPFU0939F1ZX')).toBe('V');
  });

  it('returns the same checksum regardless of the placeholder 15th char', () => {
    expect(computeGstinCheckChar('27AAPFU0939F1ZA')).toBe(
      computeGstinCheckChar('27AAPFU0939F1ZZ'),
    );
  });

  it('throws when input length is not 15', () => {
    expect(() => computeGstinCheckChar('SHORT')).toThrow(/15-char/);
  });

  it('throws when input contains an invalid character in positions 1..14', () => {
    // `@` at position 4 — within the iteration range so the alphabet
    // lookup fails fast.
    expect(() => computeGstinCheckChar('27A@PFU0939F1ZV')).toThrow(/Invalid GSTIN char/);
  });
});

describe('assertGstinChecksumValid', () => {
  it('returns true for the known-good vector 27AAPFU0939F1ZV', () => {
    expect(assertGstinChecksumValid('27AAPFU0939F1ZV')).toBe(true);
  });

  it('returns false for a wrong-checksum GSTIN', () => {
    expect(assertGstinChecksumValid('27AAPFU0939F1ZA')).toBe(false);
  });

  it('returns false for input that is not 15 chars', () => {
    expect(assertGstinChecksumValid('27AAPFU0939F1Z')).toBe(false);
  });

  it('returns false for input containing invalid chars', () => {
    expect(assertGstinChecksumValid('27AAPFU0939F1Z@')).toBe(false);
  });
});

describe('GstinWithChecksumSchema', () => {
  it('accepts a valid GSTIN with correct checksum', () => {
    const result = GstinWithChecksumSchema.safeParse('27AAPFU0939F1ZV');
    expect(result.success).toBe(true);
  });

  it('rejects a GSTIN whose checksum is wrong', () => {
    const result = GstinWithChecksumSchema.safeParse('27AAPFU0939F1ZA');
    expect(result.success).toBe(false);
  });

  it('rejects a malformed GSTIN (regex fails before checksum even runs)', () => {
    const result = GstinWithChecksumSchema.safeParse('not-a-gstin');
    expect(result.success).toBe(false);
  });
});
