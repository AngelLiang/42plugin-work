import { ConversationDetail, ConversationMessage } from "./types";
import { view } from "../../rpc";

async function runShellRaw(cmd: string): Promise<string> {
  const result = await view.rpc.request.shellExec({ cmd });
  if (result.code === 0) return result.stdout;
  throw new Error(result.stderr || 'shell command failed');
}

function parseJsonlMessages(raw: string): ConversationMessage[] {
  const messages: ConversationMessage[] = [];
  const lines = raw.split('\n').filter(line => line.trim());

  for (const line of lines) {
    try {
      const obj = JSON.parse(line);
      const type = obj.type;

      if (type !== 'user' && type !== 'assistant') continue;

      const message = obj.message;
      if (!message) continue;

      const role = message.role as 'user' | 'assistant';
      const timestamp = obj.timestamp || '';
      const content = message.content;

      if (!Array.isArray(content)) continue;

      const textParts: string[] = [];
      for (const item of content) {
        if (item.type === 'text') {
          let text = item.text || '';
          text = text.replace(/<ide_opened_file>[\s\S]*?<\/ide_opened_file>\s*/g, '');
          text = text.replace(/<ide_selection>[\s\S]*?<\/ide_selection>\s*/g, '');
          text = text.trim();
          if (text) {
            textParts.push(text);
          }
        }
      }

      if (textParts.length === 0) continue;

      messages.push({
        role,
        content: textParts.join('\n'),
        timestamp,
      });
    } catch {
      continue;
    }
  }

  return messages;
}

export async function fetchConversationDetail(
  sessionId: string,
  projectPath: string
): Promise<ConversationDetail> {
  const encodedPath = projectPath.replace(/\//g, '-');
  const cmd = `cat "$HOME/.claude/projects/${encodedPath}/${sessionId}.jsonl"`;
  const raw = await runShellRaw(cmd);
  return {
    sessionId,
    messages: parseJsonlMessages(raw),
  };
}
