import {
  X_AUTH_REQUIRED,
  X_DEPRECATION_DATE,
  X_EXTENSIONS,
  X_FEATURE_FLAG,
  X_KUBB_REACT_QUERY,
  X_RATE_LIMIT_TIER,
} from './extensions.js';

describe('OpenAPI x-* extension key constants', () => {
  it('exposes the rate-limit-tier key', () => {
    expect(X_RATE_LIMIT_TIER).toBe('x-rate-limit-tier');
  });

  it('exposes the auth-required key', () => {
    expect(X_AUTH_REQUIRED).toBe('x-auth-required');
  });

  it('exposes the feature-flag key', () => {
    expect(X_FEATURE_FLAG).toBe('x-feature-flag');
  });

  it('exposes the deprecation-date key', () => {
    expect(X_DEPRECATION_DATE).toBe('x-deprecation-date');
  });

  it('exposes the kubb-react-query hint key', () => {
    expect(X_KUBB_REACT_QUERY).toBe('x-kubb-react-query');
  });

  it('catalogs all 5 keys via X_EXTENSIONS', () => {
    expect(Object.keys(X_EXTENSIONS)).toHaveLength(5);
    expect(X_EXTENSIONS.X_RATE_LIMIT_TIER).toBe(X_RATE_LIMIT_TIER);
    expect(X_EXTENSIONS.X_AUTH_REQUIRED).toBe(X_AUTH_REQUIRED);
  });

  it('all extension keys follow the OpenAPI x-* naming rule', () => {
    for (const key of Object.values(X_EXTENSIONS)) {
      expect(key.startsWith('x-')).toBe(true);
    }
  });
});
