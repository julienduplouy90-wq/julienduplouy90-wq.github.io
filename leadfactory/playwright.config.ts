import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: { baseURL: `http://localhost:${PORT}`, trace: "off" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/dashboard`,
    timeout: 180_000,
    reuseExistingServer: false,
    // Base en mémoire : chaque exécution repart d'un état propre, sans toucher à .data/
    env: { DATABASE_MODE: "memory", SEED_DEMO: "true", NEXT_DIST_DIR: ".next-e2e" },
  },
});
