import { useState, useEffect } from "react";
import { Layout, message, ConfigProvider, theme, Modal, Typography, Button } from "antd";
import { useAuth } from "@/hooks/useAuth";
import { fetchCliVersion, checkCliUpdate, run42plugin, checkPluginAvailability, checkBunAvailability, install42plugin } from "@/lib/42plugin/api";
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
  const [activeView, setActiveView] = useState<'chat' | 'market' | 'settings'>('market');
  const [cliVersion, setCliVersion] = useState<string | null>(null);
  const [cliUpdateInfo, setCliUpdateInfo] = useState<{ latestVersion?: string; releaseDate?: string } | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [hasBun, setHasBun] = useState(false);
  const [installing42plugin, setInstalling42plugin] = useState(false);
  const [installLog, setInstallLog] = useState('');

  useEffect(() => {
    fetchCliVersion().then(v => {
      setCliVersion(v);
      if (v) checkCliUpdate().then(info => {
        if (info.hasUpdate) setCliUpdateInfo({ latestVersion: info.latestVersion, releaseDate: info.releaseDate });
      });
    });
  }, []);

  // 切换到插件市场时检测 42plugin 是否可用
  useEffect(() => {
    if (activeView !== 'market') return;

    const run = () =>
      checkPluginAvailability()
        .then(available => {
          if (!available) {
            return checkBunAvailability().then(bunOk => {
              setHasBun(bunOk);
              setInstallLog('');
              setShowInstallModal(true);
            });
          }
        })
        .catch(() => {
          // RPC 可能未就绪，延迟重试一次
          setTimeout(run, 1500);
        });

    run();
  }, [activeView]);

  const handleInstall42plugin = async () => {
    setInstalling42plugin(true);
    setInstallLog('正在安装 @42ailab/42plugin ...');
    try {
      const { stdout, stderr, code } = await install42plugin();
      const log = (stdout + stderr).trim();
      if (code === 0) {
        setInstallLog(log || '安装成功');
        message.success('42plugin 安装成功');
        setShowInstallModal(false);
      } else {
        setInstallLog(log || '安装失败');
        message.error('安装失败，请手动执行命令');
      }
    } catch (e: any) {
      setInstallLog(e?.message || '安装失败');
      message.error('安装失败，请手动执行命令');
    } finally {
      setInstalling42plugin(false);
    }
  };
  const [workDir, setWorkDir] = useState<string>(() => localStorage.getItem('workDir') || '');
  const [showWorkDirPicker, setShowWorkDirPicker] = useState<boolean>(() => !localStorage.getItem('workDir'));
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {    const saved = localStorage.getItem('theme');
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
          <ChatPage
            workDir={workDir}
            onWorkDirChange={handleWorkDirChange}
          />
        );
      case 'market':
        return <PluginMarketPage workDir={workDir} />;
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
    itemSelectedBg: 'oklch(0.620 0.200 40 / 8%)',
    itemActiveBg: 'oklch(0.620 0.200 40 / 10%)',
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
          colorPrimary: '#ea580c',
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
          colorPrimary: '#ea580c',
          colorBgBase: '#faf5f0',
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
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
        {/* 42plugin 未安装提示弹窗 */}
        <Modal
          open={showInstallModal}
          onCancel={() => setShowInstallModal(false)}
          footer={null}
          width={480}
          centered
          title="需要安装 42plugin"
        >
          {hasBun ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Typography.Text>检测到系统已安装 bun，可以一键安装 42plugin：</Typography.Text>
              <Typography.Text code copyable style={{ fontSize: 13 }}>bun add -g @42ailab/42plugin</Typography.Text>
              {installLog && (
                <pre style={{ background: 'var(--bg-base)', padding: 12, borderRadius: 6, fontSize: 12, maxHeight: 160, overflow: 'auto', margin: 0 }}>{installLog}</pre>
              )}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button onClick={() => setShowInstallModal(false)}>稍后再说</Button>
                <Button type="primary" loading={installing42plugin} onClick={handleInstall42plugin}>一键安装</Button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Typography.Text>未检测到 bun，请先安装 bun，再安装 42plugin：</Typography.Text>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>1. 安装 bun</Typography.Text>
                <Typography.Text code copyable style={{ display: 'block', fontSize: 13, marginTop: 4 }}>curl -fsSL https://bun.sh/install | bash</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>2. 安装 42plugin</Typography.Text>
                <Typography.Text code copyable style={{ display: 'block', fontSize: 13, marginTop: 4 }}>bun add -g @42ailab/42plugin</Typography.Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={() => setShowInstallModal(false)}>知道了</Button>
              </div>
            </div>
          )}
        </Modal>

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
