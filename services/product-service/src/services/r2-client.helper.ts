import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type HeadObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Thin wrappers around the AWS SDK v3 S3 client pointed at Cloudflare
 * R2. R2 is S3-compatible per the Cloudflare R2 docs (cite #1 in the
 * P7 research note), so the AWS SDK works unchanged once the endpoint
 * + credentials are bound.
 *
 * Public surface:
 *
 * - `createR2Client(env)` — factory returning a configured `S3Client`.
 *   The product-service module's R2_CLIENT_TOKEN useFactory wires this.
 * - `R2ImageClient` — the interface tests stub; isolates the AWS SDK
 *   surface from service code so we can swap the impl later (e.g. for
 *   Cloudflare Images transcoding) without touching `image.service.ts`.
 */

export interface PresignPutOptions {
  bucket: string;
  key: string;
  contentType: string;
  contentLength: number;
  expiresInSeconds: number;
}

export interface PresignPutResult {
  url: string;
  expiresAt: string;
}

export interface HeadResult {
  contentType: string | null;
  contentLength: number | null;
}

/**
 * Thin port over `@aws-sdk/client-s3` operations the image-service
 * needs. Tests inject a stub conforming to this shape so we don't
 * boot a real S3Client during unit tests.
 */
export interface R2ImageClient {
  presignPut(opts: PresignPutOptions): Promise<PresignPutResult>;
  head(bucket: string, key: string): Promise<HeadResult>;
}

interface R2EnvConfig {
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_ENDPOINT?: string;
}

/**
 * Build the configured `S3Client` for R2. `region: 'auto'` is the R2
 * recommendation per the Cloudflare aws-sdk-js-v3 docs.
 */
export function createR2S3Client(env: R2EnvConfig): S3Client {
  if (!env.R2_ENDPOINT || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error(
      'R2_ENDPOINT + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY must all be set to construct the R2 S3 client',
    );
  }
  return new S3Client({
    region: 'auto',
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Default `R2ImageClient` impl backed by the AWS SDK. Bound as the
 * `R2_CLIENT_TOKEN` provider in `product-service.module.ts` when
 * R2 credentials are configured; tests inject a stub instead.
 */
export class R2ImageClientImpl implements R2ImageClient {
  constructor(private readonly s3: S3Client) {}

  async presignPut(opts: PresignPutOptions): Promise<PresignPutResult> {
    const command = new PutObjectCommand({
      Bucket: opts.bucket,
      Key: opts.key,
      ContentType: opts.contentType,
      ContentLength: opts.contentLength,
    });
    // Per @aws-sdk/s3-request-presigner docs (cite #3): signableHeaders
    // forces the content-type into the signed URL so R2 rejects PUTs
    // with a mismatched content-type.
    const url = await getSignedUrl(this.s3, command, {
      expiresIn: opts.expiresInSeconds,
      signableHeaders: new Set(['content-type', 'content-length']),
    });
    const expiresAt = new Date(Date.now() + opts.expiresInSeconds * 1000).toISOString();
    return { url, expiresAt };
  }

  async head(bucket: string, key: string): Promise<HeadResult> {
    const out: HeadObjectCommandOutput = await this.s3.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );
    return {
      contentType: out.ContentType ?? null,
      contentLength: typeof out.ContentLength === 'number' ? out.ContentLength : null,
    };
  }
}
