import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';

import { GlobalProblemDetailsFilter } from './problem-details.filter.js';

function buildHost(path = '/api/orders'): {
  host: ArgumentsHost;
  status: jest.Mock;
  type: jest.Mock;
  json: jest.Mock;
} {
  const json = jest.fn();
  const type = jest.fn().mockReturnValue({ json });
  const status = jest.fn().mockReturnValue({ type, json });
  const response = { status, type, json };
  const request = { url: path, originalUrl: path };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
  return { host, status, type, json };
}

describe('GlobalProblemDetailsFilter', () => {
  const filter = new GlobalProblemDetailsFilter();

  it('renders an HttpException as RFC 9457', () => {
    const { host, status, type, json } = buildHost();
    filter.catch(new BadRequestException('Field x is wrong'), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(type).toHaveBeenCalledWith('application/problem+json');
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'about:blank',
        title: 'Bad request',
        status: 400,
        detail: 'Field x is wrong',
        instance: '/api/orders',
      }),
    );
  });

  it('renders a 5xx generic Error as INTERNAL_ERROR', () => {
    const { host, status, json } = buildHost('/api/foo');
    filter.catch(new Error('boom'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Internal server error',
        status: 500,
        code: 'INTERNAL_ERROR',
        detail: 'boom',
      }),
    );
  });

  it('infers code from HTTP status when no explicit code is provided', () => {
    const { host, json } = buildHost('/api/x');
    filter.catch(new HttpException('rate limited', HttpStatus.TOO_MANY_REQUESTS), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
      }),
    );
  });

  it('preserves an explicit code from the exception response body', () => {
    const { host, json } = buildHost('/api/orders');
    filter.catch(
      new HttpException({ message: 'limit hit', code: 'CREDIT_LIMIT_EXCEEDED' }, 422),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 422,
        code: 'CREDIT_LIMIT_EXCEEDED',
        detail: 'limit hit',
      }),
    );
  });

  it('renders a ZodError as VALIDATION_FAILED with errors[]', () => {
    const { host, status, json } = buildHost('/api/orders');
    const zodErr = Object.assign(new Error('Zod'), {
      name: 'ZodError',
      errors: [
        { path: ['items', 0, 'qty'], code: 'too_small', message: 'Quantity must be ≥ 1' },
      ],
    });
    filter.catch(zodErr, host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        code: 'VALIDATION_FAILED',
        errors: [
          expect.objectContaining({
            pointer: '/items/0/qty',
            code: 'too_small',
            message: 'Quantity must be ≥ 1',
          }),
        ],
      }),
    );
  });
});
