import { List, Tag, Space, Button, Typography } from 'antd';
import type { Plugin } from '@/lib/42plugin/types';

const { Text } = Typography;

interface InstalledTabProps {
  plugins: Plugin[];
  onUninstall: (pluginId: string) => void;
  onPluginClick?: (plugin: Plugin) => void;
}

export function InstalledTab({ plugins, onUninstall, onPluginClick }: InstalledTabProps) {
  return (
    <List
      dataSource={plugins}
      locale={{ emptyText: '暂无已安装的插件' }}
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
              onClick={(e) => { e.stopPropagation(); onUninstall(plugin.name); }}
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
