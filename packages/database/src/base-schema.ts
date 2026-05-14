import type { Schema } from 'mongoose';

/**
 * Mongoose schema plugin that adds the standard LotusGift v2 audit
 * fields:
 *
 * - `id`: domain-level ULID (separate from the Mongo `_id` ObjectId).
 *   Service-side ULID generation lives in `@repo/utils/ulid`; this
 *   plugin reserves the field shape on every schema for consistency.
 * - `createdAt` / `updatedAt`: stamped by Mongoose's `timestamps: true`
 *   when the schema is constructed with that option (the plugin doesn't
 *   force it — services opt in per-collection).
 * - `createdBy` / `updatedBy`: optional `UlidString | 'system'` markers
 *   populated by the repository layer when an authenticated actor is
 *   available; nullable for system-emitted writes.
 *
 * Plugin signature matches the Mongoose plugin convention: pass it to
 * `schema.plugin(baseSchemaPlugin)` after schema construction.
 */
export function baseSchemaPlugin(schema: Schema): void {
  schema.add({
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      validate: {
        validator: (v: string) => /^[0-9A-HJKMNP-TV-Z]{26}$/.test(v),
        message: 'id must be a Crockford base32 ULID',
      },
    },
    createdBy: { type: String, required: false },
    updatedBy: { type: String, required: false },
  });

  // Surface a plain `id` getter for consumers that read `doc.id` without
  // pulling the full `toJSON` virtual on every read.
  schema.set('toJSON', { virtuals: true });
}
