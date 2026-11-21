
!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="f4f3c565-269c-54bd-ac13-86a914f6d0b9")}catch(e){}}();
import { createRequire as mobileDevBundleRequire } from 'node:module'; import { fileURLToPath as mobileDevFileURLToPath } from 'node:url'; import { dirname as mobileDevPathDirname } from 'node:path'; const require = mobileDevBundleRequire(import.meta.url); const __filename = mobileDevFileURLToPath(import.meta.url); const __dirname = mobileDevPathDirname(__filename);
import "./chunk-WNUFIJT5.mjs";

// apps/antigravity/server/supervisor.ts
import { spawn } from "node:child_process";
import { watch } from "node:fs";
import { stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
function readLines(stream, onLine) {
  let buffer = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    buffer += chunk;
    let idx = buffer.indexOf("\n");
    while (idx !== -1) {
      const line = buffer.slice(0, idx).replace(/\r$/, "");
      buffer = buffer.slice(idx + 1);
      if (line.length > 0) onLine(line);
      idx = buffer.indexOf("\n");
    }
  });
  stream.on("end", () => {
    const tail = buffer.replace(/\r$/, "");
    if (tail.length > 0) onLine(tail);
  });
}
function tryParseJson(line) {
  try {
    const parsed = JSON.parse(line);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
async function runHotReloadSupervisor(entryUrl) {
  const entryPath = fileURLToPath(entryUrl);
  const distDir = dirname(entryPath);
  const pinPath = join(distDir, "panel-runtime.json");
  let activeWorker = null;
  let savedInitialize = null;
  let hasInitialized = false;
  let reloading = false;
  let reloadQueued = false;
  let shuttingDown = false;
  let pendingLines = [];
  let debounceTimer;
  let watcher;
  let distIno;
  let currentStamp = null;
  async function readStamp() {
    const serverStat = await stat(entryPath).catch(() => null);
    if (!serverStat) return null;
    const pinStat = await stat(pinPath).catch(() => null);
    const pinPart = pinStat ? `${pinStat.mtimeMs}:${pinStat.size}` : "none";
    return `${serverStat.ino}:${serverStat.mtimeMs}:${serverStat.size}|${pinPart}`;
  }
  function spawnWorker() {
    return spawn(process.execPath, [...process.execArgv, entryPath], {
      env: { ...process.env, MOBILE_DEV_SERVER_WORKER: "1" },
      stdio: ["pipe", "pipe", "inherit"]
    });
  }
  function attachActiveOutput(worker) {
    readLines(worker.stdout, (line) => {
      process.stdout.write(`${line}
`);
    });
  }
  function flushPendingToActive() {
    if (!activeWorker?.stdin.writable || pendingLines.length === 0) return;
    const lines = pendingLines;
    pendingLines = [];
    for (const line of lines) {
      activeWorker.stdin.write(`${line}
`);
    }
  }
  function attachCrashHandler(worker) {
    worker.once("exit", () => {
      if (shuttingDown) return;
      if (worker === activeWorker && !reloading) {
        activeWorker = null;
        setTimeout(() => {
          if (shuttingDown) return;
          if (savedInitialize !== null) {
            void reloadWorker();
          } else {
            const fresh = spawnWorker();
            activeWorker = fresh;
            attachActiveOutput(fresh);
            attachCrashHandler(fresh);
            flushPendingToActive();
          }
        }, 500).unref();
      }
    });
  }
  async function waitForEntry() {
    for (let i = 0; i < 40; i++) {
      if (shuttingDown) return false;
      const entry = await stat(entryPath).catch(() => null);
      if (entry) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  }
  async function warmupWorker(worker, initMessage) {
    return await new Promise((resolve) => {
      let settled = false;
      const bufferedAfterInit = [];
      let initDone = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (ok) {
          for (const extra of bufferedAfterInit) {
            process.stdout.write(`${extra}
`);
          }
        }
        resolve(ok);
      };
      const timeout = setTimeout(() => finish(false), 15e3);
      timeout.unref();
      worker.once("exit", () => finish(false));
      worker.once("error", () => finish(false));
      readLines(worker.stdout, (line) => {
        if (settled) {
          process.stdout.write(`${line}
`);
          return;
        }
        if (!initDone) {
          const msg = tryParseJson(line);
          if (msg && msg.id === "__mobile_dev_reload_init__") {
            initDone = true;
            finish(msg.error === void 0);
            return;
          }
        }
        if (initDone) {
          bufferedAfterInit.push(line);
        }
      });
      const syntheticInit = JSON.stringify({ ...initMessage, id: "__mobile_dev_reload_init__" });
      worker.stdin.write(`${syntheticInit}
`);
    });
  }
  async function reloadWorker() {
    if (shuttingDown || savedInitialize === null) return;
    if (reloading) {
      reloadQueued = true;
      return;
    }
    reloading = true;
    try {
      const ready = await waitForEntry();
      if (!ready || shuttingDown) return;
      const nextWorker = spawnWorker();
      const ok = await warmupWorker(nextWorker, savedInitialize);
      if (!ok || shuttingDown) {
        try {
          nextWorker.kill("SIGTERM");
        } catch {
        }
        return;
      }
      if (hasInitialized) {
        nextWorker.stdin.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
      }
      const oldWorker = activeWorker;
      activeWorker = nextWorker;
      attachCrashHandler(nextWorker);
      reloading = false;
      flushPendingToActive();
      if (oldWorker) {
        try {
          oldWorker.stdin.end();
        } catch {
        }
        setTimeout(() => {
          try {
            oldWorker.kill("SIGTERM");
          } catch {
          }
        }, 5e3).unref();
      }
      process.stdout.write('{"jsonrpc":"2.0","method":"notifications/tools/list_changed"}\n');
      process.stdout.write('{"jsonrpc":"2.0","method":"notifications/resources/list_changed"}\n');
    } finally {
      reloading = false;
      flushPendingToActive();
      if (reloadQueued && !shuttingDown) {
        reloadQueued = false;
        void reloadWorker();
      }
    }
  }
  function scheduleReload() {
    if (shuttingDown || savedInitialize === null) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      void reloadWorker();
    }, 800);
    debounceTimer.unref();
  }
  async function checkUpdates() {
    if (shuttingDown) return;
    const dirStat = await stat(distDir).catch(() => null);
    if (dirStat && dirStat.ino !== distIno) {
      distIno = dirStat.ino;
      attachWatcher();
    }
    const nextStamp = await readStamp();
    if (nextStamp !== null && nextStamp !== currentStamp) {
      currentStamp = nextStamp;
      scheduleReload();
    }
  }
  function attachWatcher() {
    watcher?.close();
    watcher = void 0;
    try {
      watcher = watch(distDir, (_event, filename) => {
        if (!filename || filename === "server.mjs" || filename === "panel-runtime.json") {
          void checkUpdates();
        }
      });
      watcher.on("error", () => {
        watcher?.close();
        watcher = void 0;
      });
    } catch {
      watcher = void 0;
    }
  }
  currentStamp = await readStamp();
  distIno = (await stat(distDir).catch(() => null))?.ino;
  attachWatcher();
  const initialWorker = spawnWorker();
  activeWorker = initialWorker;
  attachActiveOutput(initialWorker);
  attachCrashHandler(initialWorker);
  const pollTimer = setInterval(() => {
    void checkUpdates();
  }, 2500);
  pollTimer.unref();
  let resolveExit;
  const done = new Promise((resolve) => {
    resolveExit = resolve;
  });
  function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    clearTimeout(debounceTimer);
    clearInterval(pollTimer);
    watcher?.close();
    const worker = activeWorker;
    if (!worker) {
      resolveExit();
      return;
    }
    const timer = setTimeout(() => {
      try {
        worker.kill("SIGKILL");
      } catch {
      }
      resolveExit();
    }, 5e3);
    timer.unref();
    worker.once("exit", () => {
      clearTimeout(timer);
      resolveExit();
    });
    try {
      worker.stdin.end();
    } catch {
    }
    if (signal) {
      try {
        worker.kill(signal);
      } catch {
      }
    }
  }
  readLines(process.stdin, (line) => {
    if (shuttingDown) return;
    const msg = tryParseJson(line);
    if (msg?.method === "initialize" && msg.id !== void 0) {
      savedInitialize = msg;
    } else if (msg?.method === "notifications/initialized") {
      hasInitialized = true;
    }
    if (reloading || !activeWorker?.stdin.writable) {
      pendingLines.push(line);
      return;
    }
    activeWorker.stdin.write(`${line}
`);
  });
  process.stdin.on("end", () => shutdown());
  process.stdin.on("close", () => shutdown());
  const onSigTerm = () => shutdown("SIGTERM");
  const onSigInt = () => shutdown("SIGINT");
  process.once("SIGTERM", onSigTerm);
  process.once("SIGINT", onSigInt);
  await done;
  process.off("SIGTERM", onSigTerm);
  process.off("SIGINT", onSigInt);
}
export {
  runHotReloadSupervisor
};

//# debugId=f4f3c565-269c-54bd-ac13-86a914f6d0b9
