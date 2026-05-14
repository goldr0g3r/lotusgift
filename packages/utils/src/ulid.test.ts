import { decodeUlidTime, ulid } from './ulid.js';

const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

describe('ulid', () => {
  it('returns a 26-char Crockford base32 string matching the ULID regex', () => {
    const id = ulid();
    expect(id).toHaveLength(26);
    expect(id).toMatch(ULID_REGEX);
  });

  it('generates unique values across many calls', () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      set.add(ulid());
    }
    expect(set.size).toBe(1000);
  });
});

describe('decodeUlidTime', () => {
  it('extracts a timestamp close to "now" from a freshly generated ULID', () => {
    const before = Date.now();
    const id = ulid();
    const after = Date.now();
    const ts = decodeUlidTime(id);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});
