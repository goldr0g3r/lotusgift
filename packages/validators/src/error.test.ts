import { LotusGiftErrorCodeEnum, ProblemDetailsSchema } from './error.js';

describe('ProblemDetailsSchema', () => {
  it('accepts a minimal RFC 9457 error', () => {
    const parsed = ProblemDetailsSchema.parse({
      title: 'Not Found',
      status: 404,
    });
    expect(parsed.type).toBe('about:blank');
    expect(parsed.title).toBe('Not Found');
    expect(parsed.status).toBe(404);
  });

  it('accepts the full envelope with LotusGift extensions', () => {
    const parsed = ProblemDetailsSchema.parse({
      type: 'https://docs.lotusgift.com/errors/validation-failed',
      title: 'Validation failed',
      status: 400,
      detail: '1 issue prevented the request from being processed.',
      instance: '/api/v1/orders',
      code: 'VALIDATION_FAILED',
      traceId: '01HZX1234567890ABCDEFGHIJK',
      errors: [
        { pointer: '/items/0/qty', code: 'too_small', message: 'Quantity must be ≥ 1' },
      ],
    });
    expect(parsed.code).toBe('VALIDATION_FAILED');
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.errors?.[0]?.pointer).toBe('/items/0/qty');
  });

  it('rejects out-of-range HTTP status', () => {
    expect(() => ProblemDetailsSchema.parse({ title: 'x', status: 99 })).toThrow();
    expect(() => ProblemDetailsSchema.parse({ title: 'x', status: 600 })).toThrow();
  });

  it('rejects unknown error codes', () => {
    expect(() =>
      ProblemDetailsSchema.parse({ title: 'x', status: 400, code: 'NOT_A_REAL_CODE' }),
    ).toThrow();
  });
});

describe('LotusGiftErrorCodeEnum', () => {
  it('includes the 3 core auth codes', () => {
    expect(LotusGiftErrorCodeEnum.parse('AUTH_INVALID_TOKEN')).toBe('AUTH_INVALID_TOKEN');
    expect(LotusGiftErrorCodeEnum.parse('AUTH_2FA_REQUIRED')).toBe('AUTH_2FA_REQUIRED');
    expect(LotusGiftErrorCodeEnum.parse('AUTH_SESSION_EXPIRED')).toBe(
      'AUTH_SESSION_EXPIRED',
    );
  });

  it('includes the corporate-gifting domain codes', () => {
    expect(LotusGiftErrorCodeEnum.parse('ORDER_RFQ_ROUTE_REQUIRED')).toBe(
      'ORDER_RFQ_ROUTE_REQUIRED',
    );
    expect(LotusGiftErrorCodeEnum.parse('RECIPIENT_LIST_INVALID_ROW')).toBe(
      'RECIPIENT_LIST_INVALID_ROW',
    );
    expect(LotusGiftErrorCodeEnum.parse('CUSTOMIZATION_INVALID_TRANSITION')).toBe(
      'CUSTOMIZATION_INVALID_TRANSITION',
    );
  });

  it('rejects lowercase variants', () => {
    expect(() => LotusGiftErrorCodeEnum.parse('auth_invalid_token')).toThrow();
  });
});
