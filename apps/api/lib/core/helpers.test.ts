import { describe, expect, it } from "vitest";
import { OperationTimeoutError, withTimeout } from "./helpers";

describe("withTimeout", () => {
  it("returns the operation result before its deadline", async () => {
    await expect(withTimeout(Promise.resolve("done"), 10, "testing")).resolves.toBe("done");
  });

  it("rejects when an operation does not settle before its deadline", async () => {
    const pending = new Promise<never>(() => {});

    await expect(withTimeout(pending, 10, "testing")).rejects.toEqual(
      new OperationTimeoutError("testing", 10),
    );
  });
});
