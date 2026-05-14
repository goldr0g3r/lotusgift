import {
  defaultCensor,
  defaultRedactionPaths,
  pinoRedactionConfig,
  redact,
} from './redactor.js';

describe('defaultRedactionPaths', () => {
  it('covers the highest-risk PII + secret fields', () => {
    expect(defaultRedactionPaths).toContain('password');
    expect(defaultRedactionPaths).toContain('token');
    expect(defaultRedactionPaths).toContain('req.headers.authorization');
    expect(defaultRedactionPaths).toContain('body.email');
    expect(defaultRedactionPaths).toContain('body.gstin');
    expect(defaultRedactionPaths).toContain('body.pan');
  });
});

describe('pinoRedactionConfig', () => {
  it('merges default paths with extras', () => {
    const config = pinoRedactionConfig(['body.customField']);
    expect(config.paths).toContain('body.customField');
    expect(config.paths).toContain('password');
    expect(config.censor).toBe('[REDACTED]');
    expect(config.remove).toBe(false);
  });

  it('with no extras returns the defaults only', () => {
    const config = pinoRedactionConfig();
    expect(config.paths.length).toBe(defaultRedactionPaths.length);
  });
});

describe('defaultCensor', () => {
  it('returns the [REDACTED] sentinel', () => {
    expect(defaultCensor()).toBe('[REDACTED]');
  });
});

describe('redact', () => {
  it('returns primitives unchanged', () => {
    expect(redact('plain')).toBe('plain');
    expect(redact(42)).toBe(42);
    expect(redact(null)).toBe(null);
  });

  it('replaces the value at every dot-notation path', () => {
    const out = redact(
      { req: { headers: { authorization: 'Bearer secret', cookie: 'sid=abc' } } },
      ['req.headers.authorization', 'req.headers.cookie'],
    );
    expect(out.req.headers.authorization).toBe('[REDACTED]');
    expect(out.req.headers.cookie).toBe('[REDACTED]');
  });

  it('leaves untouched fields alone', () => {
    const out = redact(
      { req: { headers: { authorization: 'Bearer secret' }, body: { foo: 'bar' } } },
      ['req.headers.authorization'],
    );
    expect(out.req.body.foo).toBe('bar');
  });

  it('does NOT mutate the input', () => {
    const input = { req: { headers: { authorization: 'Bearer secret' } } };
    redact(input, ['req.headers.authorization']);
    expect(input.req.headers.authorization).toBe('Bearer secret');
  });

  it('silently ignores paths that do not exist in the input', () => {
    const out = redact({ foo: 'bar' }, ['does.not.exist']);
    expect(out).toEqual({ foo: 'bar' });
  });

  it('skips wildcard paths (pino handles those)', () => {
    const out = redact({ items: [{ secret: 'x' }, { secret: 'y' }] }, ['items[*].secret']);
    // Wildcard skipped at the redact() boundary; values pass through.
    expect(out.items[0]!.secret).toBe('x');
  });
});
