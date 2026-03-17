import { useState, useEffect, useRef } from 'react';
import { Empty, Skeleton, Collapse, message, Avatar, List, Spin } from 'antd';
import { UserOutlined, RobotOutlined, PlusOutlined } from '@ant-design/icons';
import { fetchConversationDetail } from '@/lib/claude/reader';
import { appendMessageToJsonl, createUserMessage, createAssistantMessage } from '@/lib/claude/writer';
import { ChatInput } from '@/components/ChatInput';
import { useChatContinuation } from '@/hooks/useChatContinuation';
import { useConversations } from '@/hooks/useConversations';
import { ProjectPickerPage } from '@/pages/ProjectPickerPage';
import type { ConversationDetail } from '@/lib/claude/types';

interface ChatPageProps {
  workDir: string;
  onWorkDirChange: (path: string) => void;
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

function renderContent(content: string, role: string) {
  if (role !== 'assistant') {
    return <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>;
  }

  const parts: Array<{ type: 'text' | 'thinking'; text: string }> = [];
  const regex = /<thinking>([\s\S]*?)<\/thinking>/g;
  let last = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > last) {
      parts.push({ type: 'text', text: content.slice(last, match.index) });
    }
    parts.push({ type: 'thinking', text: match[1] });
    last = regex.lastIndex;
  }

  if (last < content.length) {
    parts.push({ type: 'text', text: content.slice(last) });
  }

  if (parts.length === 0) {
    return <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>;
  }

  return (
    <div>
      {parts.map((part, i) =>
        part.type === 'thinking' ? (
          <Collapse
            key={i}
            size="small"
            items={[
              {
                key: '1',
                label: '💭 思考过程',
                children: (
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0, wordBreak: 'break-word' }}>
                    {part.text}
                  </pre>
                ),
              },
            ]}
            style={{ marginTop: '8px', marginBottom: '8px' }}
          />
        ) : (
          <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part.text}</span>
        )
      )}
    </div>
  );
}

