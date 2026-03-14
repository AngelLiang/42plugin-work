import { List, Tag, Space, Button, Typography } from 'antd';
import type { Plugin } from '@/lib/42plugin/types';

const { Text } = Typography;

interface InstalledTabProps {
  plugins: Plugin[];
  onUninstall: (pluginId: string) => void;
}

export function InstalledTab({ plugins, onUninstall }: InstalledTabProps) {
  return (
    <List
      dataSource={plugins}
      locale={{ emptyText: '暂无已安装的插件' }}
      renderItem={(plugin) => (
        <List.Item
          style={{
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 8,
          }}
          actions={[
            <Button
              size="small"
              danger
              onClick={() => onUninstall(plugin.name)}
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
            <Space size={4} style={{ marginTop: 2 }}>
              <Tag style={{
                background: 'oklch(0.546 0.245 262.881 / 15%)',
                color: 'oklch(0.623 0.214 259.815)',
                border: '1px solid oklch(0.546 0.245 262.881 / 30%)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 10,
                margin: 0,
              }}>v{plugin.version}</Tag>
              <Text type="secondary" style={{ fontSize: 11 }}>{plugin.author}</Text>
            </Space>
          </div>
        </List.Item>
      )}
    />
  );
}
