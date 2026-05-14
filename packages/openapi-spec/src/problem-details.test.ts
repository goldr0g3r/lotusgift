import Ajv from 'ajv';

import {
  PROBLEM_JSON_MEDIA_TYPE,
  ProblemDetailsJsonSchema,
  problemResponse,
} from './problem-details.js';

describe('ProblemDetailsJsonSchema', () => {
  // OpenAPI 3.0 schemas are a JSON Schema subset; ajv with `strict: false`
  // and `meta: false` is the standard way to validate sample payloads against
  // a generated OpenAPI 3.0 schema fragment.
  const ajv = new Ajv({ strict: false, meta: false });
  const validate = ajv.compile(ProblemDetailsJsonSchema);

  it('validates a minimal RFC 9457 sample', () => {
    const sample = {
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
    };
    expect(validate(sample)).toBe(true);
  });

  it('validates a full envelope with LotusGift extensions', () => {
    const sample = {
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
    };
    expect(validate(sample)).toBe(true);
  });

  it('rejects missing required `title`', () => {
    const sample = { status: 404 };
    expect(validate(sample)).toBe(false);
  });

  it('rejects unknown error codes', () => {
    const sample = { title: 'x', status: 400, code: 'NOT_A_REAL_CODE' };
    expect(validate(sample)).toBe(false);
  });
});

describe('problemResponse helper', () => {
  it('builds a NestJS @ApiResponse-compatible object', () => {
    const res = problemResponse(400, 'Validation failed');
    expect(res.status).toBe(400);
    expect(res.description).toBe('Validation failed');
    expect(res.content[PROBLEM_JSON_MEDIA_TYPE]).toBeDefined();
    expect(res.content[PROBLEM_JSON_MEDIA_TYPE]?.schema).toBe(ProblemDetailsJsonSchema);
  });
});

describe('PROBLEM_JSON_MEDIA_TYPE', () => {
  it('is the RFC 9457 wire media type', () => {
    expect(PROBLEM_JSON_MEDIA_TYPE).toBe('application/problem+json');
  });
});
