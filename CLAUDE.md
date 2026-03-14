# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
# 开发模式（带 HMR，推荐）
bun run dev:hmr

# 开发模式（不带 HMR）
bun run dev

# 仅启动 Vite HMR 服务器
bun run hmr

# 构建
vite build

# Canary 环境构建
bun run build:canary
```

## 架构概览

### 双进程架构

项目使用 Electrobun 的双进程架构：

1. **Bun 主进程** ([src/bun/index.ts](src/bun/index.ts))
   - 创建主窗口
   - 定义 RPC handlers
   - 执行 shell 命令和脚本
   - 启动时会检测 Vite dev server (端口 5173)，如果运行则使用 HMR 模式

2. **React 渲染进程** ([src/mainview/](src/mainview/))
   - 使用 Vite + React + Ant Design
   - 通过 Electroview RPC 与主进程通信

### RPC 通信架构

RPC schema 在 [src/bun/rpc-schema.ts](src/bun/rpc-schema.ts:1) 中定义，遵循类型安全的请求-响应模式：

- **Bun → Webview (messages)**: 用于流式数据推送，如 `chatChunk`
- **Webview → Bun (requests)**: 用于调用主进程功能，如 `shellExec`、`openDirectory`

**重要**: 添加新的 RPC 方法时，必须同步更新三个文件：
1. [src/bun/rpc-schema.ts](src/bun/rpc-schema.ts) - 定义类型
2. [src/bun/index.ts](src/bun/index.ts) - 实现 handlers
3. [src/mainview/rpc.ts](src/mainview/rpc.ts) - 已自动定义

### 42plugin 集成

所有 42plugin 交互通过 [src/mainview/lib/42plugin/api.ts](src/mainview/lib/42plugin/api.ts:1) 进行：

- 使用 `shellExec` RPC 调用 42plugin CLI
- 命令前会设置 PATH 环境变量：`export PATH="$PATH:$HOME/.bun/bin:$HOME/.npm-global/bin:$HOME/.yarn/bin:/usr/local/bin:/opt/homebrew/bin"`
- 支持解析 JSON 和文本格式的输出

### 对话数据存储

- 对话消息存储在 `~/.claude/projects/<encoded-path>/<sessionId>.jsonl`
- [src/mainview/lib/claude/writer.ts](src/mainview/lib/claude/writer.ts:1) 负责写入消息
- [src/mainview/lib/claude/reader.ts](src/mainview/lib/claude/reader.ts:1) 负责读取消息
- 路径编码: `/` 替换为 `-`

### 流式对话实现

流式对话通过以下方式实现：

1. 前端调用 `chatContinue` RPC 请求
2. Bun 进程启动独立脚本 [resources/scripts/chat-continue.js](resources/scripts/chat-continue.js)
3. 脚本通过 stdout 流式输出 JSON 消息
4. Bun 进程解析并通过 `chatChunk` message 推送到前端
5. 前端通过 [useChatContinuation](src/mainview/hooks/useChatContinuation.ts:1) hook 监听消息

### HMR 工作原理

开发模式下运行 `bun run dev:hmr` 时：
1. Vite 启动在 `http://localhost:5173`
2. Electrobun 检测到 dev server，自动加载其 URL
3. React 组件更改即时热更新
4. 不需要手动构建

## 关键文件位置

| 功能 | 文件 |
|------|------|
| RPC Schema | [src/bun/rpc-schema.ts](src/bun/rpc-schema.ts) |
| Bun 主入口 | [src/bun/index.ts](src/bun/index.ts) |
| RPC 客户端 | [src/mainview/rpc.ts](src/mainview/rpc.ts) |
| 42plugin API | [src/mainview/lib/42plugin/api.ts](src/mainview/lib/42plugin/api.ts) |
| Claude 读写 | [src/mainview/lib/claude/](src/mainview/lib/claude/) |
| 流式对话脚本 | [resources/scripts/chat-continue.js](resources/scripts/chat-continue.js) |
| App 组件 | [src/mainview/App.tsx](src/mainview/App.tsx) |
| Electrobun 配置 | [electrobun.config.ts](electrobun.config.ts) |

## 添加新功能的注意事项

1. **添加 RPC 方法**: 必须同步更新 rpc-schema.ts、bun/index.ts 和 rpc.ts
2. **shell 命令**: 使用 PATH_EXPORT 前缀确保能找到 bun/npm/yarn
3. **流式输出**: 使用 message 类型而非 request，避免阻塞
4. **路径处理**: 项目路径在存储到 ~/.claude 时需要编码 (/ 替换为 -)
5. **42plugin 集成**: 优先使用现有的 `run42plugin` 和 `runViaShell` 辅助函数

## 注意事项

- 使用中文回复
- 不要执行git相关的命令，由用户执行
