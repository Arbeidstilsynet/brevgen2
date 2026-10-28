/**
 * Timeout budget, from the outside in:
 *
 * - HAProxy terminates the request at 60s.
 * - `HTTP_HANDLER_TIMEOUT_MS` is the Fastify backstop below that.
 * - `DOCUMENT_GENERATION_TIMEOUT_MS` bounds everything the pod does for one request, measured
 *   from the moment it enters the generation queue. Queue wait therefore eats into the render
 *   budget instead of being added on top of it, which keeps the total below the Fastify backstop.
 */
export const DOCUMENT_GENERATION_TIMEOUT_MS = 50_000;
export const HTTP_HANDLER_TIMEOUT_MS = 55_000;
export const GATEWAY_TIMEOUT_MS = 60_000;
