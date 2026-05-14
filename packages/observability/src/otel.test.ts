import { NodeSDK } from '@opentelemetry/sdk-node';

import { bootstrapOtel } from './otel.js';

describe('bootstrapOtel', () => {
  it('returns a NodeSDK instance', () => {
    const sdk = bootstrapOtel({ serviceName: 'test-service' });
    expect(sdk).toBeInstanceOf(NodeSDK);
  });

  it('accepts otlp endpoint + headers + deployment env', () => {
    const sdk = bootstrapOtel({
      serviceName: 'test-service',
      serviceVersion: '1.2.3',
      deploymentEnvironment: 'test',
      otlpEndpoint: 'https://otlp.example/otlp',
      otlpHeaders: 'Authorization=Bearer abc,X-Other=xyz',
    });
    expect(sdk).toBeInstanceOf(NodeSDK);
  });

  it('handles missing OTLP endpoint gracefully (defaults to no remote export)', () => {
    const sdk = bootstrapOtel({ serviceName: 'no-endpoint' });
    expect(sdk).toBeInstanceOf(NodeSDK);
  });
});
