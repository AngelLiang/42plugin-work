import { Button, Tag, Space, Typography, Divider } from 'antd';
import { CheckCircleOutlined, DownloadOutlined, DeleteOutlined, StarOutlined, LinkOutlined } from '@ant-design/icons';
import type { Plugin } from '@/lib/42plugin/types';

const { Title, Text, Paragraph } = Typography;

interface PluginDetailPageProps {
  plugin: Plugin;
  onInstall: (pluginId: string) => void;
  onInstallGlobal: (pluginId: string) => void;
  onUninstall: (pluginId: string) => void;
  isLoggedIn: boolean;
  actionLoading?: boolean;
}

export function PluginDetailPage({ plugin, onInstall, onInstallGlobal, onUninstall, isLoggedIn, actionLoading }: PluginDetailPageProps) {
  const displayName = plugin.name?.includes('/') ? plugin.name.split('/').pop() : plugin.name;
  const authorName = plugin.fullName ? plugin.fullName.split('/')[0] : plugin.author;

  return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <Space align="center" size={8}>
          <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>{displayName}</Title>
          <Tag style={{
            background: 'var(--color-primary-subtle)',
            color: 'var(--color-accent)',
            border: '1px solid var(--color-primary-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
          }}>
            v{plugin.version}
          </Tag>
          {plugin.installed && <Tag color="success" icon={<CheckCircleOutlined />}>已安装</Tag>}
        </Space>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Space size={4} align="center">
          <Text type="secondary" style={{ fontSize: 13 }}>
            by {authorName}
          </Text>
          {plugin.fullName && (
            <Text type="secondary" style={{ fontSize: 12, opacity: 0.6 }}>· {plugin.fullName}</Text>
          )}
          {/* P3: homepage 外链 */}
          {plugin.homepage && (
            <a href={plugin.homepage} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--color-accent)', marginLeft: 4 }}>
              <LinkOutlined />
            </a>
          )}
        </Space>
      </div>

      <Divider style={{ borderColor: 'var(--border-subtle)', margin: '0 0 20px' }} />

      {(plugin.downloads != null || plugin.stars != null || plugin.score10 != null) && (
        <div style={{ marginBottom: 16 }}>
          <Space size={16}>
            {plugin.downloads != null && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <DownloadOutlined style={{ marginRight: 4 }} />
                {plugin.downloads.toLocaleString()} 下载
              </Text>
            )}
            {plugin.stars != null && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <StarOutlined style={{ marginRight: 4 }} />
                {plugin.stars.toLocaleString()} Stars
              </Text>
            )}
            {plugin.score10 != null && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                评分 {plugin.score10.toFixed(1)} / 10
              </Text>
            )}
          </Space>
        </div>
      )}

      {plugin.tags && plugin.tags.length > 0 && (
        <div style={{ marginBottom: 16 }}>
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

      <div style={{ marginBottom: 20 }}>
        <Paragraph style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 0 }}>
          {plugin.descriptionZh || plugin.description || '暂无描述'}
        </Paragraph>
      </div>

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
            loading={actionLoading}
            onClick={() => onUninstall(plugin.id)}
          >
            卸载
          </Button>
        ) : (
          <>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={actionLoading}
              onClick={() => onInstall(plugin.id)}
              disabled={!isLoggedIn}
              style={{
                background: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
              }}
            >
              安装到项目
            </Button>
            <Button
              icon={<DownloadOutlined />}
              loading={actionLoading}
              onClick={() => onInstallGlobal(plugin.id)}
              disabled={!isLoggedIn}
            >
              安装到全局
            </Button>
          </>
        )}
        {!isLoggedIn && !plugin.installed && (
          <Text type="secondary" style={{ fontSize: 12 }}>请先登录后安装</Text>
        )}
      </Space>
    </div>
  );
}
