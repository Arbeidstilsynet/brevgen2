import Fastify from "fastify";
import { pino } from "pino";
import { describe, expect, it } from "vitest";
import { formatLogObject } from "./logger";

describe("formatLogObject", () => {
  it("rounds responseTime to two decimals", () => {
    expect(formatLogObject({ responseTime: 441.12345678901 })).toEqual({ responseTime: 441.12 });
  });

  it("leaves other fields untouched", () => {
    const object = { msg: "request completed", id: "12345678901" };
    expect(formatLogObject(object)).toBe(object);
  });

  it("rounds responseTime in Fastify's request completed log", async () => {
    const lines: string[] = [];
    const app = Fastify({
      loggerInstance: pino(
        { formatters: { log: formatLogObject } },
        { write: (line: string) => lines.push(line) },
      ),
    });
    app.get("/", async () => "ok");

    await app.inject({ method: "GET", url: "/" });
    await app.close();

    const completed = lines
      .map((line) => JSON.parse(line))
      .find((l) => l.msg === "request completed");
    expect(typeof completed.responseTime).toBe("number");
    expect(String(completed.responseTime)).toMatch(/^\d+(\.\d{1,2})?$/);
  });
});
