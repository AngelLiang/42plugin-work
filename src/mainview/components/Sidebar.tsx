import React from 'react';
import { Layout, Menu, Divider, Button, Tooltip, Empty, List, Spin, message } from 'antd';
import { MessageOutlined, AppstoreOutlined, SettingOutlined, FolderOutlined } from '@ant-design/icons';
import { useConversations } from '@/hooks/useConversations';
import { view } from '../rpc';

interface SidebarProps {
  activeView: 'chat' | 'market' | 'settings';
  onViewChange: (view: 'chat' | 'market' | 'settings') => void;
  workDir: string;
  onWorkDirChange: (dir: string) => void;
  onSelectConversation: (id: string, projectPath: string) => void;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  workDir,
  onWorkDirChange,
  onSelectConversation,
}) => {
  const { conversations, loading: loadingConversations } = useConversations(workDir);

  const handleSelectDirectory = async () => {
    try {
      const selected = await view.rpc.request.openDirectory({});
      if (selected) {
        onWorkDirChange(selected);
        localStorage.setItem('workDir', selected);
        message.success('工作目录已更新');
      }
    } catch (error) {
      console.error('Failed to select directory:', error);
      message.error('选择目录失败');
    }
  };

  const truncatePath = (path: string, maxLength: number = 20) => {
    if (path.length <= maxLength) return path;
    return '...' + path.slice(-maxLength + 3);
  };

  const menuItems = [
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: '对话',
    },
    {
      key: 'market',
      icon: <AppstoreOutlined />,
      label: '插件市场',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
  ];

  return (
    <Layout.Sider
      width={220}
      theme="dark"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ padding: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Logo / Brand */}
        <div style={{ padding: '8px 4px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: '8px',
            background: 'oklch(0.546 0.245 262.881)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            42
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Work42</span>
        </div>

        <Menu
          mode="vertical"
          selectedKeys={[activeView]}
          onClick={(e) => onViewChange(e.key as 'chat' | 'market' | 'settings')}
          items={menuItems}
          style={{ border: 'none', background: 'transparent' }}
        />

        <Divider style={{ margin: '12px 0', borderColor: 'var(--border-subtle)' }} />

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            工作目录
          </div>
          <Tooltip title={workDir || '未选择'}>
            <Button
              type="text"
              block
              icon={<FolderOutlined />}
              onClick={handleSelectDirectory}
              style={{
                color: workDir ? 'var(--text-secondary)' : 'var(--text-muted)',
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '12px',
                cursor: 'pointer',
                borderRadius: 'var(--radius-md)',
                height: 32,
              }}
            >
              {truncatePath(workDir || '点击选择目录')}
            </Button>
          </Tooltip>
        </div>

        <Divider style={{ margin: '12px 0', borderColor: 'var(--border-subtle)' }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            最近对话
          </div>
          {loadingConversations ? (
            <Spin size="small" style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }} />
          ) : conversations.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>暂无对话记录</span>}
              style={{ marginTop: '16px' }}
            />
          ) : (
            <List
              dataSource={conversations}
              renderItem={(item) => (
                <List.Item
                  className="conversation-item"
                  style={{ padding: 0, border: 'none' }}
                  onClick={() => {
                    onViewChange('chat');
                    onSelectConversation(item.id, item.projectPath);
                  }}
                >
                  <div style={{ width: '100%', padding: '6px 8px' }}>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: '2px',
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {formatRelativeTime(item.updatedAt)}
                    </div>
                  </div>
                </List.Item>
              )}
              style={{ flex: 1, overflow: 'auto' }}
            />
          )}
        </div>
      </div>
    </Layout.Sider>
  );
};
