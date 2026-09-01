import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the build works both at a domain root and under
  // a subpath like GitHub Pages' /psych-schedule/. Safe here because page
  // state lives in React, not in the URL — there are no routes to resolve.
  base: "./",
  server: {
    port: 5173,
  },
});
