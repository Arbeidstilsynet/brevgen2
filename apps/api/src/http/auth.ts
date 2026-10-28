import fastifyJwt, { TokenOrHeader } from "@fastify/jwt";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import jwksClient, { SigningKeyNotFoundError } from "jwks-rsa";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

const isRecord = (r: unknown): r is Record<string, unknown> => {
  return typeof r === "object" && r !== null && !Array.isArray(r);
};
const isNonEmptyString = (s: unknown): s is string => {
  return typeof s === "string" && s.length > 0;
};

/** Matches the response @fastify/jwt gives for tokens it rejects itself. */
class InvalidTokenError extends Error {
  readonly statusCode = 401;
  readonly code = "FST_JWT_AUTHORIZATION_TOKEN_INVALID";

  constructor(reason: string) {
    super(`Authorization token is invalid: ${reason}`);
    this.name = "InvalidTokenError";
  }
}

export async function setupAuth(fastify: FastifyInstance) {
  const DANGEROUS_DISABLE_AUTH = process.env.DANGEROUS_DISABLE_AUTH === "true";
  const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID ?? "da4bf886-a8a6-450d-a806-c347b8eb8d80";
  const AZURE_APPLICATION_ID = process.env.AZURE_APPLICATION_ID;
  const JWKS_URI = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/discovery/v2.0/keys`;

  const jwks = jwksClient({
    jwksUri: JWKS_URI,
    rateLimit: true,
  });

  // @fastify/jwt turns errors from this callback into 500s, so token problems must carry their own 401.
  async function getKey(_req: FastifyRequest, token: TokenOrHeader): Promise<string> {
    const header = token.header as unknown;
    if (!isRecord(header)) throw new InvalidTokenError("Missing token header");
    const kid = header.kid;
    const alg = header.alg;
    if (!isNonEmptyString(kid)) throw new InvalidTokenError("Missing kid");
    if (!isNonEmptyString(alg)) throw new InvalidTokenError("Missing alg");
    if (alg !== "RS256") throw new InvalidTokenError(`Unexpected alg ${alg}`);
    try {
      const key = await jwks.getSigningKey(kid);
      return key.getPublicKey();
    } catch (error) {
      // Other JWKS failures mean Entra ID is unreachable or misbehaving, which stays a server error.
      if (error instanceof SigningKeyNotFoundError) throw new InvalidTokenError(error.message);
      throw error;
    }
  }

  if (DANGEROUS_DISABLE_AUTH) {
    fastify.log.warn(
      "Authentication is disabled. This is INSECURE and should not be used in production.",
    );
    fastify.decorate("authenticate", async () => {
      // No-op when auth is disabled
    });
  } else {
    if (!AZURE_APPLICATION_ID) {
      throw new TypeError("Missing AZURE_APPLICATION_ID env var (required when auth enabled)");
    }

    await fastify.register(fastifyJwt, {
      secret: getKey,
      decode: { complete: true },
      verify: {
        algorithms: ["RS256"],
        allowedIss: [`https://login.microsoftonline.com/${AZURE_TENANT_ID}/v2.0`],
        allowedAud: [AZURE_APPLICATION_ID],
      },
    });

    fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    });
  }
}
