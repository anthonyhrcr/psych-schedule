import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // jsdom supplies localStorage, which the storage layer is built on.
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // The libraries hold the logic worth testing; components are covered by
      // the browser checks, not by assertions about markup.
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/supabase.ts", "src/lib/navigation.ts"],
    },
  },
});
