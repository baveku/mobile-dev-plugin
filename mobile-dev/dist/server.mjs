
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="caa28569-0327-564a-9ab5-776773992c23")}catch(e){}}();
;(function(){var g=globalThis.__SENTRY_ORCHESTRION__=globalThis.__SENTRY_ORCHESTRION__||{};g.bundler=g.bundler||new Set();})();import { createRequire as mobileDevBundleRequire } from 'node:module'; import { fileURLToPath as mobileDevFileURLToPath } from 'node:url'; import { dirname as mobileDevPathDirname } from 'node:path'; const require = mobileDevBundleRequire(import.meta.url); const __filename = mobileDevFileURLToPath(import.meta.url); const __dirname = mobileDevPathDirname(__filename);

// apps/antigravity/server/index.ts
if (process.env.MOBILE_DEV_SERVER_WORKER === "1" || process.env.MOBILE_DEV_SIDECAR_STANDALONE === "1" || process.env.MOBILE_DEV_NO_SUPERVISOR === "1") {
  await import("./instrument-7WETHMB3.mjs");
  await import("./server-NSVPDCYX.mjs");
} else {
  const { runHotReloadSupervisor } = await import("./supervisor-NT743YZG.mjs");
  await runHotReloadSupervisor(import.meta.url);
}

//# debugId=caa28569-0327-564a-9ab5-776773992c23
