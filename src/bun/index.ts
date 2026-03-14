import { BrowserWindow, BrowserView, Updater, Utils } from "electrobun/bun";
import type { AppRPCSchema } from "./rpc-schema";
import { exec, spawn } from "child_process";
import { homedir } from "os";
import { mkdir, access } from "fs/promises";
import { join } from "path";

const HOME_DIR = homedir();
const PATH_EXPORT =
  `export PATH="$PATH:${HOME_DIR}/.bun/bin:${HOME_DIR}/.npm-global/bin:${HOME_DIR}/.yarn/bin:/usr/local/bin:/opt/homebrew/bin"`;

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
      shellExec: ({ cmd }) => {
        return new Promise((resolve) => {
          const startTime = Date.now();
          console.log(`[shellExec] Starting: ${cmd}`);

          exec(
            `${PATH_EXPORT} && ${cmd}`,
            {
              shell: "/bin/sh",
              timeout: 60000, // 增加到 60 秒
              maxBuffer: MAX_BUFFER,
              env: { ...process.env, HOME: HOME_DIR }
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

      initWorkDir: async () => {
        const defaultPath = join(HOME_DIR, 'showwork');

        try {
          await access(defaultPath);
        } catch {
          await mkdir(defaultPath, { recursive: true });
          console.log(`Created default work directory: ${defaultPath}`);
        }

        return defaultPath;
      },

      httpFetch: async ({ url }) => {
        const response = await fetch(url);
        return response.text();
      },

      chatContinue: (args) => {
        return new Promise((resolve, reject) => {
          const scriptPath = `${import.meta.dir}/../../resources/scripts/chat-continue.js`;
          const escapedArgs = JSON.stringify(args).replace(/'/g, "'\\''");
          const cmd = `${PATH_EXPORT} && bun "${scriptPath}" '${escapedArgs}'`;

          const child = spawn("/bin/sh", ["-c", cmd]);
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
  title: "Work42",
  url,
  rpc,
  frame: {
    width: 1200,
    height: 800,
    x: 200,
    y: 200,
  },
});

console.log("Work42 app started!");
