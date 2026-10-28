import { createHmac, generateKeyPairSync, sign, type KeyObject } from "node:crypto";
import Fastify from "fastify";
import { afterEach, describe, expect, test, vi } from "vitest";
import { setupAuth } from "./auth";
import type { GenerateDocument } from "./routes/genererbrev";
import { createTestApp } from "../testing/create-test-app";

const TENANT_ID = "test-tenant";
const ISSUER = `https://login.microsoftonline.com/${TENANT_ID}/v2.0`;
const AUDIENCE = "test-application";
const KID = "test-kid";
const UNREACHABLE_KID = "unreachable-kid";

const signingKey = generateKeyPairSync("rsa", { modulusLength: 2048 });
const otherKey = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicKeyPem = signingKey.publicKey.export({ type: "spki", format: "pem" });

// Stands in for Entra ID's JWKS endpoint, which only knows the signing key.
vi.mock("jwks-rsa", async (importOriginal) => {
  const actual = await importOriginal<typeof import("jwks-rsa")>();
  return {
    ...actual,
    default: () => ({
      getSigningKey: async (kid: string) => {
        if (kid === UNREACHABLE_KID) throw new Error("connect ETIMEDOUT");
        if (kid !== KID) {
          throw new actual.SigningKeyNotFoundError(
            `Unable to find a signing key that matches '${kid}'`,
          );
        }
        return { getPublicKey: () => publicKeyPem };
      },
    }),
  };
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

function createToken({
  header = {},
  claims = {},
  signWith = (input: string) => rs256(input, signingKey.privateKey),
}: {
  header?: Record<string, unknown>;
  claims?: Record<string, unknown>;
  signWith?: (input: string) => string;
} = {}) {
  const now = Math.floor(Date.now() / 1000);
  const input = [
    base64url({ alg: "RS256", typ: "JWT", kid: KID, ...header }),
    base64url({ iss: ISSUER, aud: AUDIENCE, iat: now, nbf: now, exp: now + 300, ...claims }),
  ].join(".");
  return `${input}.${signWith(input)}`;
}

function rs256(input: string, privateKey: KeyObject) {
  return sign("sha256", Buffer.from(input), privateKey).toString("base64url");
}

async function postDocument(token: string) {
  vi.stubEnv("AZURE_TENANT_ID", TENANT_ID);
  const generateDocument = vi.fn<GenerateDocument>(async () => ({ content: "<p>ok</p>" }));
  const app = await createTestApp({ auth: true, generateDocument });
  const response = await app.inject({
    method: "POST",
    url: "/genererbrev",
    headers: { authorization: `Bearer ${token}` },
    payload: { md: "# Test", options: { as_html: true, dynamic: { template: "blank" } } },
  });
  return { response, generateDocument };
}

describe("auth", () => {
  test("accepts a token signed by the tenant for this application", async () => {
    const { response, generateDocument } = await postDocument(createToken());

    expect(response.statusCode).toBe(200);
    expect(generateDocument).toHaveBeenCalledOnce();
  });

  const now = Math.floor(Date.now() / 1000);
  test.each([
    ["issued for another application", createToken({ claims: { aud: "other-application" } })],
    [
      "issued by another tenant",
      createToken({ claims: { iss: "https://login.microsoftonline.com/other-tenant/v2.0" } }),
    ],
    ["expired", createToken({ claims: { iat: now - 600, nbf: now - 600, exp: now - 60 } })],
    [
      "signed with a key the tenant does not publish",
      createToken({ signWith: (input) => rs256(input, otherKey.privateKey) }),
    ],
    ["referring to an unknown key id", createToken({ header: { kid: "unknown-kid" } })],
    ["without a key id", createToken({ header: { kid: undefined } })],
    ["without an algorithm", createToken({ header: { alg: undefined } })],
    [
      "HMAC-signed with the public key (algorithm confusion)",
      createToken({
        header: { alg: "HS256" },
        signWith: (input) => createHmac("sha256", publicKeyPem).update(input).digest("base64url"),
      }),
    ],
    ["unsigned", createToken({ header: { alg: "none" }, signWith: () => "" })],
  ])("rejects a token %s", async (_name, token) => {
    const { response, generateDocument } = await postDocument(token);

    expect(response.statusCode).toBe(401);
    expect(generateDocument).not.toHaveBeenCalled();
  });

  test("reports an unreachable key endpoint as a server error", async () => {
    const { response, generateDocument } = await postDocument(
      createToken({ header: { kid: UNREACHABLE_KID } }),
    );

    expect(response.statusCode).toBe(500);
    expect(generateDocument).not.toHaveBeenCalled();
  });

  test("refuses to start with auth enabled but no application id", async () => {
    vi.stubEnv("DANGEROUS_DISABLE_AUTH", "false");
    vi.stubEnv("AZURE_APPLICATION_ID", undefined);
    const app = Fastify();

    await expect(setupAuth(app)).rejects.toThrow("Missing AZURE_APPLICATION_ID");
    await app.close();
  });
});
