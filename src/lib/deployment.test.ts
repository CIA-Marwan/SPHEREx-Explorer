import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("uses the configured Pages base for saved assets and disables live API access", async () => {
  vi.stubEnv("MODE", "pages");
  vi.stubEnv("BASE_URL", "/SPHEREx-Explorer/");
  const { publicAsset, staticOnly } = await import("./deployment");
  expect(staticOnly).toBe(true);
  expect(publicAsset("observations/manifest.json")).toBe("/SPHEREx-Explorer/observations/manifest.json");
});

it("retains live API mode and root asset paths for the standard build", async () => {
  vi.stubEnv("MODE", "production");
  vi.stubEnv("BASE_URL", "/");
  const { publicAsset, staticOnly } = await import("./deployment");
  expect(staticOnly).toBe(false);
  expect(publicAsset("observations/example.png")).toBe("/observations/example.png");
});
