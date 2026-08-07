import { DynamicMarkdownParseError } from "@at/dynamic-markdown";
import { type GenerateDocumentRequest, generateDocumentRequestSchema } from "@repo/shared-types";
import type { FastifyInstance } from "fastify";
import { type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { GenerationCancelledError, GenerationOverloadError } from "./generationScheduler";
import { documentGenerationMetrics } from "./otel";
import { buildGenerateDocumentRequestContext } from "./requestContext";

export type DocumentGenerationHandler = (
  request: GenerateDocumentRequest,
  signal: AbortSignal,
) => Promise<string>;

export async function registerDocumentGenerationRoute(
  fastify: FastifyInstance,
  generateDocument: DocumentGenerationHandler,
) {
  const errorResponseSchema = z.object({
    message: z.string(),
    error: z.string(),
  });

  const validationErrorResponseSchema = errorResponseSchema.extend({
    details: z
      .array(
        z.object({
          path: z.string(),
          message: z.string(),
          code: z.string(),
        }),
      )
      .nullish(),
  });

  fastify.withTypeProvider<ZodTypeProvider>().post(
    "/genererbrev",
    {
      onRequest: [fastify.authenticate],
      schema: {
        description: "Generate document from markdown template",
        security: [{ bearerAuth: [] }],
        body: generateDocumentRequestSchema,
        response: {
          200: z.string().describe("HTML or Base64-encoded PDF"),
          400: validationErrorResponseSchema.describe("Validation or parse error"),
          499: errorResponseSchema.describe("Client closed the request before generation began"),
          500: errorResponseSchema.describe("Internal server error"),
          503: errorResponseSchema.describe("Document generation is overloaded"),
        },
      },
    },
    async (request, reply) => {
      const user = request.user;

      try {
        request.log.info(
          { requestContext: buildGenerateDocumentRequestContext(request.body, user) },
          "genererbrev.request",
        );
        const result = await generateDocument(request.body, request.signal);
        const template = request.body.options.dynamic.template ?? "default";
        const outputFormat = request.body.options.as_html ? "html" : "pdf";
        documentGenerationMetrics.generated.add(1, {
          "document.template": template,
          "document.output.format": outputFormat,
        });
        if (reply.sent) {
          // The handler timeout already answered the caller; sending again would only log
          // FST_ERR_REP_ALREADY_SENT.
          request.log.warn("Document generation finished after the reply was already sent");
          return;
        }
        reply.send(result);
      } catch (err) {
        if (err instanceof GenerationOverloadError) {
          request.log.warn({ reason: err.reason }, "Document generation overloaded");
          documentGenerationMetrics.overloadResponses.add(1);
          return reply
            .header("Retry-After", String(err.retryAfterSeconds))
            .status(503)
            .send({ message: "Service unavailable", error: err.message });
        }

        if (err instanceof GenerationCancelledError) {
          // The caller is already gone; this is expected, not an unexpected 5xx.
          request.log.info("Document generation cancelled after caller disconnect");
          return reply.status(499).send({ message: "Client closed request", error: err.message });
        }

        request.log.error(err, "Error processing request:");

        if (err instanceof DynamicMarkdownParseError) {
          return reply.status(400).send({
            message: "Parse error",
            error: err.message,
          });
        }
        const error = err instanceof Error ? err.message : String(err);
        reply.status(500).send({ message: "Internal error", error });
      }
    },
  );
}
