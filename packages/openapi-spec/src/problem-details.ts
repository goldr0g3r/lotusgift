import { ProblemDetailsSchema, z } from '@repo/validators';

/**
 * RFC 9457 Problem Details JSON Schema, generated via Zod 4's native
 * `z.toJSONSchema()` with `target: 'openapi-3.0'`. Frozen at module load
 * for codegen tools (Kubb + Swagger UI + docs site) that need the JSON
 * Schema representation alongside the Zod runtime parser.
 *
 * @see https://datatracker.ietf.org/doc/rfc9457/
 * @see https://v4.zod.dev/json-schema
 */
export const ProblemDetailsJsonSchema = Object.freeze(
  z.toJSONSchema(ProblemDetailsSchema, {
    target: 'openapi-3.0',
    unrepresentable: 'any',
  }),
);

export type ProblemDetailsJsonSchemaType = typeof ProblemDetailsJsonSchema;

/** Wire-format media type for ProblemDetails responses. */
export const PROBLEM_JSON_MEDIA_TYPE = 'application/problem+json' as const;

/**
 * OpenAPI 3.1 `responses[<status>]` block for an error response.
 * Helper for service controllers that want to register
 * `ApiResponse({ status, content: { 'application/problem+json': ... } })`
 * declaratively.
 *
 * @example
 * import { problemResponse } from '@repo/openapi-spec';
 *
 * @ApiResponse(problemResponse(400, 'Validation failed'))
 * @Post()
 * place(@Body() dto: PlaceOrderDto) { ... }
 */
export function problemResponse(status: number, description: string) {
  return {
    status,
    description,
    content: {
      [PROBLEM_JSON_MEDIA_TYPE]: {
        schema: ProblemDetailsJsonSchema,
      },
    },
  } as const;
}
