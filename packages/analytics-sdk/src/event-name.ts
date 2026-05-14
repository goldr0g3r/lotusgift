/**
 * Event-name format per `.cursor/rules/analytics-instrumentation.mdc`:
 * `[object] [verb]` in lowercase, kebab-case or single words separated
 * by single spaces. Examples that pass:
 *
 *   order placed
 *   quote accepted
 *   mockup approved
 *   recipient-list uploaded
 *   order routed-to-rfq
 *
 * Examples that fail:
 *
 *   orderPlaced            (camelCase)
 *   ORDER_PLACED           (snake-case-upper)
 *   "  order  placed   "   (excessive whitespace)
 *   order                  (missing verb)
 */
const EVENT_NAME_REGEX = /^[a-z0-9][a-z0-9-]*( [a-z0-9][a-z0-9-]*)+$/;

export class InvalidEventNameError extends Error {
  constructor(name: string) {
    super(
      `Invalid analytics event name "${name}". Expected "[object] [verb]" in lowercase ` +
        `(e.g. "order placed", "recipient-list uploaded"). See ` +
        `.cursor/rules/analytics-instrumentation.mdc.`,
    );
    this.name = 'InvalidEventNameError';
  }
}

export function assertValidEventName(name: string): void {
  if (!EVENT_NAME_REGEX.test(name)) {
    throw new InvalidEventNameError(name);
  }
}

export function isValidEventName(name: string): boolean {
  return EVENT_NAME_REGEX.test(name);
}
