import {
  EmailLowercaseSchema,
  GstinIndiaSchema,
  InrPaiseSchema,
  IsoDateSchema,
  IsoDateTimeSchema,
  PhoneIndiaE164Schema,
  PincodeIndiaSchema,
  R2ObjectKeySchema,
  UlidSchema,
  UrlSchema,
} from './scalars.js';

describe('UlidSchema', () => {
  it('accepts a canonical 26-char Crockford base32 ULID', () => {
    expect(UlidSchema.parse('01ARZ3NDEKTSV4RRFFQ69G5FAV')).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
  });

  it('uppercases lowercase input before validating', () => {
    expect(UlidSchema.parse('01arz3ndektsv4rrffq69g5fav')).toBe('01ARZ3NDEKTSV4RRFFQ69G5FAV');
  });

  it('rejects strings containing excluded base32 chars (I, L, O, U)', () => {
    expect(() => UlidSchema.parse('01ARZ3NDEKTSV4RRFFQ69G5FAI')).toThrow();
    expect(() => UlidSchema.parse('01ARZ3NDEKTSV4RRFFQ69G5FAL')).toThrow();
  });

  it('rejects wrong-length strings', () => {
    expect(() => UlidSchema.parse('01ARZ3NDEK')).toThrow();
    expect(() => UlidSchema.parse('01ARZ3NDEKTSV4RRFFQ69G5FAVX')).toThrow();
  });
});

describe('InrPaiseSchema', () => {
  it('accepts non-negative integers', () => {
    expect(InrPaiseSchema.parse(0)).toBe(0);
    expect(InrPaiseSchema.parse(100)).toBe(100);
    expect(InrPaiseSchema.parse(10_000_000)).toBe(10_000_000);
  });

  it('rejects negative numbers', () => {
    expect(() => InrPaiseSchema.parse(-1)).toThrow();
  });

  it('rejects fractional numbers', () => {
    expect(() => InrPaiseSchema.parse(99.5)).toThrow();
  });
});

describe('GstinIndiaSchema', () => {
  it('accepts a valid GSTIN format', () => {
    expect(GstinIndiaSchema.parse('27ABCDE1234F1Z5')).toBe('27ABCDE1234F1Z5');
  });

  it('uppercases lowercase input', () => {
    expect(GstinIndiaSchema.parse('27abcde1234f1z5')).toBe('27ABCDE1234F1Z5');
  });

  it('rejects wrong length', () => {
    expect(() => GstinIndiaSchema.parse('27ABCDE1234F1Z')).toThrow();
    expect(() => GstinIndiaSchema.parse('27ABCDE1234F1Z55')).toThrow();
  });

  it('rejects missing literal Z in position 14', () => {
    expect(() => GstinIndiaSchema.parse('27ABCDE1234F1A5')).toThrow();
  });
});

describe('PhoneIndiaE164Schema', () => {
  it('accepts a +91 mobile starting 6-9', () => {
    expect(PhoneIndiaE164Schema.parse('+919876543210')).toBe('+919876543210');
    expect(PhoneIndiaE164Schema.parse('+916012345678')).toBe('+916012345678');
  });

  it('rejects without +91 prefix', () => {
    expect(() => PhoneIndiaE164Schema.parse('9876543210')).toThrow();
  });

  it('rejects mobiles starting 0-5', () => {
    expect(() => PhoneIndiaE164Schema.parse('+915876543210')).toThrow();
  });

  it('rejects wrong length', () => {
    expect(() => PhoneIndiaE164Schema.parse('+9198765432')).toThrow();
  });
});

describe('PincodeIndiaSchema', () => {
  it('accepts 6-digit pincodes starting 1-9', () => {
    expect(PincodeIndiaSchema.parse('110001')).toBe('110001');
    expect(PincodeIndiaSchema.parse('560100')).toBe('560100');
  });

  it('rejects pincodes starting with 0', () => {
    expect(() => PincodeIndiaSchema.parse('010001')).toThrow();
  });

  it('rejects wrong length', () => {
    expect(() => PincodeIndiaSchema.parse('11000')).toThrow();
    expect(() => PincodeIndiaSchema.parse('1100012')).toThrow();
  });
});

describe('IsoDateSchema', () => {
  it('accepts YYYY-MM-DD strings', () => {
    expect(IsoDateSchema.parse('2026-05-14')).toBe('2026-05-14');
  });

  it('rejects malformed strings', () => {
    expect(() => IsoDateSchema.parse('14-05-2026')).toThrow();
    expect(() => IsoDateSchema.parse('2026/05/14')).toThrow();
  });

  it('rejects impossible calendar dates', () => {
    expect(() => IsoDateSchema.parse('2026-02-30')).toThrow();
  });
});

describe('IsoDateTimeSchema', () => {
  it('accepts RFC 3339 UTC date-times', () => {
    expect(IsoDateTimeSchema.parse('2026-05-14T10:30:00Z')).toBe('2026-05-14T10:30:00Z');
    expect(IsoDateTimeSchema.parse('2026-05-14T10:30:00.123Z')).toBe(
      '2026-05-14T10:30:00.123Z',
    );
  });

  it('rejects malformed strings', () => {
    expect(() => IsoDateTimeSchema.parse('2026-05-14 10:30:00')).toThrow();
  });
});

describe('EmailLowercaseSchema', () => {
  it('accepts and downcases valid emails', () => {
    expect(EmailLowercaseSchema.parse('Foo@Example.COM')).toBe('foo@example.com');
  });

  it('rejects malformed emails', () => {
    expect(() => EmailLowercaseSchema.parse('not-an-email')).toThrow();
    expect(() => EmailLowercaseSchema.parse('foo@')).toThrow();
  });
});

describe('UrlSchema', () => {
  it('accepts https URLs', () => {
    expect(UrlSchema.parse('https://example.com')).toBe('https://example.com');
    expect(UrlSchema.parse('https://example.com/path?q=1')).toBe(
      'https://example.com/path?q=1',
    );
  });

  it('rejects http URLs (HTTPS-only)', () => {
    expect(() => UrlSchema.parse('http://example.com')).toThrow();
  });

  it('rejects malformed URLs', () => {
    expect(() => UrlSchema.parse('not a url')).toThrow();
  });
});

describe('R2ObjectKeySchema', () => {
  it('accepts well-formed keys', () => {
    expect(R2ObjectKeySchema.parse('products/img/abc.jpg')).toBe('products/img/abc.jpg');
  });

  it('rejects empty strings', () => {
    expect(() => R2ObjectKeySchema.parse('')).toThrow();
  });

  it('rejects leading slash', () => {
    expect(() => R2ObjectKeySchema.parse('/products/img.jpg')).toThrow();
  });

  it('rejects double-slash', () => {
    expect(() => R2ObjectKeySchema.parse('products//img.jpg')).toThrow();
  });

  it('rejects `..` segments', () => {
    expect(() => R2ObjectKeySchema.parse('products/../etc/passwd')).toThrow();
  });

  it('rejects keys > 1024 bytes', () => {
    expect(() => R2ObjectKeySchema.parse('a'.repeat(1025))).toThrow();
  });
});
