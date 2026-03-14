import { Button, Tag, Space, Typography, Avatar, Divider } from 'antd';
import { CheckCircleOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Plugin } from '@/lib/42plugin/types';

const { Title, Text, Paragraph } = Typography;

interface PluginDetailPageProps {
  plugin: Plugin;
  onInstall: (pluginId: string) => void;
  onUninstall: (pluginId: string) => void;
  isLoggedIn: boolean;
}

export function PluginDetailPage({ plugin, onInstall, onUninstall, isLoggedIn }: PluginDetailPageProps) {
  const avatarLetter = plugin.name.charAt(0).toUpperCase();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <Avatar
          size={56}
          style={{
            background: 'oklch(0.546 0.245 262.881 / 15%)',
            color: 'oklch(0.546 0.245 262.881)',
            fontSize: 24,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {avatarLetter}
        </Avatar>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Space align="center" style={{ marginBottom: 4, flexWrap: 'wrap' }}>
            <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>{plugin.name}</Title>
            <Tag style={{
              background: 'oklch(0.546 0.245 262.881 / 15%)',
              color: 'oklch(0.623 0.214 259.815)',
              border: '1px solid oklch(0.546 0.245 262.881 / 30%)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
            }}>
              v{plugin.version}
            </Tag>
            {plugin.installed && <Tag color="success" icon={<CheckCircleOutlined />}>已安装</Tag>}
          </Space>
          <Text type="secondary" style={{ fontSize: 13 }}>
            by {plugin.fullName ? plugin.fullName.split('/')[0] : plugin.author}
            {plugin.fullName && <span style={{ marginLeft: 8, opacity: 0.6 }}>{plugin.fullName}</span>}
          </Text>
        </div>
      </div>

      <Divider style={{ borderColor: 'var(--border-subtle)', margin: '0 0 20px' }} />

      <div style={{ marginBottom: 20 }}>
        <Text strong style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>描述</Text>
        <Paragraph style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 0 }}>
          {plugin.description || '暂无描述'}
        </Paragraph>
      </div>

      {plugin.tags && plugin.tags.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>标签</Text>
          <Space wrap>
            {plugin.tags.map(tag => (
              <Tag key={tag} style={{
                background: 'var(--bg-hover)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}>{tag}</Tag>
            ))}
          </Space>
        </div>
      )}

      {plugin.installedAt && (
        <div style={{ marginBottom: 20 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            安装于 {new Date(plugin.installedAt).toLocaleDateString('zh-CN')}
          </Text>
        </div>
      )}

      <Space>
        {plugin.installed ? (
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => onUninstall(plugin.id)}
          >
            卸载
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => onInstall(plugin.id)}
            disabled={!isLoggedIn}
            style={{
              background: 'oklch(0.546 0.245 262.881)',
              borderColor: 'oklch(0.546 0.245 262.881)',
            }}
          >
            安装
          </Button>
        )}
        {!isLoggedIn && !plugin.installed && (
          <Text type="secondary" style={{ fontSize: 12 }}>请先登录后安装</Text>
        )}
      </Space>
    </div>
  );
}
