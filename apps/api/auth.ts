import fastifyJwt, { TokenOrHeader } from "@fastify/jwt";
import { FastifyInstance, FastifyRequest } from "fastify";
import jwksClient from "jwks-rsa";

const isRecord = (r: unknown): r is Record<string, unknown> => {
  return typeof r === "object" && r !== null && !Array.isArray(r);
};
const isNonEmptyString = (s: unknown): s is string => {
  return typeof s === "string" && s.length > 0;
};

export function setupAuth(fastify: FastifyInstance) {
  const DANGEROUS_DISABLE_AUTH = process.env.DANGEROUS_DISABLE_AUTH === "true";
  const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID ?? "da4bf886-a8a6-450d-a806-c347b8eb8d80";
  const AZURE_APPLICATION_ID = process.env.AZURE_APPLICATION_ID;
  const JWKS_URI = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/discovery/v2.0/keys`;

  const jwks = jwksClient({
    jwksUri: JWKS_URI,
    rateLimit: true,
  });

  async function getKey(_req: FastifyRequest, token: TokenOrHeader): Promise<string> {
    const header = token.header as unknown;
    if (!isRecord(header)) throw new TypeError("Missing token header");
    const kid = header.kid;
    const alg = header.alg;
    if (!isNonEmptyString(kid)) throw new TypeError("Missing kid");
    if (!isNonEmptyString(alg)) throw new TypeError("Missing alg");
    if (alg && alg !== "RS256") throw new TypeError(`Unexpected alg ${alg}`);
    const key = await jwks.getSigningKey(kid);
    return key.getPublicKey();
  }

  if (DANGEROUS_DISABLE_AUTH) {
    fastify.log.warn(
      "Authentication is disabled. This is INSECURE and should not be used in production.",
    );
  } else {
    if (!AZURE_APPLICATION_ID) {
      throw new TypeError("Missing AZURE_APPLICATION_ID env var (required when auth enabled)");
    }

    fastify.register(fastifyJwt, {
      secret: getKey,
      decode: { complete: true },
      verify: {
        algorithms: ["RS256"],
        allowedIss: [`https://login.microsoftonline.com/${AZURE_TENANT_ID}/v2.0`],
        allowedAud: [AZURE_APPLICATION_ID],
      },
    });

    fastify.addHook("onRequest", async (request, reply) => {
      if (request.routeOptions?.url === "/health") return;
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    });
  }

  return { DANGEROUS_DISABLE_AUTH };
}
