import { List, Tag, Button, Typography, Divider } from 'antd';
import type { Plugin } from '@/lib/42plugin/types';

const { Text } = Typography;

interface InstalledTabProps {
  projectPlugins: Plugin[];
  globalPlugins: Plugin[];
  workDir?: string;
  uninstallingId?: string | null;
  onUninstall: (pluginId: string, isGlobal: boolean) => void;
  onPluginClick?: (plugin: Plugin) => void;
}

function PluginList({ plugins, uninstallingId, onUninstall, onPluginClick }: {
  plugins: Plugin[];
  uninstallingId?: string | null;
  onUninstall: (pluginId: string, isGlobal: boolean) => void;
  onPluginClick?: (plugin: Plugin) => void;
}) {
  return (
    <List
      dataSource={plugins}
      locale={{ emptyText: '暂无插件' }}
      renderItem={(plugin) => (
        <List.Item
          onClick={() => onPluginClick?.(plugin)}
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 8,
            cursor: onPluginClick ? 'pointer' : 'default',
          }}
          actions={[
            <Button
              size="small"
              danger
              loading={uninstallingId === plugin.name}
              disabled={!!uninstallingId}
              onClick={(e) => { e.stopPropagation(); onUninstall(plugin.name, !!plugin.isGlobal); }}
              style={{ borderRadius: 'var(--radius-sm)', fontSize: 11 }}
            >
              卸载
            </Button>,
          ]}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text strong style={{ fontSize: 13, display: 'block', color: 'var(--text-primary)' }} ellipsis>
              {plugin.name}
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, minWidth: 0 }}>
              <Tag style={{
                background: 'oklch(0.546 0.245 262.881 / 15%)',
                color: 'oklch(0.623 0.214 259.815)',
                border: '1px solid oklch(0.546 0.245 262.881 / 30%)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 10,
                margin: 0,
                flexShrink: 0,
              }}>v{plugin.version}</Tag>
              <Text type="secondary" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {plugin.author}
              </Text>
            </div>
          </div>
        </List.Item>
      )}
    />
  );
}

function SectionTitle({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</Text>
      {count > 0 && (
        <span style={{
          fontSize: 10,
          background: 'oklch(0.546 0.245 262.881 / 20%)',
          color: 'oklch(0.623 0.214 259.815)',
          padding: '1px 6px',
          borderRadius: 'var(--radius-2xl)',
          fontWeight: 500,
        }}>{count}</span>
      )}
    </div>
  );
}

export function InstalledTab({ projectPlugins, globalPlugins, workDir, uninstallingId, onUninstall, onPluginClick }: InstalledTabProps) {
  return (
    <div>
      <SectionTitle label="项目插件" count={projectPlugins.length} />
      {!workDir ? (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>未选择项目</Text>
      ) : projectPlugins.length === 0 ? (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>暂无项目插件</Text>
      ) : (
        <PluginList plugins={projectPlugins} uninstallingId={uninstallingId} onUninstall={onUninstall} onPluginClick={onPluginClick} />
      )}

      <Divider style={{ margin: '12px 0', borderColor: 'var(--border-subtle)' }} />

      <SectionTitle label="全局插件" count={globalPlugins.length} />
      <PluginList plugins={globalPlugins} uninstallingId={uninstallingId} onUninstall={onUninstall} onPluginClick={onPluginClick} />
    </div>
  );
}
