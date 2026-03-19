import { Plugin, StatusData, AuthStatus, Conversation } from "./types";
import { view } from "../../rpc";

// 注意：PATH 环境变量已在后端 (src/bun/index.ts) 中统一设置
// 这里直接传递命令给后端执行

let _platform: string | null = null;
async function getPlatform(): Promise<string> {
  if (!_platform) _platform = await view.rpc!.request.getPlatform({});
  return _platform;
}

export async function runViaShell(args: string[], workDir?: string, timeout?: number): Promise<{ stdout: string; stderr: string; code: number | null }> {
  const isWin = (await getPlatform()) === "win32";
  let cmd: string;
  if (isWin) {
    const escaped = args.map(a => `"${a.replace(/"/g, '\\"')}"`).join(' ');
    cmd = workDir
      ? `cd /d "${workDir}" && 42plugin ${escaped}`
      : `42plugin ${escaped}`;
  } else {
    const escaped = args.map(a => `'${a.replace(/'/g, "'\\''")}'`).join(' ');
    cmd = workDir
      ? `cd '${workDir.replace(/'/g, "'\\''")}' && 42plugin ${escaped}`
      : `42plugin ${escaped}`;
  }
  return view.rpc!.request.shellExec({ cmd, ...(timeout !== undefined && { timeout }) });
}

export async function run42plugin(args: string[], workDir?: string, timeout?: number): Promise<string> {
  const { stdout, stderr, code } = await runViaShell(args, workDir, timeout);
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

function parsePluginList(output: string, isGlobal: boolean): Plugin[] {
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
      isGlobal,
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
          isGlobal,
        });
      }
    }
    return plugins;
  }
}

export async function fetchProjectPlugins(workDir?: string): Promise<Plugin[]> {
  if (!workDir) return [];
  try {
    const output = await run42plugin(['list', '--json'], workDir);
    return parsePluginList(output, false);
  } catch (error) {
    console.error("Failed to load project plugins:", error);
    return [];
  }
}

export async function fetchGlobalPlugins(): Promise<Plugin[]> {
  try {
    const output = await run42plugin(['list', '--json', '-g']);
    return parsePluginList(output, true);
  } catch (error) {
    console.error("Failed to load global plugins:", error);
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
    const { files } = await view.rpc!.request.getConversationFiles({ projectPath: workDir });
    if (files.length === 0) return [];

    const conversations: Conversation[] = [];

    for (const file of files) {
      const sessionId = file.path.replace(/\\/g, '/').split('/').pop()?.replace('.jsonl', '') || '';
      let title = '';

      for (const line of file.headLines.split('\n')) {
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
        updatedAt: new Date(file.mtime).toISOString(),
        projectPath: workDir,
      });
    }

    return conversations;
  } catch (error) {
    console.error("Failed to load conversation history:", error);
    return [];
  }
}

export async function installPlugin(pluginId: string, workDir?: string, global?: boolean): Promise<void> {
  const args = global ? ['install', '-g', pluginId] : ['install', pluginId];
  await run42plugin(args, workDir);
}

export async function uninstallPlugin(pluginName: string, workDir?: string, global?: boolean): Promise<void> {
  const args = global ? ['uninstall', '-g', pluginName] : ['uninstall', pluginName];
  await run42plugin(args, workDir);
}

export async function login(): Promise<void> {
  await run42plugin(['auth']);
}

export async function logout(): Promise<void> {
  await run42plugin(['auth', '--logout']);
}

export async function checkPluginAvailability(): Promise<boolean> {
  try {
    const { code } = await runViaShell(['--version']);
    return code === 0;
  } catch {
    return false;
  }
}

export async function checkBunAvailability(): Promise<boolean> {
  try {
    const { code } = await view.rpc!.request.shellExec({ cmd: 'bun --version', timeout: 5000 });
    return code === 0;
  } catch {
    return false;
  }
}

export async function install42plugin(): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return view.rpc!.request.shellExec({ cmd: 'bun add -g @42ailab/42plugin', timeout: 120000 });
}

export async function fetchCliVersion(): Promise<string | null> {
  try {
    const { stdout } = await runViaShell(['--version']);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export interface CliUpdateInfo {
  hasUpdate: boolean;
  latestVersion?: string;
  releaseDate?: string;
}

export async function checkCliUpdate(): Promise<CliUpdateInfo> {
  try {
    const { stdout, code } = await runViaShell(['upgrade', '--check']);
    if (code !== 0) return { hasUpdate: false };
    // eslint-disable-next-line no-control-regex
    const clean = stdout.replace(/\x1b\[[0-9;]*m/g, '');
    const latestMatch = clean.match(/最新版本:\s*(\S+)/);
    const dateMatch = clean.match(/发布时间:\s*(\S+)/);
    if (!latestMatch) return { hasUpdate: false };
    return {
      hasUpdate: true,
      latestVersion: latestMatch[1],
      releaseDate: dateMatch?.[1],
    };
  } catch {
    return { hasUpdate: false };
  }
}
