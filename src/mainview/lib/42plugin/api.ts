import { Plugin, StatusData, AuthStatus, Conversation } from "./types";
import { view } from "../../rpc";

// 注意：PATH 环境变量已在后端 (src/bun/index.ts) 中统一设置
// 这里直接传递命令给后端执行

export async function runViaShell(args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
  const escaped = args.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(' ');
  return view.rpc.request.shellExec({ cmd: `42plugin ${escaped}` });
}

export async function run42plugin(args: string[], workDir?: string): Promise<string> {
  const escaped = args.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(' ');
  const cmd = workDir
    ? `cd '${workDir.replace(/'/g, "'\\''")}' && 42plugin ${escaped}`
    : `42plugin ${escaped}`;
  const { stdout, stderr, code } = await view.rpc.request.shellExec({ cmd });
  if (code === 0) return stdout;
  throw new Error(stderr || stdout || '命令执行失败');
}

export async function checkAuth(): Promise<AuthStatus> {
  try {
    // 使用 status --json 替代 auth --status，因为它包含认证信息且更可靠
    const output = await run42plugin(['status', '--json']);
    const data = JSON.parse(output);

    const loggedIn = !!(data.user && data.user.username);
    const username = data.user?.username || '';

    return { loggedIn, username };
  } catch (error) {
    console.error("Failed to check auth:", error);
    return { loggedIn: false, username: '' };
  }
}

export async function fetchStatus(): Promise<StatusData | null> {
  try {
    const output = await run42plugin(['status', '--json']);
    return JSON.parse(output);
  } catch (error) {
    console.error("Failed to load status:", error);
    return null;
  }
}

export async function fetchInstalledPlugins(): Promise<Plugin[]> {
  try {
    const output = await run42plugin(['list', '--all', '--json']);

    try {
      const plugins = JSON.parse(output);
      const pluginArray = Array.isArray(plugins) ? plugins : [];
      return pluginArray.map(p => ({
        id: p.id,
        name: p.name || p.fullName,
        description: p.description || p.descriptionZh || '',
        version: p.version,
        author: p.author?.username || p.fullName?.split('/')[0] || 'Unknown',
        installed: true,
        fullName: p.fullName,
        linkPath: p.linkPath,
        installedAt: p.installedAt,
        tags: p.tags,
      }));
    } catch {
      const plugins: Plugin[] = [];
      const lines = output.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          plugins.push({
            id: parts[0],
            name: parts[0],
            version: parts[1],
            description: parts.slice(2, -1).join(' '),
            author: parts[parts.length - 1],
            installed: true,
          });
        }
      }
      return plugins;
    }
  } catch (error) {
    console.error("Failed to load installed plugins:", error);
    return [];
  }
}

export async function searchPlugins(query: string): Promise<Plugin[]> {
  try {
    const output = await run42plugin(['search', query, '--json']);

    try {
      const data = JSON.parse(output);
      const pluginsArray = Array.isArray(data.plugins) ? data.plugins : [];
      return pluginsArray.map((p: any) => ({
        id: p.fullName,
        name: p.name,
        description: p.description || '',
        version: p.version,
        author: p.author?.username || 'Unknown',
        installed: false,
        type: p.type || p.plugin_type,
      }));
    } catch {
      const plugins: Plugin[] = [];
      const lines = output.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 3) {
          plugins.push({
            id: parts[0],
            name: parts[0],
            description: parts.slice(1, -1).join(' '),
            version: 'unknown',
            author: parts[parts.length - 1],
            installed: false,
          });
        }
      }
      return plugins;
    }
  } catch (error) {
    console.error("Failed to search plugins:", error);
    return [];
  }
}

