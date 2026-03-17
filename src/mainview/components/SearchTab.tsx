import { useRef, useEffect, useState } from 'react';
import { List, Card, Tag, Space, Button, Badge, Typography, Spin } from 'antd';
import { CheckCircleOutlined, DownloadOutlined, StarFilled } from '@ant-design/icons';
import type { Plugin } from '@/lib/42plugin/types';

const { Paragraph, Text } = Typography;

interface SearchTabProps {
  plugins: Plugin[];
  listedPlugins: Plugin[];
  searchQuery: string;
  isLoggedIn: boolean;
  loadingMore?: boolean;
  hasMoreListed?: boolean;
  installingId?: string | null;
  onInstall: (pluginId: string) => void;
  onPluginClick: (plugin: Plugin) => void;
  onLoadMore?: () => void;
}

export function SearchTab({ plugins, listedPlugins, searchQuery, isLoggedIn, loadingMore, hasMoreListed, installingId, onInstall, onPluginClick, onLoadMore }: SearchTabProps) {
  const isListMode = !searchQuery.trim();
  const displayPlugins = isListMode ? listedPlugins : plugins;
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (!isListMode || !onLoadMore) return;

    // 向上找到第一个可滚动父容器
    let scrollEl: HTMLElement | null = sentinelRef.current?.parentElement ?? null;
    while (scrollEl && getComputedStyle(scrollEl).overflowY === 'visible') {
      scrollEl = scrollEl.parentElement;
    }
    if (!scrollEl) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollEl!;
      if (scrollHeight - scrollTop - clientHeight < 100) onLoadMore();
    };

    scrollEl.addEventListener('scroll', handleScroll);
    return () => scrollEl!.removeEventListener('scroll', handleScroll);
  }, [isListMode, onLoadMore]);

  return (
    <>
      {isListMode && listedPlugins.length > 0 && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>插件列表</Text>
      )}
      <List
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
        dataSource={displayPlugins}
        locale={{ emptyText: isListMode ? '暂无插件' : '未找到相关插件' }}
      renderItem={(plugin) => (
        <List.Item>
          <Card
            className="plugin-card"
            hoverable
            style={{ borderRadius: 'var(--radius-xl)' }}
            onClick={() => onPluginClick(plugin)}
            onMouseEnter={() => setHoveredId(plugin.id)}
            onMouseLeave={() => setHoveredId(null)}
            title={
              <Space>
                {plugin.name}
                {plugin.installed && <Badge status="success" color="var(--color-accent)" />}
              </Space>
            }
            extra={
              <div style={{ paddingRight: 4 }}>
                {plugin.installed ? (
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckCircleOutlined style={{ color: 'var(--color-accent)' }} />}
                    disabled
                  >
                    已安装
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size="small"
                    icon={<DownloadOutlined />}
                    loading={installingId === plugin.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onInstall(plugin.id);
                    }}
                    disabled={!isLoggedIn || !!installingId}
                    style={{
                      cursor: isLoggedIn ? 'pointer' : 'not-allowed',
                      background: 'var(--color-primary)',
                      borderColor: 'var(--color-primary)',
                      borderRadius: 'var(--radius-md)',
                      visibility: hoveredId === plugin.id || installingId === plugin.id ? 'visible' : 'hidden',
                    }}
                  >
                    安装
                  </Button>
                )}
              </div>
            }
          >
            <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
              {plugin.description}
            </Paragraph>
            <Space size="small" wrap>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <DownloadOutlined style={{ marginRight: 4 }} />
                {plugin.downloads ?? '-'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <StarFilled style={{ marginRight: 4, color: '#faad14' }} />
                {plugin.score10 ?? '-'}
              </span>
              {plugin.type && (
                <Tag style={{
                  background: 'var(--color-primary-subtle)',
                  color: 'var(--color-accent)',
                  border: '1px solid var(--color-primary-border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 11,
                  margin: 0,
                }}>{plugin.type}</Tag>
              )}
              <Text type="secondary" style={{ fontSize: 12 }}>
                by {plugin.author}
              </Text>
            </Space>
          </Card>
        </List.Item>
      )}
    />
    {isListMode && (
      <div ref={sentinelRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
        {loadingMore && <Spin size="small" />}
        {!hasMoreListed && listedPlugins.length > 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>已加载全部插件</Text>
        )}
      </div>
    )}
    </>
  );
}
