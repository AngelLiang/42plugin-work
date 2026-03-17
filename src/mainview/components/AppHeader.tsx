import { Layout, Space, Button, Tooltip } from 'antd';
import { LoginOutlined, LogoutOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

const { Header } = Layout;
const { Title, Text } = Typography;

interface AppHeaderProps {
  isLoggedIn: boolean;
  username: string;
  handleLogin: () => void;
  handleLogout: () => void;
  title?: string;
  showAuth?: boolean;
  cliVersion?: string | null;
  hasCliUpdate?: boolean;
  cliUpdateInfo?: { latestVersion?: string; releaseDate?: string } | null;
  isUpgrading?: boolean;
  onCliUpdate?: () => void;
}

export function AppHeader({ isLoggedIn, username, handleLogin, handleLogout, title = '插件市场', showAuth = true, cliVersion, hasCliUpdate, cliUpdateInfo, isUpgrading, onCliUpdate }: AppHeaderProps) {
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

      <div style={{ flex: 1 }} />

      {cliVersion && (
        <Tooltip
          title={hasCliUpdate && cliUpdateInfo ? (
            <div>
              <div>最新版本: {cliUpdateInfo.latestVersion}</div>
              {cliUpdateInfo.releaseDate && <div>发布时间: {cliUpdateInfo.releaseDate}</div>}
            </div>
          ) : null}
        >
          <span
            onClick={hasCliUpdate && !isUpgrading ? onCliUpdate : undefined}
            style={{
              fontSize: 12,
              color: hasCliUpdate ? 'var(--color-accent)' : 'var(--text-muted)',
              cursor: hasCliUpdate && !isUpgrading ? 'pointer' : 'default',
              marginRight: showAuth ? 16 : 0,
              opacity: isUpgrading ? 0.6 : 1,
            }}
          >
            42plugin CLI v{cliVersion}{isUpgrading ? ' 升级中...' : hasCliUpdate ? ' ↑' : ''}
          </span>
        </Tooltip>
      )}

      {showAuth && (
        <Space>
          {isLoggedIn ? (
            <>
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
                background: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
                fontSize: 12,
              }}
            >
              登录 42Plugin
            </Button>
          )}
        </Space>
      )}
    </Header>
  );
}
