import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import { GenerateDocumentRequest } from "@repo/shared-types";
import { FastifyInstance } from "fastify";
import { jsonSchemaTransform } from "fastify-type-provider-zod";

export async function registerSwagger(fastify: FastifyInstance) {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Brevgenerator2 API",
        description: "API for generating documents from markdown templates",
        version: process.env.GIT_SHA?.substring(0, 7) ?? "dev",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    transform: (transformObject) => {
      const transformed = jsonSchemaTransform(transformObject);

      if (transformObject.url === "/genererbrev" && transformed.schema?.body) {
        (transformed.schema.body as { example: GenerateDocumentRequest }).example = {
          md: "# Classified Communication\n\n**Subject: Project {{projectName}}**\n\nAgent {{agentName}},\n\nYour augmentation has been approved. Report to {{location}} immediately.",
          mdVariables: {
            projectName: "Daedalus",
            agentName: "JC Denton",
            location: "Liberty Island",
          },
          options: {
            document_title: "UNATCO Confidential Brief",
            dynamic: {
              template: "default",
              defaultTemplateArgs: {
                language: "bm",
                signatureVariant: "automatiskBehandlet",
                fields: {
                  dato: "2052-07-17",
                  saksnummer: "UNATCO-2052/0451",
                  saksbehandlerNavn: "Joseph Manderley",
                  virksomhet: {
                    navn: "UNATCO",
                    adresse: "Liberty Island",
                    postnr: "10004",
                    poststed: "New York",
                  },
                },
              },
            },
          },
        };
      }

      return transformed;
    },
  });

  await fastify.register(fastifySwaggerUI, {
    routePrefix: "/docs",
    logLevel: "warn",
    uiConfig: {
      deepLinking: false,
      defaultModelExpandDepth: 5,
      displayRequestDuration: true,
    },
  });
}
