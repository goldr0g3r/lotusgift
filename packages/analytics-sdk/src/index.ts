// Default export (server) — kept for Node consumers that don't subpath-import.
// Browser consumers MUST use `@repo/analytics-sdk/browser` so the bundler
// doesn't pull `posthog-node` into the client bundle.
export * from './server.js';
