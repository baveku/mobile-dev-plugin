
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="483d2076-1ec2-5b50-9ebc-595c78f51f27")}catch(e){}}();
;(function(){var g=globalThis.__SENTRY_ORCHESTRION__=globalThis.__SENTRY_ORCHESTRION__||{};g.bundler=g.bundler||new Set();})();import { createRequire as mobileDevBundleRequire } from 'node:module'; import { fileURLToPath as mobileDevFileURLToPath } from 'node:url'; import { dirname as mobileDevPathDirname } from 'node:path'; const require = mobileDevBundleRequire(import.meta.url); const __filename = mobileDevFileURLToPath(import.meta.url); const __dirname = mobileDevPathDirname(__filename);

// apps/antigravity/server/index.ts
if (process.env.MOBILE_DEV_SERVER_WORKER === "1" || process.env.MOBILE_DEV_SIDECAR_STANDALONE === "1" || process.env.MOBILE_DEV_NO_SUPERVISOR === "1") {
  await import("./instrument-O6OGDY4W.mjs");
  await import("./server-VUW6NBK5.mjs");
} else {
  const { runHotReloadSupervisor } = await import("./supervisor-TLUQ3E37.mjs");
  await runHotReloadSupervisor(import.meta.url);
}

//# debugId=483d2076-1ec2-5b50-9ebc-595c78f51f27
