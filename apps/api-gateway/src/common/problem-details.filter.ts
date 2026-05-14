import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response, Request } from 'express';

import {
  ERROR_CODE_DEFAULT_STATUS,
  PROBLEM_JSON_MEDIA_TYPE,
} from '@repo/openapi-spec';
import {
  type LotusGiftErrorCode,
  type ProblemDetails,
  type ProblemDetailsFieldError,
} from '@repo/validators';
import { currentTraceId } from '@repo/utils';

const logger = new Logger('GlobalProblemDetailsFilter');

interface ZodValidationError {
  errors?: Array<{
    path?: readonly (string | number)[];
    code?: string;
    message?: string;
  }>;
}

/**
 * Global exception filter that converts every thrown exception into an
 * RFC 9457 ProblemDetails JSON response with media type
 * `application/problem+json`. Handles:
 *
 *  - NestJS `HttpException` subclasses → maps to the matching HTTP status.
 *  - `ZodError` (from nestjs-zod) → 400 VALIDATION_FAILED with per-issue
 *    `errors[]`.
 *  - Anything else → 500 INTERNAL_ERROR (logged at error level so
 *    operators can correlate via trace-id).
 *
 * Always includes the `traceId` from the AsyncLocalStorage scope set by
 * `TraceIdMiddleware`, so client errors are immediately greppable in
 * logs + traces.
 */
@Catch()
export class GlobalProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, body } = this.buildBody(exception, request.originalUrl ?? request.url);

    if (status >= 500) {
      logger.error(
        {
          status,
          code: body.code,
          traceId: body.traceId,
          path: body.instance,
          err: exception instanceof Error ? exception.stack : String(exception),
        },
        body.title,
      );
    }

    response.status(status).type(PROBLEM_JSON_MEDIA_TYPE).json(body);
  }

  private buildBody(
    exception: unknown,
    instance: string,
  ): { status: number; body: ProblemDetails } {
    const traceId = currentTraceId();
    const base: Pick<ProblemDetails, 'type' | 'instance' | 'traceId'> = {
      type: 'about:blank',
      instance,
      traceId,
    };

    if (this.isZodError(exception)) {
      const errors: ProblemDetailsFieldError[] = (exception.errors ?? []).map((issue) => ({
        pointer: `/${(issue.path ?? []).join('/')}`,
        code: issue.code ?? 'invalid',
        message: issue.message ?? 'Invalid value',
      }));
      const code: LotusGiftErrorCode = 'VALIDATION_FAILED';
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          ...base,
          title: 'Validation failed',
          status: HttpStatus.BAD_REQUEST,
          detail: `${errors.length} issue(s) prevented the request from being processed.`,
          code,
          errors,
        },
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resp = exception.getResponse();
      const respObj = typeof resp === 'object' && resp !== null ? (resp as Record<string, unknown>) : {};
      const message =
        typeof resp === 'string'
          ? resp
          : typeof respObj.message === 'string'
            ? respObj.message
            : exception.message;
      const code = (typeof respObj.code === 'string' ? respObj.code : undefined) as
        | LotusGiftErrorCode
        | undefined;
      return {
        status,
        body: {
          ...base,
          title: this.titleForStatus(status),
          status,
          detail: message,
          code: code ?? this.inferCodeForStatus(status),
        },
      };
    }

    const code: LotusGiftErrorCode = 'INTERNAL_ERROR';
    const detail = exception instanceof Error ? exception.message : 'Unknown error';
    return {
      status: ERROR_CODE_DEFAULT_STATUS[code],
      body: {
        ...base,
        title: 'Internal server error',
        status: ERROR_CODE_DEFAULT_STATUS[code],
        detail,
        code,
      },
    };
  }

  private isZodError(err: unknown): err is ZodValidationError {
    return (
      typeof err === 'object' &&
      err !== null &&
      (err as { name?: string }).name === 'ZodError' &&
      Array.isArray((err as ZodValidationError).errors)
    );
  }

  private titleForStatus(status: number): string {
    if (status === 400) return 'Bad request';
    if (status === 401) return 'Unauthorized';
    if (status === 403) return 'Forbidden';
    if (status === 404) return 'Not found';
    if (status === 409) return 'Conflict';
    if (status === 422) return 'Unprocessable entity';
    if (status === 429) return 'Too many requests';
    if (status >= 500) return 'Internal server error';
    return `HTTP ${status}`;
  }

  private inferCodeForStatus(status: number): LotusGiftErrorCode | undefined {
    if (status === 401) return 'AUTH_INVALID_TOKEN';
    if (status === 403) return 'AUTH_FORBIDDEN';
    if (status === 404) return 'RESOURCE_NOT_FOUND';
    if (status === 409) return 'RESOURCE_CONFLICT';
    if (status === 429) return 'RATE_LIMIT_EXCEEDED';
    if (status >= 500) return 'INTERNAL_ERROR';
    return undefined;
  }
}
