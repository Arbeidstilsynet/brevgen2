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
