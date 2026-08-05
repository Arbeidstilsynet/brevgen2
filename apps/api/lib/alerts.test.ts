import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { documentGenerationMetricNames } from "./otel";

const alertsPath = fileURLToPath(new URL("../../../.nais/alerts.yaml", import.meta.url));

function toPrometheusName(metricName: string) {
  return metricName.replaceAll(".", "_");
}

describe("alert rules", () => {
  test("only reference metrics the api actually exports", () => {
    const alerts = readFileSync(alertsPath, "utf8");
    const referenced = [...alerts.matchAll(/\bbrevgen_[a-z0-9_]+/g)].map(([match]) => match);
    const exported = Object.values(documentGenerationMetricNames).map(toPrometheusName);

    expect(referenced.length).toBeGreaterThan(0);
    for (const metric of referenced) {
      // Counters are exported with a `_total` suffix by the Prometheus exporter.
      expect(exported).toContain(metric.replace(/_total$/, ""));
    }
  });

  test("subtract controlled overload responses from the unexpected 5xx signal", () => {
    const alerts = readFileSync(alertsPath, "utf8");
    const overloadResponses = toPrometheusName(documentGenerationMetricNames.overloadResponses);

    // An absent counter series must fall back to zero, otherwise the subtraction
    // yields an empty vector and the critical alert can never fire.
    expect(alerts).toContain(`- (sum(increase(${overloadResponses}_total[15m])) or vector(0)) > 0`);
  });
});
