import React, { useState } from 'react';
import { Layout, Menu, Divider, Button, Tooltip, message, Modal } from 'antd';
import { MessageOutlined, AppstoreOutlined, SettingOutlined, FolderOutlined } from '@ant-design/icons';
import { ProjectPickerPage } from '@/pages/ProjectPickerPage';

interface SidebarProps {
  activeView: 'chat' | 'market' | 'settings';
  onViewChange: (view: 'chat' | 'market' | 'settings') => void;
  workDir: string;
  onWorkDirChange: (dir: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  workDir,
  onWorkDirChange,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleSelectDirectory = () => {
    setShowPicker(true);
  };

const menuItems = [
    { key: 'chat', icon: <MessageOutlined style={{ fontSize: 18 }} />, label: '会话' },
    { key: 'market', icon: <AppstoreOutlined style={{ fontSize: 18 }} />, label: '插件市场' },
    { key: 'settings', icon: <SettingOutlined style={{ fontSize: 18 }} />, label: '设置' },
  ];

  return (
    <Layout.Sider
      width={64}
      theme="dark"
      style={{
        overflow: 'visible',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      <div style={{ padding: '12px 0', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Logo */}
        <div style={{
          width: 32, height: 32, borderRadius: '9px',
          background: 'oklch(0.546 0.245 262.881)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700, color: '#fff',
          marginBottom: 16,
        }}>
          42
        </div>

        <Menu
          mode="vertical"
          selectedKeys={[activeView]}
          onClick={(e) => onViewChange(e.key as 'chat' | 'market' | 'settings')}
          items={menuItems.map(item => ({
            key: item.key,
            icon: (
              <Tooltip title={item.label} placement="right">
                {item.icon}
              </Tooltip>
            ),
          }))}
          style={{ border: 'none', background: 'transparent', width: '100%' }}
        />

        <div style={{ flex: 1 }} />

        <Divider style={{ margin: '8px 0', borderColor: 'var(--border-subtle)', width: '80%', minWidth: 'unset' }} />

        <Tooltip title={workDir || '选择工作目录'} placement="right">
          <Button
            type="text"
            icon={<FolderOutlined style={{ fontSize: 18 }} />}
            onClick={handleSelectDirectory}
            style={{
              color: workDir ? 'var(--text-secondary)' : 'var(--text-muted)',
              width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 'var(--radius-md)',
            }}
          />
        </Tooltip>
      </div>

      <Modal
        open={showPicker}
        onCancel={() => setShowPicker(false)}
        footer={null}
        width={520}
        styles={{ body: { padding: 0 } }}
        centered
      >
        <ProjectPickerPage
          inline
          onSelect={(path) => {
            onWorkDirChange(path);
            localStorage.setItem('workDir', path);
            setShowPicker(false);
            message.success('工作目录已更新');
          }}
        />
      </Modal>
    </Layout.Sider>
  );
};
