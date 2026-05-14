/**
 * `__schemaVersion` helpers. We use `MAJOR.MINOR` (not full semver) for
 * event schemas because patch versions add noise for wire formats —
 * cosmetic changes don't justify a version bump; breaking goes MAJOR;
 * additive goes MINOR.
 */

export interface SchemaVersion {
  readonly major: number;
  readonly minor: number;
}

export function parseSchemaVersion(version: string): SchemaVersion {
  const match = version.match(/^(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid schema version "${version}" (expected MAJOR.MINOR)`);
  }
  return { major: Number(match[1]), minor: Number(match[2]) };
}

export function formatSchemaVersion(v: SchemaVersion): string {
  return `${v.major}.${v.minor}`;
}

/**
 * Consumer-side compatibility check. A consumer pinned to `expected` can
 * process an event with `actual` iff the MAJOR matches AND the actual
 * MINOR is ≤ expected MINOR (consumer might receive an older minor) OR
 * the actual MINOR is ≥ expected MINOR (consumer ignores added fields).
 *
 * Practically: any same-MAJOR pair is compatible. MAJOR mismatch is
 * always incompatible.
 */
export function isCompatibleVersion(expected: string, actual: string): boolean {
  return parseSchemaVersion(expected).major === parseSchemaVersion(actual).major;
}

export function bumpMinor(version: string): string {
  const v = parseSchemaVersion(version);
  return formatSchemaVersion({ major: v.major, minor: v.minor + 1 });
}

export function bumpMajor(version: string): string {
  const v = parseSchemaVersion(version);
  return formatSchemaVersion({ major: v.major + 1, minor: 0 });
}
