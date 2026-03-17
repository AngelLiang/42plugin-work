import { useState } from 'react';
import { Card, Space, Typography, Switch, Select, Divider, Descriptions } from 'antd';
import { BulbOutlined, TranslationOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

type ThemeMode = 'light' | 'dark';
type LanguageType = 'zh-CN' | 'en-US';

interface AccountPageProps {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}

export function AccountPage({ themeMode, onThemeChange }: AccountPageProps) {
  const [language, setLanguage] = useState<LanguageType>('zh-CN');

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: '24px', color: 'var(--text-primary)', fontWeight: 600 }}>设置</Title>

      {/* 主题设置 */}
      <Card
        title={
          <Space>
            <BulbOutlined style={{ color: 'var(--color-accent)' }} />
            <span>外观</span>
          </Space>
        }
        style={{ marginBottom: '16px', borderRadius: 'var(--radius-xl)', borderColor: 'var(--border-default)' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text strong style={{ color: 'var(--text-primary)' }}>深色模式</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                当前：{themeMode === 'dark' ? '深色主题' : '浅色主题'}
              </Text>
            </div>
            <Switch
              checked={themeMode === 'dark'}
              onChange={(checked) => onThemeChange(checked ? 'dark' : 'light')}
              checkedChildren="深色"
              unCheckedChildren="浅色"
            />
          </div>
        </Space>
      </Card>

      {/* 语言设置 */}
      <Card
        title={
          <Space>
            <TranslationOutlined style={{ color: 'var(--color-accent)' }} />
            <span>语言</span>
          </Space>
        }
        style={{ marginBottom: '16px', borderRadius: 'var(--radius-xl)', borderColor: 'var(--border-default)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong style={{ color: 'var(--text-primary)' }}>界面语言</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              选择应用显示语言
            </Text>
          </div>
          <Select
            value={language}
            onChange={setLanguage}
            style={{ width: 120 }}
          >
            <Option value="zh-CN">简体中文</Option>
            <Option value="en-US">English</Option>
          </Select>
        </div>
      </Card>

      {/* 关于 */}
      <Card
        title={
          <Space>
            <InfoCircleOutlined style={{ color: 'var(--color-accent)' }} />
            <span>关于</span>
          </Space>
        }
        style={{ borderRadius: 'var(--radius-xl)', borderColor: 'var(--border-default)' }}
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="应用名称">42plugin work</Descriptions.Item>
          <Descriptions.Item label="版本">0.1.0</Descriptions.Item>
          <Descriptions.Item label="构建时间">Development</Descriptions.Item>
        </Descriptions>
        <Divider style={{ margin: '16px 0', borderColor: 'var(--border-subtle)' }} />
        <Text type="secondary" style={{ fontSize: '12px' }}>
        42plugin work是一个基于 Electrobun 和 React 构建的桌面应用，用于管理42plugin命令行工具。
          <br />
          插件市场登录功能请前往「插件市场」页面。
        </Text>
      </Card>
    </div>
  );
}

