import { rm } from "node:fs/promises";
import { buildServerBundles } from "../../../tooling/server-bundle.mjs";
import { buildHostPage } from "../../../tooling/ui-page.mjs";

export async function buildHost(outdir, { sentryDirectory = ".sentry/server/antigravity" } = {}) {
  await rm(sentryDirectory, { recursive: true, force: true });
  await buildHostPage({ entry: "packages/mcp-app/src/browser-panel.ts", template: "packages/mcp-app/src/browser-panel.html", output: `${outdir}/browser-panel.html` });
  await buildServerBundles({ entryPoints: { server: "apps/antigravity/server/index.ts" }, outdir, sentryDirectory, splitting: true });
}
