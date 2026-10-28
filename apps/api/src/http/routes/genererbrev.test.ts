import { describe, expect, test } from "vitest";
import type { GenerateDocument } from "./genererbrev";
import { GenerationCancelledError, GenerationOverloadError } from "../../generation/scheduler";
import type { Output } from "../../renderer/types";
import { createTestApp } from "../../testing/create-test-app";

const requestPayload = {
  md: "# Test",
  options: {
    as_html: true,
    dynamic: {
      template: "blank" as const,
    },
  },
};

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function postDocument(generateDocument: GenerateDocument) {
  const app = await createTestApp({ generateDocument });
  return await app.inject({ method: "POST", url: "/genererbrev", payload: requestPayload });
}

describe("document generation route", () => {
  test.each<[string, Output, string]>([
    ["HTML as-is", { content: "<p>Test</p>" }, "<p>Test</p>"],
    ["PDF as base64", { content: Buffer.from("%PDF-1.7") }, "JVBERi0xLjc="],
  ])("returns %s", async (_name, output, expectedBody) => {
    let received: unknown;
    const response = await postDocument(async (request) => {
      received = request;
      return output;
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(expectedBody);
    expect(received).toEqual(requestPayload);
  });

  test("returns a retryable 503 response when document generation is overloaded", async () => {
    const response = await postDocument(async () => {
      throw new GenerationOverloadError("queue-full", 7);
    });

    expect(response.statusCode).toBe(503);
    expect(response.headers["retry-after"]).toBe("7");
    expect(response.json()).toEqual({
      message: "Service unavailable",
      error: "Document generation queue is full",
    });
  });

  test("does not report an unexpected 5xx when the caller disconnects while queued", async () => {
    const app = await createTestApp({
      generateDocument: async () => {
        throw new GenerationCancelledError();
      },
    });
    const loggedErrors: unknown[] = [];
    app.addHook("onRequest", async (request) => {
      request.log.error = (...args: unknown[]) => {
        loggedErrors.push(args);
      };
    });

    const response = await app.inject({
      method: "POST",
      url: "/genererbrev",
      payload: requestPayload,
    });

    expect(response.statusCode).toBe(499);
    expect(loggedErrors).toEqual([]);
  });

  test("does not cancel generation after a connected caller finishes sending its request", async () => {
    const releaseGeneration = createDeferred<string>();
    const app = await createTestApp({
      generateDocument: async (_request, signal) =>
        await Promise.race([
          releaseGeneration.promise.then((content) => ({ content })),
          new Promise<never>((_resolve, reject) => {
            signal.addEventListener("abort", () => reject(new GenerationCancelledError()), {
              once: true,
            });
          }),
        ]),
    });
    const address = await app.listen({ host: "127.0.0.1", port: 0 });
    const responsePromise = fetch(`${address}/genererbrev`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(requestPayload),
    });

    try {
      const earlyStatus = await Promise.race([
        responsePromise.then((response) => response.status),
        new Promise<undefined>((resolve) => setTimeout(resolve, 100)),
      ]);

      expect(earlyStatus).toBeUndefined();
      releaseGeneration.resolve("generated");
      expect((await responsePromise).status).toBe(200);
    } finally {
      releaseGeneration.resolve("generated");
      await responsePromise.catch(() => undefined);
    }
  });

  test("cancels generation when the caller disconnects before receiving a response", async () => {
    const generationStarted = createDeferred<void>();
    const generationCancelled = createDeferred<void>();
    const app = await createTestApp({
      generateDocument: async (_request, signal) => {
        generationStarted.resolve();
        await new Promise<void>((resolve) => {
          signal.addEventListener("abort", () => resolve(), { once: true });
        });
        generationCancelled.resolve();
        throw new GenerationCancelledError();
      },
    });
    const address = await app.listen({ host: "127.0.0.1", port: 0 });
    const controller = new AbortController();
    const responsePromise = fetch(`${address}/genererbrev`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    try {
      await generationStarted.promise;
      controller.abort();
      await responsePromise.catch(() => undefined);
      await expect(
        Promise.race([
          generationCancelled.promise.then(() => true),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1000)),
        ]),
      ).resolves.toBe(true);
    } finally {
      controller.abort();
      await responsePromise.catch(() => undefined);
    }
  });
});
