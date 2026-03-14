import type { JsonlMessage } from './types';
import { view } from "../../rpc";

export async function appendMessageToJsonl(
  sessionId: string,
  projectPath: string,
  message: JsonlMessage
): Promise<void> {
  const encodedPath = projectPath.replace(/\//g, '-');
  const jsonLine = JSON.stringify(message);
  const cmd = `mkdir -p "$HOME/.claude/projects/${encodedPath}" && echo '${jsonLine}' >> "$HOME/.claude/projects/${encodedPath}/${sessionId}.jsonl"`;

  const result = await view.rpc.request.shellExec({ cmd });
  if (result.code !== 0) {
    throw new Error(result.stderr || 'Failed to write to JSONL file');
  }
}

export function createUserMessage(content: string, parentUuid: string | null = null): JsonlMessage {
  return {
    uuid: crypto.randomUUID(),
    parentUuid,
    type: 'user',
    message: {
      role: 'user',
      content: [{ type: 'text', text: content }],
    },
    timestamp: new Date().toISOString(),
  };
}

export function createAssistantMessage(content: string, parentUuid: string): JsonlMessage {
  return {
    uuid: crypto.randomUUID(),
    parentUuid,
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [{ type: 'text', text: content }],
    },
    timestamp: new Date().toISOString(),
  };
}