export function ChatPage({ workDir, onWorkDirChange }: ChatPageProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedProjectPath, setSelectedProjectPath] = useState<string>('');
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isStreaming, currentMessage, continueConversation } = useChatContinuation();
  const { conversations, loading: loadingConversations } = useConversations(workDir);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail?.messages, currentMessage]);

  useEffect(() => {
    if (!selectedConversationId || !selectedProjectPath) {
      setDetail(null);
      return;
    }
    const loadDetail = async () => {
      setLoading(true);
      try {
        const data = await fetchConversationDetail(selectedConversationId, selectedProjectPath);
        setDetail(data);
      } catch (error) {
        console.error('Failed to load conversation:', error);
        message.error('加载对话失败');
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [selectedConversationId, selectedProjectPath]);

  const handleSendMessage = async (input: string) => {
    if (!selectedConversationId || !selectedProjectPath) return;

    const lastUuid = (detail && detail.messages.length > 0)
      ? detail.messages[detail.messages.length - 1].timestamp
      : null;

    const userMsg = createUserMessage(input, lastUuid);
    try {
      await appendMessageToJsonl(selectedConversationId, selectedProjectPath, userMsg);
    } catch {
      message.error('保存消息失败');
      return;
    }

    let fullResponse = '';
    try {
      await continueConversation(
        { sessionId: selectedConversationId, projectPath: selectedProjectPath, message: input },
        (chunk) => { fullResponse += chunk; }
      );
      const assistantMsg = createAssistantMessage(fullResponse, userMsg.uuid);
      await appendMessageToJsonl(selectedConversationId, selectedProjectPath, assistantMsg);
      const updated = await fetchConversationDetail(selectedConversationId, selectedProjectPath);
      setDetail(updated);
    } catch (err) {
      message.error(`发送消息失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // 无工作目录：显示内嵌项目选择器
  if (!workDir) {
    return (
      <ProjectPickerPage
        inline
        onSelect={(path) => {
          onWorkDirChange(path);
          localStorage.setItem('workDir', path);
        }}
      />
    );
  }

  // 两栏布局
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* 左栏：会话列表 */}
      <div style={{
        width: 240, flexShrink: 0,
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--bg-surface)',
      }}>
        <div style={{
          padding: '16px 12px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>会话</span>
          <button
            onClick={() => message.info('新建会话功能即将上线')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: 'var(--text-secondary)',
              background: 'transparent', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)', padding: '3px 8px', cursor: 'pointer',
            }}
          >
            <PlusOutlined style={{ fontSize: 11 }} /> 新建
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
          {loadingConversations ? (
            <Spin size="small" style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }} />
          ) : conversations.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: 'var(--text-muted)', fontSize: 12 }}>暂无会话记录</span>}
              style={{ marginTop: 40 }}
            />
          ) : (
            <List
              dataSource={conversations}
              renderItem={(item) => {
                const isSelected = item.id === selectedConversationId;
                return (
                  <List.Item
                    style={{ padding: 0, border: 'none', cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedConversationId(item.id);
                      setSelectedProjectPath(item.projectPath);
                    }}
                  >
                    <div
                      style={{
                        width: '100%', padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        transition: 'background var(--transition-base)',
                        background: isSelected ? 'var(--bg-active)' : 'transparent',
                        borderLeft: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
                      }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'var(--bg-active)' : 'transparent'; }}
                    >
                      <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatRelativeTime(item.updatedAt)}
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
        </div>
      </div>

      {/* 右栏：会话详情 */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {!selectedConversationId ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: 'var(--text-muted)', fontSize: 13 }}>选择一个会话开始对话</span>}
            />
          </div>
        ) : loading ? (
          <div style={{ padding: '24px' }}>
            <Skeleton active paragraph={{ rows: 4 }} />
            <Skeleton active paragraph={{ rows: 3 }} style={{ marginTop: 24 }} />
          </div>
        ) : !detail || detail.messages.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Empty description="暂无消息" />
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto', maxWidth: '860px', margin: '0 auto', padding: '24px 20px', width: '100%' }}>
              {detail?.messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-start',
                    gap: '10px',
                    marginBottom: '20px',
                  }}
                >
                  {msg.role === 'assistant' && (
                    <Avatar size={30} icon={<RobotOutlined />} style={{ background: 'var(--color-primary)', flexShrink: 0, marginTop: 2, boxShadow: '0 0 0 2px var(--color-primary-subtle)' }} />
                  )}
                  <div style={{
                    maxWidth: '75%', padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? 'var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl)' : 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
                    background: msg.role === 'user' ? 'var(--bubble-user-bg)' : 'var(--bubble-assistant-bg)',
                    color: msg.role === 'user' ? 'var(--bubble-user-text)' : 'var(--bubble-assistant-text)',
                    border: msg.role === 'assistant' ? '1px solid var(--bubble-assistant-border)' : 'none',
                    boxShadow: msg.role === 'user' ? 'var(--shadow-primary)' : '0 1px 4px oklch(0 0 0 / 20%)',
                    wordBreak: 'break-word', fontSize: '14px', lineHeight: '1.65',
                  }}>
                    <div style={{ fontSize: '10px', opacity: 0.45, marginBottom: '5px', letterSpacing: '0.02em' }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                    {renderContent(msg.content, msg.role)}
                  </div>
                  {msg.role === 'user' && (
                    <Avatar size={30} icon={<UserOutlined />} style={{ background: 'var(--color-primary)', flexShrink: 0, marginTop: 2, boxShadow: '0 0 0 2px var(--color-primary-subtle)' }} />
                  )}
                </div>
              ))}
              {isStreaming && currentMessage && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '10px', marginBottom: '20px' }}>
                  <Avatar size={30} icon={<RobotOutlined />} style={{ background: 'var(--color-primary)', flexShrink: 0, marginTop: 2, boxShadow: '0 0 0 2px var(--color-primary-subtle)' }} />
                  <div style={{
                    maxWidth: '75%', padding: '10px 14px',
                    borderRadius: 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
                    background: 'var(--bubble-assistant-bg)', border: '1px solid var(--bubble-assistant-border)',
                    color: 'var(--bubble-assistant-text)', boxShadow: '0 1px 4px oklch(0 0 0 / 20%)',
                    fontSize: '14px', lineHeight: '1.65',
                  }}>
                    <span style={{ whiteSpace: 'pre-wrap' }}>{currentMessage}</span>
                    <span className="typing-cursor" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <ChatInput
              onSend={handleSendMessage}
              disabled={!selectedConversationId}
              loading={isStreaming}
            />
          </>
        )}
      </div>
    </div>
  );
}
