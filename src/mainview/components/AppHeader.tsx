import { Layout, Space, Button, Avatar } from 'antd';
import { UserOutlined, LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const { Header } = Layout;
const { Title, Text } = Typography;

interface AppHeaderProps {
  isLoggedIn: boolean;
  username: string;
  handleLogin: () => void;
  handleLogout: () => void;
  title?: string;
}

export function AppHeader({ isLoggedIn, username, handleLogin, handleLogout, title = '插件市场' }: AppHeaderProps) {
  return (
    <Header
      style={{
        background: 'var(--bg-surface)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-subtle)',
        height: 56,
        lineHeight: '56px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Title level={4} style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600, fontSize: 15 }}>
        {title}
      </Title>

      <Space>
        {isLoggedIn ? (
          <>
            <Avatar
              icon={<UserOutlined />}
              size={28}
              style={{ background: 'oklch(0.546 0.245 262.881)', cursor: 'default' }}
            />
            <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{username}</Text>
            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              size="small"
              style={{
                cursor: 'pointer',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
              }}
            >
              退出
            </Button>
          </>
        ) : (
          <Button
            type="primary"
            icon={<LoginOutlined />}
            onClick={handleLogin}
            size="small"
            style={{
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
              background: 'oklch(0.546 0.245 262.881)',
              borderColor: 'oklch(0.546 0.245 262.881)',
              fontSize: 12,
            }}
          >
            登录 42Plugin
          </Button>
        )}
      </Space>
    </Header>
  );
}
