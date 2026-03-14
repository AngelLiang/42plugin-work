import { useState } from 'react';
import { Input, Row, Col, Typography, Divider, message, Drawer } from 'antd';
import { usePlugins } from '@/hooks/usePlugins';
import { useAuth } from '@/hooks/useAuth';
import { SearchTab } from '@/components/SearchTab';
import { InstalledTab } from '@/components/InstalledTab';
import { PluginDetailPage } from '@/pages/PluginDetailPage';
import type { Plugin } from '@/lib/42plugin/types';

const { Search } = Input;
const { Title } = Typography;

export function PluginMarketPage() {
  const auth = useAuth();
  const plugins = usePlugins();
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  const handleSearch = async (value: string) => {
    const result = await plugins.handleSearch(value);
    if (!result.success && value.trim()) {
      message.error(result.error || '搜索失败');
    }
  };

  const handleInstall = async (pluginId: string) => {
    if (!auth.isLoggedIn) {
      message.warning('请先登录');
      return;
    }
    const result = await plugins.handleInstall(pluginId);
    if (result.success) {
      message.success('安装成功');
    } else {
      message.error(result.error || '安装失败');
    }
  };

  const handleUninstall = async (pluginId: string) => {
    const result = await plugins.handleUninstall(pluginId);
    if (result.success) {
      message.success('卸载成功');
    } else {
      message.error(result.error || '卸载失败');
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Row style={{ flex: 1, minHeight: 0 }} wrap={false}>
        {/* 左栏：搜索 */}
        <Col flex="1" style={{ padding: '0 16px 16px', overflow: 'auto', minHeight: 0, borderRight: '1px solid var(--border-subtle)' }}>
          <Title level={5} style={{ marginTop: 0, marginBottom: 12, color: 'var(--text-primary)', fontWeight: 600 }}>搜索插件</Title>
          <Search
            placeholder="输入关键词搜索插件"
            allowClear
            enterButton={false}
            size="middle"
            onSearch={handleSearch}
            loading={plugins.loading}
            style={{ marginBottom: '16px' }}
          />
          <SearchTab
            plugins={plugins.plugins}
            listedPlugins={plugins.listedPlugins}
            searchQuery={plugins.searchQuery}
            isLoggedIn={auth.isLoggedIn}
            loadingMore={plugins.loadingMore}
            hasMoreListed={plugins.hasMoreListed}
            onInstall={handleInstall}
            onPluginClick={setSelectedPlugin}
            onLoadMore={plugins.loadMorePlugins}
          />
        </Col>

        {/* 右栏：已安装 */}
        <Col style={{ width: 280, padding: '0 16px 16px', overflow: 'auto', minHeight: 0, flexShrink: 0 }}>
          <Title level={5} style={{ marginTop: 0, marginBottom: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
            已安装 {plugins.installedPlugins.length > 0 && (
              <span style={{
                marginLeft: 6,
                fontSize: 11,
                background: 'oklch(0.546 0.245 262.881 / 20%)',
                color: 'oklch(0.623 0.214 259.815)',
                padding: '1px 7px',
                borderRadius: 'var(--radius-2xl)',
                fontWeight: 500,
              }}>
                {plugins.installedPlugins.length}
              </span>
            )}
          </Title>
          <Divider style={{ marginTop: 0, marginBottom: 12, borderColor: 'var(--border-subtle)' }} />
          <InstalledTab
            plugins={plugins.installedPlugins}
            onUninstall={handleUninstall}
          />
        </Col>
      </Row>

      {/* 插件详情抽屉 */}
      <Drawer
        title="插件详情"
        placement="right"
        onClose={() => setSelectedPlugin(null)}
        open={!!selectedPlugin}
        styles={{
          header: {
            borderBottom: '1px solid var(--border-subtle)',
          },
          body: {
            padding: '24px',
          },
          wrapper: {
            width: 520,
          },
        }}
      >
        {selectedPlugin && (
          <PluginDetailPage
            plugin={selectedPlugin}
            onInstall={async (pluginId) => {
              if (!auth.isLoggedIn) { message.warning('请先登录'); return; }
              const result = await plugins.handleInstall(pluginId);
              if (result.success) {
                message.success('安装成功');
                setSelectedPlugin(p => p ? { ...p, installed: true } : p);
              } else {
                message.error(result.error || '安装失败');
              }
            }}
            onUninstall={async (pluginId) => {
              const result = await plugins.handleUninstall(pluginId);
              if (result.success) {
                message.success('卸载成功');
                setSelectedPlugin(p => p ? { ...p, installed: false } : p);
              } else {
                message.error(result.error || '卸载失败');
              }
            }}
            isLoggedIn={auth.isLoggedIn}
          />
        )}
      </Drawer>
    </div>
  );
}
