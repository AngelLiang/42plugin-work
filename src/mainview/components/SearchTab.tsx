import { useRef, useEffect } from 'react';
import { List, Card, Tag, Space, Button, Badge, Typography, Spin } from 'antd';
import { CheckCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import type { Plugin } from '@/lib/42plugin/types';

const { Paragraph, Text } = Typography;

interface SearchTabProps {
  plugins: Plugin[];
  listedPlugins: Plugin[];
  searchQuery: string;
  isLoggedIn: boolean;
  loadingMore?: boolean;
  hasMoreListed?: boolean;
  onInstall: (pluginId: string) => void;
  onPluginClick: (plugin: Plugin) => void;
  onLoadMore?: () => void;
}

export function SearchTab({ plugins, listedPlugins, searchQuery, isLoggedIn, loadingMore, hasMoreListed, onInstall, onPluginClick, onLoadMore }: SearchTabProps) {
  const isListMode = !searchQuery.trim();
  const displayPlugins = isListMode ? listedPlugins : plugins;
  const sentinelRef = useRef<HTMLDivElement>(null);

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
        grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
        dataSource={displayPlugins}
        locale={{ emptyText: isListMode ? '暂无插件' : '未找到相关插件' }}
      renderItem={(plugin) => (
        <List.Item>
          <Card
            className="plugin-card"
            hoverable
            style={{ borderRadius: 'var(--radius-xl)' }}
            onClick={() => onPluginClick(plugin)}
            actions={[
              plugin.installed ? (
                <Button type="text" icon={<CheckCircleOutlined style={{ color: 'oklch(0.623 0.214 259.815)' }} />} disabled>
                  已安装
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onInstall(plugin.id);
                  }}
                  disabled={!isLoggedIn}
                  style={{
                    cursor: isLoggedIn ? 'pointer' : 'not-allowed',
                    background: 'oklch(0.546 0.245 262.881)',
                    borderColor: 'oklch(0.546 0.245 262.881)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  安装
                </Button>
              ),
            ]}
          >
            <Card.Meta
              title={
                <Space>
                  {plugin.name}
                  {plugin.installed && <Badge status="success" color="oklch(0.623 0.214 259.815)" />}
                </Space>
              }
              description={
                <>
                  <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                    {plugin.description}
                  </Paragraph>
                  <Space size="small">
                    <Tag style={{
                      background: 'oklch(0.546 0.245 262.881 / 15%)',
                      color: 'oklch(0.623 0.214 259.815)',
                      border: '1px solid oklch(0.546 0.245 262.881 / 30%)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 11,
                    }}>v{plugin.version}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      by {plugin.author}
                    </Text>
                  </Space>
                </>
              }
            />
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
