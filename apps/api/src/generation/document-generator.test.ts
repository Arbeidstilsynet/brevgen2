import { DynamicMarkdownParseError } from "@at/dynamic-markdown";
import type { GenerateDocumentRequest } from "@repo/shared-types";
import { describe, expect, test, vi } from "vitest";
import { createDocumentGenerator, type Render } from "./document-generator";
import { resolveRenderConfig } from "./render-config";
import { GenerationScheduler } from "./scheduler";

function createScheduler() {
  return new GenerationScheduler({
    maxConcurrentJobs: 1,
    maxPendingJobs: 1,
    maxQueueWaitMs: 1_000,
    retryAfterSeconds: 1,
  });
}

describe("document generator", () => {
  test("renders expanded markdown with the resolved config", async () => {
    const render = vi.fn<Render>(async () => ({ content: "<p>ok</p>" }));
    const generator = createDocumentGenerator({ scheduler: createScheduler(), render });
    const request: GenerateDocumentRequest = {
      md: "Hei {{ navn }}",
      mdVariables: { navn: "Ola" },
      options: { as_html: true, dynamic: { template: "blank" } },
    };

    await expect(generator.generate(request, new AbortController().signal)).resolves.toEqual({
      content: "<p>ok</p>",
    });
    expect(render).toHaveBeenCalledWith(
      "Hei Ola",
      resolveRenderConfig(request.options),
      expect.any(Function),
      expect.any(Number),
    );
  });

  test("passes the default template letterhead, expanded body and signature to the renderer", async () => {
    const render = vi.fn<Render>(async () => ({ content: "<p>ok</p>" }));
    const generator = createDocumentGenerator({ scheduler: createScheduler(), render });

    await generator.generate(
      {
        md: "# Hei {{ navn }}",
        mdVariables: { navn: "Ola" },
        options: {
          dynamic: {
            template: "default",
            defaultTemplateArgs: {
              language: "bm",
              signatureVariant: "elektroniskGodkjent",
              fields: {
                dato: "28.10.2026",
                saksnummer: "2026/123",
                saksbehandlerNavn: "Kari",
                virksomhet: {
                  navn: "Eksempel AS",
                  adresse: "Gate 1",
                  postnr: "0123",
                  poststed: "Oslo",
                },
              },
            },
          },
        },
      },
      new AbortController().signal,
    );

    expect(render).toHaveBeenCalledOnce();
    const [md] = render.mock.calls[0];
    expect(md).toContain('alt="Logo"');
    expect(md).toContain("28.10.2026");
    expect(md).toContain("2026/123");
    expect(md).toMatch(/Eksempel AS[\s\S]*# Hei Ola[\s\S]*Dette brevet er elektronisk godkjent\./);
    expect(md).not.toContain("{{ navn }}");
  });

  test("rejects invalid Dynamic Markdown without taking a scheduler slot", async () => {
    const scheduler = createScheduler();
    const schedule = vi.spyOn(scheduler, "schedule");
    const generator = createDocumentGenerator({ scheduler, render: vi.fn<Render>() });

    await expect(
      generator.generate(
        {
          md: "# Test",
          mdVariables: { if: "reserved" },
          options: { dynamic: { template: "blank" } },
        },
        new AbortController().signal,
      ),
    ).rejects.toBeInstanceOf(DynamicMarkdownParseError);
    expect(schedule).not.toHaveBeenCalled();
  });
});
