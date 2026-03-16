import { useState, useEffect } from "react";
import { Layout, Alert, message, ConfigProvider, theme, Modal } from "antd";
import { useAuth } from "@/hooks/useAuth";
import { usePlugins } from "@/hooks/usePlugins";
import { fetchCliVersion, checkCliUpdate, run42plugin } from "@/lib/42plugin/api";
import { AppHeader } from "@/components/AppHeader";
import { Sidebar } from "@/components/Sidebar";
import { PluginMarketPage } from "@/pages/PluginMarketPage";
import { AccountPage } from "@/pages/AccountPage";
import { ChatPage } from "@/pages/ChatPage";
import { ProjectPickerPage } from "@/pages/ProjectPickerPage";

const { Content } = Layout;

type ThemeMode = 'light' | 'dark';

function App() {
  const auth = useAuth();
  const plugins = usePlugins();
  const [activeView, setActiveView] = useState<'chat' | 'market' | 'settings'>('market');
  const [cliVersion, setCliVersion] = useState<string | null>(null);
  const [cliUpdateInfo, setCliUpdateInfo] = useState<{ latestVersion?: string; releaseDate?: string } | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    fetchCliVersion().then(v => {
      setCliVersion(v);
      if (v) checkCliUpdate().then(info => {
        if (info.hasUpdate) setCliUpdateInfo({ latestVersion: info.latestVersion, releaseDate: info.releaseDate });
      });
    });
  }, []);
  const [workDir, setWorkDir] = useState<string>(() => localStorage.getItem('workDir') || '');
  const [showWorkDirPicker, setShowWorkDirPicker] = useState<boolean>(() => !localStorage.getItem('workDir'));
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    localStorage.setItem('theme', themeMode);
  }, [themeMode]);

  const handleWorkDirChange = (path: string) => {
    setWorkDir(path);
    localStorage.setItem('workDir', path);
    setShowWorkDirPicker(false);
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const handleLogin = async () => {
    const result = await auth.handleLogin();
    if (result.success) {
      message.success('登录成功');
    } else {
      message.error(result.error || '登录失败');
    }
  };

  const handleLogout = async () => {
    const result = await auth.handleLogout();
    if (result.success) {
      message.success('已退出登录');
    } else {
      message.error(result.error || '退出失败');
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'chat':
        return (
          <>
            {!plugins.pluginAvailable && (
              <Alert
                message="42plugin 未安装"
                description="请先安装 42plugin: bun install -g @42ailab/42plugin"
                type="warning"
                showIcon
                closable
                style={{ marginBottom: 24 }}
              />
            )}
            <ChatPage
              workDir={workDir}
              onWorkDirChange={handleWorkDirChange}
            />
          </>
        );
      case 'market':
        return (
          <>
            {!plugins.pluginAvailable && (
              <Alert
                message="42plugin 未安装"
                description="请先安装 42plugin: bun install -g @42ailab/42plugin"
                type="warning"
                showIcon
                closable
                style={{ marginBottom: 24 }}
              />
            )}
            <PluginMarketPage workDir={workDir} />
          </>
        );
      case 'settings':
        return <AccountPage themeMode={themeMode} onThemeChange={handleThemeChange} />;
      default:
        return null;
    }
  };

  const viewTitles: Record<string, string> = {
    chat: '对话',
    market: '插件市场',
    settings: '设置',
  };

  const menuComponentToken = {
    itemColor: 'var(--text-secondary)',
    itemHoverColor: 'var(--text-primary)',
    itemSelectedColor: 'var(--text-primary)',
    itemBg: 'transparent',
    itemHoverBg: 'var(--bg-hover)',
    itemSelectedBg: 'oklch(0.546 0.245 262.881 / 8%)',
    itemActiveBg: 'oklch(0.546 0.245 262.881 / 10%)',
    subMenuItemBg: 'transparent',
  };

  const inputComponentToken = {
    activeBorderColor: 'var(--border-default)',
    hoverBorderColor: 'var(--border-default)',
    activeShadow: 'none',
  };

  const antdToken = themeMode === 'dark'
    ? {
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#7c3aed',
          colorBgBase: '#1a1614',
          colorBgContainer: '#242020',
          colorBgElevated: '#2a2626',
          colorBorder: 'rgba(255,255,255,0.12)',
          colorBorderSecondary: 'rgba(255,255,255,0.08)',
          fontFamily: "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          borderRadius: 8,
          borderRadiusLG: 12,
        },
        components: { Menu: menuComponentToken, Input: inputComponentToken },
      }
    : {
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#7c3aed',
          colorBgBase: '#ffffff',
          colorBgContainer: '#f5f5f4',
          colorBgElevated: '#efefed',
          colorBorder: 'rgba(0,0,0,0.12)',
          colorBorderSecondary: 'rgba(0,0,0,0.08)',
          fontFamily: "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          borderRadius: 8,
          borderRadiusLG: 12,
        },
        components: { Menu: menuComponentToken, Input: inputComponentToken },
      };

  return (
    <ConfigProvider theme={antdToken}>
      <ConfigProvider theme={{ token: { colorIcon: 'var(--text-muted)', colorIconHover: 'var(--text-primary)' } }}>
        <Modal
          open={showWorkDirPicker}
          onCancel={() => setShowWorkDirPicker(false)}
          footer={null}
          width={520}
          styles={{ body: { padding: 0 } }}
          centered
          closable={!!workDir}
          keyboard={!!workDir}
        >
        <ProjectPickerPage
          inline
          onSelect={(path) => {
            handleWorkDirChange(path);
            message.success('工作目录已设置');
          }}
        />
        </Modal>
      </ConfigProvider>
      <Layout style={{ minHeight: "100vh", background: 'var(--bg-base)' }}>
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          workDir={workDir}
          onWorkDirChange={handleWorkDirChange}
        />

        <Layout style={{ marginLeft: 64, background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', height: '100vh' }}>
          {activeView === 'market' && (
            <AppHeader
              isLoggedIn={auth.isLoggedIn}
              username={auth.username}
              handleLogin={handleLogin}
              handleLogout={handleLogout}
              title={viewTitles[activeView]}
              showAuth={true}
              cliVersion={cliVersion}
              hasCliUpdate={!!cliUpdateInfo}
              cliUpdateInfo={cliUpdateInfo}
              isUpgrading={isUpgrading}
              onCliUpdate={() => {
                setIsUpgrading(true);
                run42plugin(['upgrade', '-y'], undefined, 300000)
                  .then(() => fetchCliVersion())
                  .then(v => { setCliVersion(v); setCliUpdateInfo(null); })
                  .catch(() => message.error('升级失败，请稍后重试'))
                  .finally(() => setIsUpgrading(false));
              }}
            />
          )}

          <Content style={{ padding: "24px", flex: 1, minHeight: 0, overflow: 'auto' }}>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

export default App;
