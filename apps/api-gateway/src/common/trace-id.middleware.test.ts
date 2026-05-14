import type { Request, Response, NextFunction } from 'express';

import { currentTraceId } from '@repo/utils';

import { TraceIdMiddleware } from './trace-id.middleware.js';

describe('TraceIdMiddleware', () => {
  function stubReq(headers: Record<string, string> = {}): Request {
    return {
      header(name: string) {
        return headers[name.toLowerCase()];
      },
    } as unknown as Request;
  }

  function stubRes(): { res: Response; setHeaders: Record<string, string> } {
    const setHeaders: Record<string, string> = {};
    const res = {
      setHeader(name: string, value: string) {
        setHeaders[name.toLowerCase()] = value;
      },
    } as unknown as Response;
    return { res, setHeaders };
  }

  it('echoes an inbound X-Trace-Id back on the response', () => {
    const middleware = new TraceIdMiddleware();
    const { res, setHeaders } = stubRes();
    middleware.use(stubReq({ 'x-trace-id': 'trc_inbound' }), res, (() => {}) as NextFunction);
    expect(setHeaders['x-trace-id']).toBe('trc_inbound');
  });

  it('generates a new trace-id when none is inbound', () => {
    const middleware = new TraceIdMiddleware();
    const { res, setHeaders } = stubRes();
    middleware.use(stubReq(), res, (() => {}) as NextFunction);
    expect(setHeaders['x-trace-id']).toMatch(/^trc_[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it('opens an AsyncLocalStorage scope visible to downstream calls', () => {
    const middleware = new TraceIdMiddleware();
    const { res } = stubRes();
    let captured: string | undefined;
    middleware.use(stubReq({ 'x-trace-id': 'trc_scope_test' }), res, (() => {
      captured = currentTraceId();
    }) as NextFunction);
    expect(captured).toBe('trc_scope_test');
  });

  it('treats empty inbound header as missing + generates a fresh id', () => {
    const middleware = new TraceIdMiddleware();
    const { res, setHeaders } = stubRes();
    middleware.use(stubReq({ 'x-trace-id': '' }), res, (() => {}) as NextFunction);
    expect(setHeaders['x-trace-id']).toMatch(/^trc_[0-9A-HJKMNP-TV-Z]{26}$/);
  });
});
