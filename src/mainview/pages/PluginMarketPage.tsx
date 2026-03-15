import { useState } from 'react';
import { Input, Row, Col, Typography, Divider, message, Drawer, Modal } from 'antd';
import { usePlugins } from '@/hooks/usePlugins';
import { useAuth } from '@/hooks/useAuth';
import { SearchTab } from '@/components/SearchTab';
import { InstalledTab } from '@/components/InstalledTab';
import { PluginDetailPage } from '@/pages/PluginDetailPage';
import type { Plugin } from '@/lib/42plugin/types';

const { Search } = Input;
const { Title } = Typography;

const TYPE_OPTIONS = [
  { label: '全部', value: '' },
  { label: 'Skill', value: 'skill' },
  { label: 'Command', value: 'command' },
  { label: 'Hook', value: 'hook' },
  { label: 'Agent', value: 'agent' },
];

const SORT_OPTIONS = [
  { label: '活水指数', value: '' },
  { label: '最近更新', value: 'updated' },
  { label: '下载量', value: 'downloads' },
];

function FilterBar({ label, options, value, onChange }: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      {options.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              fontSize: 12,
              padding: '2px 10px',
              borderRadius: 'var(--radius-full)',
              border: active ? '1px solid var(--color-primary-border)' : '1px solid transparent',
              background: active ? 'var(--color-primary-subtle)' : 'transparent',
              color: active ? 'var(--color-accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: active ? 500 : 400,
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function PluginMarketPage({ workDir }: { workDir?: string }) {
  const auth = useAuth();
  const plugins = usePlugins(workDir);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  const handleTypeChange = (type: string) => {
    plugins.handleFilter(type || undefined, plugins.filterSort);
  };

  const handleSortChange = (sort: string) => {
    plugins.handleFilter(plugins.filterType, sort || undefined);
  };

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
    const result = await plugins.handleInstall(pluginId, workDir);
    if (result.success) {
      message.success('安装成功');
    } else {
      message.error(result.error || '安装失败');
    }
  };

  const handleUninstall = (pluginId: string, isGlobal: boolean) => {
    Modal.confirm({
      title: '确认卸载',
      content: '确定要卸载该插件吗？',
      okText: '卸载',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const result = await plugins.handleUninstall(pluginId, isGlobal ? undefined : workDir);
        if (result.success) {
          message.success('卸载成功');
        } else {
          message.error(result.error || '卸载失败');
        }
      },
    });
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
            style={{ marginBottom: '12px' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            <FilterBar label="类型" options={TYPE_OPTIONS} value={plugins.filterType ?? ''} onChange={handleTypeChange} />
            <FilterBar label="排序" options={SORT_OPTIONS} value={plugins.filterSort ?? ''} onChange={handleSortChange} />
          </div>
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
          <Title level={5} style={{ marginTop: 0, marginBottom: 12, color: 'var(--text-primary)', fontWeight: 600 }}>已安装</Title>
          <Divider style={{ marginTop: 0, marginBottom: 12, borderColor: 'var(--border-subtle)' }} />
          <InstalledTab
            projectPlugins={plugins.projectPlugins}
            globalPlugins={plugins.globalPlugins}
            workDir={workDir}
            onUninstall={handleUninstall}
            onPluginClick={setSelectedPlugin}
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
              const result = await plugins.handleInstall(pluginId, workDir);
              if (result.success) {
                message.success('安装成功');
                setSelectedPlugin(p => p ? { ...p, installed: true } : p);
              } else {
                message.error(result.error || '安装失败');
              }
            }}
            onUninstall={(pluginId) => {
              Modal.confirm({
                title: '确认卸载',
                content: '确定要卸载该插件吗？',
                okText: '卸载',
                okType: 'danger',
                cancelText: '取消',
                onOk: async () => {
                  const result = await plugins.handleUninstall(pluginId, selectedPlugin?.isGlobal ? undefined : workDir);
                  if (result.success) {
                    message.success('卸载成功');
                    setSelectedPlugin(p => p ? { ...p, installed: false } : p);
                  } else {
                    message.error(result.error || '卸载失败');
                  }
                },
              });
            }}
            isLoggedIn={auth.isLoggedIn}
          />
        )}
      </Drawer>
    </div>
  );
}
