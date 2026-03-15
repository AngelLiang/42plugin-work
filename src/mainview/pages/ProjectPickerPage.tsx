import React, { useState, useEffect } from 'react';
import { Spin, Empty, Button } from 'antd';
import { FolderOpenOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { fetchRecentProjects, RecentProject } from '@/lib/claude/projects';
import { view } from '@/rpc';

interface ProjectPickerPageProps {
  onSelect: (path: string) => void;
}

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

export const ProjectPickerPage: React.FC<ProjectPickerPageProps> = ({ onSelect }) => {
  const [projects, setProjects] = useState<RecentProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentProjects()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  const handleBrowse = async () => {
    const selected = await view.rpc.request.openDirectory({});
    if (selected) onSelect(selected);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 480,
        background: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'oklch(0.546 0.245 262.881)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              42
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Work42</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>选择一个工作目录开始</div>
        </div>

        {/* Project list */}
        <div style={{ padding: '12px 0', minHeight: 120, maxHeight: 360, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <Spin size="small" />
            </div>
          ) : projects.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: 'var(--text-muted)', fontSize: 12 }}>暂无最近项目</span>}
              style={{ padding: '24px 0' }}
            />
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                onClick={() => onSelect(project.path)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 12, padding: '10px 20px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  textAlign: 'left', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <FolderOpenOutlined style={{ fontSize: 16, color: 'oklch(0.623 0.214 259.815)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {project.name}
                  </div>
                  <div style={{
                    fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {project.displayPath}
                  </div>
                </div>
                {project.lastUsed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <ClockCircleOutlined style={{ fontSize: 10, color: 'var(--text-disabled)' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>
                      {formatRelativeTime(project.lastUsed)}
                    </span>
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px 20px', borderTop: '1px solid var(--border-subtle)' }}>
          <Button
            type="dashed"
            block
            icon={<FolderOpenOutlined />}
            onClick={handleBrowse}
            style={{ borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}
          >
            浏览其他目录...
          </Button>
        </div>
      </div>
    </div>
  );
};
