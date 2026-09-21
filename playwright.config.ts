import { defineConfig, devices } from "@playwright/test";

const PORT = 5174;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "line" : [["list"]],

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },

  projects: [
    // The touch affordance differs by design: the "+" on an empty hour is
    // hidden until hover on a pointer device and always visible without one.
    // So the touch spec belongs to the mobile project alone, and the desktop
    // project has to exclude it rather than merely not matching it.
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /touch\.spec\.ts/,
    },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /touch\.spec\.ts/ },
  ],

  webServer: {
    // Blanking the Supabase vars overrides .env.local and puts the app in
    // local-only mode, so these flows need no account and no credentials.
    command: `VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
