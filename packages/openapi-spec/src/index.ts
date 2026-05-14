export {
  X_AUTH_REQUIRED,
  X_DEPRECATION_DATE,
  X_EXTENSIONS,
  X_FEATURE_FLAG,
  X_KUBB_REACT_QUERY,
  X_RATE_LIMIT_TIER,
} from './extensions.js';
export type { KubbReactQueryHints, RateLimitTier } from './extensions.js';

export {
  PROBLEM_JSON_MEDIA_TYPE,
  ProblemDetailsJsonSchema,
  problemResponse,
} from './problem-details.js';
export type { ProblemDetailsJsonSchemaType } from './problem-details.js';

export {
  ALL_ERROR_CODES,
  ERROR_CODE_DEFAULT_STATUS,
  ERROR_CODES_4XX,
  ERROR_CODES_5XX,
} from './error-codes.js';

export type { AuthRequirement } from './types.js';
