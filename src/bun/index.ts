import { BrowserWindow, BrowserView, Updater, Utils } from "electrobun/bun";
import type { AppRPCSchema } from "./rpc-schema";
import { exec, spawn } from "child_process";
import { homedir } from "os";
import { readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";

const HOME_DIR = homedir();
const IS_WIN = process.platform === "win32";

function buildEnv() {
  const extraPaths = IS_WIN
    ? [`${process.env.APPDATA}\\npm`, `${HOME_DIR}\\.bun\\bin`]
    : [`${HOME_DIR}/.bun/bin`, `${HOME_DIR}/.npm-global/bin`,
       `${HOME_DIR}/.yarn/bin`, `/usr/local/bin`, `/opt/homebrew/bin`];
  const sep = IS_WIN ? ";" : ":";
  return {
    ...process.env,
    HOME: HOME_DIR,
    PATH: [...extraPaths, process.env.PATH ?? ""].join(sep),
  };
}

const MAX_BUFFER = 10 * 1024 * 1024; // 10MB

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

async function getMainViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel();
  if (channel === "dev") {
    try {
      await fetch(DEV_SERVER_URL, { method: "HEAD" });
      console.log(`HMR enabled: Using Vite dev server at ${DEV_SERVER_URL}`);
      return DEV_SERVER_URL;
    } catch {
      console.log(
        "Vite dev server not running. Run 'bun run dev:hmr' for HMR support."
      );
    }
  }
  return "views://mainview/index.html";
}

let mainWindow: BrowserWindow<AppRPCSchema>;

const rpc = BrowserView.defineRPC<AppRPCSchema>({
  handlers: {
    requests: {
      shellExec: ({ cmd, timeout }) => {
        return new Promise((resolve) => {
          const startTime = Date.now();
          console.log(`[shellExec] Starting: ${cmd}`);

          exec(
            cmd,
            {
              shell: IS_WIN ? undefined : "/bin/sh",
              timeout: timeout ?? 60000,
              maxBuffer: MAX_BUFFER,
              env: buildEnv(),
            },
            (err, stdout, stderr) => {
              const duration = Date.now() - startTime;
              if (err || stderr) {
                console.log(`[shellExec] Failed (${duration}ms):`, err?.message || stderr);
              } else {
                console.log(`[shellExec] Success (${duration}ms)`);
              }
              resolve({
                stdout: stdout || "",
                stderr: stderr || (err?.message ?? ""),
                code: err ? (err as any).code ?? 1 : 0,
              });
            }
          );
        });
      },

      openDirectory: async () => {
        const paths = await Utils.openFileDialog({
          canChooseDirectories: true,
          canChooseFiles: false,
          allowsMultipleSelection: false,
          title: "选择工作目录",
        });
        return paths && paths.length > 0 ? paths[0] : null;
      },

      getHomedir: () => {
        return homedir();
      },

      getPlatform: () => {
        return process.platform;
      },

      getConversationFiles: ({ projectPath }) => {
        const encodedPath = projectPath.replace(/[/\\]/g, "-");
        const projectDir = join(HOME_DIR, ".claude", "projects", encodedPath);
        try {
          const files = readdirSync(projectDir)
            .filter(f => f.endsWith(".jsonl"))
            .map(f => {
              const full = join(projectDir, f);
              const headLines = readFileSync(full, "utf8").split("\n").slice(0, 20).join("\n");
              return { path: full, mtime: statSync(full).mtimeMs, headLines };
            })
            .sort((a, b) => b.mtime - a.mtime)
            .slice(0, 10);
          return { files };
        } catch {
          return { files: [] };
        }
      },

      httpFetch: async ({ url }) => {
        const response = await fetch(url);
        return response.text();
      },

      chatContinue: (args) => {
        return new Promise((resolve, reject) => {
          const scriptPath = `${import.meta.dir}/../../resources/scripts/chat-continue.js`;

          const child = IS_WIN
            ? spawn("bun", [scriptPath, JSON.stringify(args)], { env: buildEnv() })
            : spawn("/bin/sh", ["-c", `bun "${scriptPath}" '${JSON.stringify(args).replace(/'/g, "'\\''")}'`], { env: buildEnv() });
          let buffer = "";

          child.stdout.on("data", (data: Buffer) => {
            buffer += data.toString();
            const parts = buffer.split("\n");
            buffer = parts.pop() ?? "";
            for (const part of parts) {
              if (part.trim()) {
                try {
                  const msg = JSON.parse(part);
                  mainWindow.webview.rpc.chatChunk(msg);
                } catch {
                  // ignore non-JSON lines
                }
              }
            }
          });

          child.stderr.on("data", (data: Buffer) => {
            console.error("[chat-continue stderr]", data.toString());
          });

          child.on("close", (code) => {
            if (buffer.trim()) {
              try {
                const msg = JSON.parse(buffer);
                mainWindow.webview.rpc.chatChunk(msg);
              } catch {}
            }
            mainWindow.webview.rpc.chatDone({ exitCode: code ?? 0 });
            resolve({ exitCode: code ?? 0 });
          });

          child.on("error", (err) => {
            mainWindow.webview.rpc.chatError({ message: err.message });
            reject(err);
          });
        });
      },
    },
    messages: {},
  },
});

const url = await getMainViewUrl();

mainWindow = new BrowserWindow({
  title: "42plugin work",
  url,
  rpc,
  frame: {
    width: 1200,
    height: 800,
    x: 200,
    y: 200,
  },
});

console.log("42plugin work app started!");
