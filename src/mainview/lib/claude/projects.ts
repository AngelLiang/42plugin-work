import { view } from "../../rpc";

export interface RecentProject {
  id: string;
  path: string;
  name: string;
  displayPath: string;
  lastUsed?: number;
}

export function decodeProjectPath(dirName: string): string {
  return dirName.replace(/-/g, '/');
}

export function formatDisplayPath(fullPath: string): string {
  const home = fullPath.match(/^\/Users\/[^/]+/)?.[0] || '';
  let display = home ? fullPath.replace(home, '~') : fullPath;
  if (display.length > 45) {
    display = '...' + display.slice(-42);
  }
  return display;
}

export async function fetchRecentProjects(): Promise<RecentProject[]> {
  const cmd = `
    for d in "$HOME/.claude/projects/"/*/; do
      [ -d "$d" ] || continue;
      latest=$(ls -t "$d"*.jsonl 2>/dev/null | head -1);
      if [ -n "$latest" ]; then
        mtime=$(stat -f "%m" "$latest" 2>/dev/null);
        dirname=$(basename "$d");
        echo "$mtime $dirname";
      fi;
    done | sort -rn | head -20
  `;

  const result = await view.rpc.request.shellExec({ cmd });
  if (!result.stdout.trim()) return [];

  const projects: RecentProject[] = [];

  for (const line of result.stdout.trim().split('\n')) {
    const spaceIdx = line.indexOf(' ');
    if (spaceIdx === -1) continue;
    const mtime = parseInt(line.slice(0, spaceIdx), 10);
    const dirName = line.slice(spaceIdx + 1).trim();
    if (!dirName) continue;

    const projectPath = decodeProjectPath(dirName);
    // 过滤掉不存在的目录
    const checkResult = await view.rpc.request.shellExec({ cmd: `test -d "${projectPath}" && echo "ok"` });
    if (!checkResult.stdout.trim()) continue;

    const name = projectPath.split('/').filter(Boolean).pop() || projectPath;

    projects.push({
      id: dirName,
      path: projectPath,
      name,
      displayPath: formatDisplayPath(projectPath),
      lastUsed: mtime * 1000,
    });
  }

  return projects;
}
