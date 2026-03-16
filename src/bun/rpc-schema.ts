import type { RPCSchema } from "electrobun/bun";

export type ShellResult = {
  stdout: string;
  stderr: string;
  code: number;
};

export type ChatContinueArgs = {
  sessionId: string;
  projectPath: string;
  message: string;
  apiKey?: string;
};

export type ChatChunk = {
  type: "text" | "error" | "done";
  content: string;
};

export type AppRPCSchema = {
  bun: RPCSchema<{
    requests: {
      shellExec: { params: { cmd: string; timeout?: number }; response: ShellResult };
      openDirectory: { params: Record<string, never>; response: string | null };
      getHomedir: { params: Record<string, never>; response: string };
      chatContinue: { params: ChatContinueArgs; response: { exitCode: number } };
      httpFetch: { params: { url: string }; response: string };
    };
    messages: Record<string, never>;
  }>;
  webview: RPCSchema<{
    requests: Record<string, never>;
    messages: {
      chatChunk: ChatChunk;
      chatDone: { exitCode: number };
      chatError: { message: string };
    };
  }>;
};
