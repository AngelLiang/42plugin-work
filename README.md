# 42plugin Work

一个基于 Electrobun + React + Ant Design 构建的桌面应用，提供现代化的图形界面来管理 [42plugin](https://42plugin.com) 插件生态。

## 功能特性

### 插件市场
- 浏览、搜索 42plugin 插件
- 按类型过滤（Skill、Command、Hook、Agent）
- 按活水指数、最近更新、下载量排序
- 一键安装 / 卸载插件
- 查看插件详情（版本、作者、下载量、评分、主页链接）
- 分别管理项目级和全局插件

### 项目管理
- 快速切换工作目录
- 显示最近使用的项目列表
- 支持浏览并选择任意目录

### 账户与设置
- 42plugin 账户登录 / 登出
- 深色 / 浅色主题切换
- 界面语言切换（中文 / 英文）
- 查看应用版本和 CLI 版本信息

## 快速开始

```bash
# 安装依赖
bun install

# 开发模式（带 HMR，推荐）
bun run dev:hmr

# 开发模式（不带 HMR）
bun run dev

# 构建
vite build

# Canary 环境构建
bun run build:canary
```

## HMR 工作原理

运行 `bun run dev:hmr` 时：

1. Vite dev server 启动在 `http://localhost:5173`
2. Electrobun 检测到 dev server，自动加载其 URL
3. React 组件更改即时热更新，无需手动重建

运行 `bun run dev`（不带 HMR）时：

1. Electrobun 从 `views://mainview/index.html` 加载
2. 修改代码后需手动执行 `vite build` 才能看到变化

## 项目结构

```
├── src/
│   ├── bun/
│   │   ├── index.ts              # 主进程入口，RPC handlers
│   │   └── rpc-schema.ts         # RPC 类型定义
│   └── mainview/
│       ├── App.tsx               # 主应用组件，路由和主题管理
│       ├── main.tsx              # React 入口
│       ├── rpc.ts                # RPC 客户端
│       ├── pages/                # 页面组件
│       │   ├── PluginMarketPage.tsx
│       │   ├── AccountPage.tsx
│       │   └── ProjectPickerPage.tsx
│       ├── components/           # UI 组件
│       ├── hooks/                # React Hooks
│       └── lib/
│           ├── 42plugin/         # 42plugin CLI 集成
│           └── claude/           # 对话数据读写
├── resources/
│   └── scripts/
│       └── chat-continue.js      # 流式对话脚本
├── electrobun.config.ts          # Electrobun 配置
├── vite.config.ts                # Vite 配置
└── package.json
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面框架 | [Electrobun](https://electrobun.dev) 1.15 |
| 运行时 | Bun |
| 前端框架 | React 18 + Vite |
| UI 组件库 | Ant Design 6 |
| 样式 | Tailwind CSS |
| 语言 | TypeScript |

## 架构说明

项目采用 Electrobun 双进程架构：

- **Bun 主进程**（`src/bun/`）：负责窗口管理、shell 命令执行、RPC handler 实现
- **React 渲染进程**（`src/mainview/`）：负责 UI 渲染，通过 RPC 与主进程通信

所有 42plugin CLI 调用通过 `src/mainview/lib/42plugin/api.ts` 统一封装，执行前会自动设置 PATH 环境变量以确保找到 CLI 工具。

## 前置依赖

- [Bun](https://bun.sh) >= 1.0
- [42plugin CLI](https://42plugin.com) — 插件管理功能依赖此 CLI，应用内支持一键安装
