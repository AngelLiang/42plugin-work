#!/usr/bin/env bun
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { homedir } from 'os';

const args = JSON.parse(process.argv[2]);
const { sessionId, projectPath, message } = args;

console.error(`[chat-continue] Starting with sessionId: ${sessionId}, projectPath: ${projectPath}`);

// 从 JSONL 文件读取历史消息
function loadHistory(sessionId, projectPath) {
  try {
    const encodedPath = projectPath.replace(/\//g, '-');
    const filePath = `${homedir()}/.claude/projects/${encodedPath}/${sessionId}.jsonl`;
    const raw = readFileSync(filePath, 'utf-8');
    const messages = [];

    for (const line of raw.split('\n').filter(Boolean)) {
      try {
        const obj = JSON.parse(line);
        if (obj.type !== 'user' && obj.type !== 'assistant') continue;
        const content = obj.message?.content;
        if (!Array.isArray(content)) continue;

        const textParts = content
          .filter(c => c.type === 'text' && c.text?.trim())
          .map(c => c.text.trim());

        if (textParts.length === 0) continue;

        messages.push({
          role: obj.message.role,
          content: textParts.join('\n'),
        });
      } catch {
        // 跳过无效行
      }
    }

    return messages;
  } catch {
    return [];
  }
}

try {
  const clientConfig = {};

  if (process.env.ANTHROPIC_BASE_URL) {
    clientConfig.baseURL = process.env.ANTHROPIC_BASE_URL;
  }

  const client = new Anthropic(clientConfig);

  // 读取历史消息
  const history = loadHistory(sessionId, projectPath);

  // 如果没有历史，使用当前消息；否则历史已包含最新的 user 消息
  const messages = history.length > 0 ? history : [{ role: 'user', content: message }];

  console.error(`[chat-continue] Calling API with ${messages.length} messages`);

  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-4-5';

  const stream = await client.messages.stream({
    model,
    max_tokens: 8096,
    messages,
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      process.stdout.write(
        JSON.stringify({ type: 'text', content: event.delta.text }) + '\n'
      );
    }
  }

  process.stdout.write(JSON.stringify({ type: 'done', content: '' }) + '\n');
} catch (error) {
  // 错误也走 stdout，保证前端能读到
  process.stdout.write(
    JSON.stringify({ type: 'error', content: error.message }) + '\n'
  );
  process.exit(1);
}