export async function fetchPlugins(page = 1, perPage = 12, type?: string, sort?: string): Promise<{ plugins: Plugin[]; hasMore: boolean }> {
  try {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (type) params.set('type', type);
    if (sort) params.set('sort', sort);
    const text = await view.rpc!.request.httpFetch({ url: `https://42plugin.com/api/v1/plugins?${params}` });
    const data = JSON.parse(text);
    const pluginsArray = Array.isArray(data.data) ? data.data : [];
    const plugins = pluginsArray.map((p: any) => ({
      id: p.full_name,
      name: p.name,
      description: p.description_zh || p.description || '',
      version: p.version,
      author: p.author?.username || 'Unknown',
      installed: false,
      fullName: p.full_name,
      descriptionZh: p.description_zh,
      homepage: p.homepage,
      tags: p.tags,
      type: p.type || p.plugin_type,
      downloads: p.downloads,
      score10: p.score?.score10,
      stars: p.score?.stars,
    }));
    return { plugins, hasMore: pluginsArray.length === perPage };
  } catch (error) {
    console.error("Failed to fetch plugins:", error);
    return { plugins: [], hasMore: false };
  }
}

export async function fetchConversationHistory(workDir?: string): Promise<Conversation[]> {
  if (!workDir) return [];

  try {
    const encodedPath = workDir.replace(/\//g, '-');
    const projectDir = `$HOME/.claude/projects/${encodedPath}`;

    // 第一步：获取按修改时间降序排列的文件路径和时间戳
    const listResult = await view.rpc.request.shellExec({
      cmd: `find "${projectDir}" -name "*.jsonl" -exec stat -f "%m\t%N" {} \\; 2>/dev/null | sort -rn | head -10`,
    });

    if (!listResult.stdout.trim()) return [];

    const fileEntries = listResult.stdout.trim().split('\n').filter(Boolean).map(line => {
      const tab = line.indexOf('\t');
      return { mtime: parseInt(line.slice(0, tab), 10), path: line.slice(tab + 1) };
    });

    if (fileEntries.length === 0) return [];

    // 第二步：批量读取每个文件头部
    const quotedPaths = fileEntries.map(e => `"${e.path}"`).join(' ');
    const headResult = await view.rpc.request.shellExec({ cmd: `head -20 ${quotedPaths}` });

    // 解析 head 多文件输出（==> filepath <== 分隔）
    const conversations: Conversation[] = [];
    const parts = headResult.stdout.split(/^==> (.+) <==\n?/m);
    // parts: ['', path1, content1, path2, content2, ...]

    for (let i = 1; i < parts.length; i += 2) {
      const filePath = parts[i].trim();
      const content = parts[i + 1] || '';
      const entry = fileEntries.find(e => e.path === filePath);

      const sessionId = filePath.split('/').pop()?.replace('.jsonl', '') || '';
      let title = '';

      for (const line of content.split('\n')) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          if (obj.type !== 'user' || !Array.isArray(obj.message?.content)) continue;
          for (const item of obj.message.content) {
            if (item.type === 'text') {
              const text = (item.text || '')
                .replace(/<ide_opened_file>[\s\S]*?<\/ide_opened_file>\s*/g, '')
                .replace(/<ide_selection>[\s\S]*?<\/ide_selection>\s*/g, '')
                .trim();
              if (text) { title = text; break; }
            }
          }
          if (title) break;
        } catch { continue; }
      }

      conversations.push({
        id: sessionId,
        title: title || '未命名对话',
        updatedAt: entry ? new Date(entry.mtime * 1000).toISOString() : new Date().toISOString(),
        projectPath: workDir,
      });
    }

    return conversations;
  } catch (error) {
    console.error("Failed to load conversation history:", error);
    return [];
  }
}

export async function installPlugin(pluginId: string, workDir?: string): Promise<void> {
  const args = ['install', pluginId];
  await run42plugin(args, workDir);
}

export async function uninstallPlugin(pluginName: string): Promise<void> {
  await run42plugin(['uninstall', pluginName, '-g']);
}

export async function login(): Promise<void> {
  await run42plugin(['auth']);
}

export async function logout(): Promise<void> {
  await run42plugin(['auth', '--logout']);
}

export async function checkPluginAvailability(): Promise<boolean> {
  try {
    await runViaShell(['--version']);
    return true;
  } catch {
    return false;
  }
}
