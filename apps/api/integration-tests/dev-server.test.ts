import { spawn } from "node:child_process";
import { once } from "node:events";
import { appendFile, copyFile, cp, mkdtemp, rm, symlink } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import packageJson from "../package.json";

test("restarts the development API after repeated server changes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "brevgen-api-dev-"));
  const apiDirectory = fileURLToPath(new URL("../", import.meta.url));
  await Promise.all([
    copyFile(join(apiDirectory, "package.json"), join(directory, "package.json")),
    // Copied rather than symlinked: the test edits src/server.ts to trigger reloads.
    cp(join(apiDirectory, "src"), join(directory, "src"), { recursive: true }),
    symlink(join(apiDirectory, "node_modules"), join(directory, "node_modules"), "dir"),
  ]);

  const portReservation = createServer();
  portReservation.listen(0, "127.0.0.1");
  await once(portReservation, "listening");
  const address = portReservation.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not reserve a port for the development API");
  }
  await new Promise<void>((resolve, reject) => {
    portReservation.close((error) => (error ? reject(error) : resolve()));
  });

  const [environment, runner, ...args] = packageJson.scripts.dev.split(" ");
  expect(environment).toBe("NODE_ENV=development");
  expect(runner).toBe("tsx");
  const child = spawn(process.execPath, [fileURLToPath(import.meta.resolve("tsx/cli")), ...args], {
    cwd: directory,
    env: {
      ...process.env,
      NODE_ENV: "development",
      DANGEROUS_DISABLE_AUTH: "true",
      PORT: String(address.port),
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk: Buffer) => {
    output += chunk.toString();
  });

  const url = `http://127.0.0.1:${address.port}`;
  const waitForApi = async () => {
    await expect
      .poll(
        async () => {
          if (child.exitCode !== null) {
            throw new Error(`Development API exited:\n${output}`);
          }
          const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
          if (response.status !== 200) {
            throw new Error(`Development API returned ${response.status}:\n${output}`);
          }
          return response.json();
        },
        { timeout: 15_000, interval: 100 },
      )
      .toMatchObject({ name: "Brevgenerator2 API" });
  };

  try {
    await waitForApi();
    for (let reload = 0; reload < 2; reload++) {
      output = "";
      await expect
        .poll(
          async () => {
            if (!/restarting/i.test(output)) {
              await appendFile(
                join(directory, "src", "server.ts"),
                "\n// Trigger a development reload.\n",
              );
            }
            return output;
          },
          { timeout: 10_000, interval: 250 },
        )
        .toMatch(/restarting/i);
      await expect
        .poll(() => output, { timeout: 15_000, interval: 100 })
        .toMatch(/Restarting[\s\S]*Server listening at/i);
      await waitForApi();
      expect(output).not.toMatch(/FST_ERR_|already listening|already been registered/);
    }
  } finally {
    if (child.pid && child.exitCode === null) {
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      await exited;
    }
    await rm(directory, { recursive: true, force: true });
  }
}, 60_000);
