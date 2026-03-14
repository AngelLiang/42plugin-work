import { useState, useEffect, useRef } from 'react';
import { Empty, Skeleton, Collapse, message, Avatar } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import { fetchConversationDetail } from '@/lib/claude/reader';
import { appendMessageToJsonl, createUserMessage, createAssistantMessage } from '@/lib/claude/writer';
import { ChatInput } from '@/components/ChatInput';
import { useChatContinuation } from '@/hooks/useChatContinuation';
import type { ConversationDetail } from '@/lib/claude/types';

interface ChatPageProps {
  conversationId: string | null;
  projectPath: string;
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
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                      wordBreak: 'break-word',
                    }}
                  >
                    {part.text}
                  </pre>
                ),
              },
            ]}
            style={{ marginTop: '8px', marginBottom: '8px' }}
          />
        ) : (
          <span key={i} style={{ whiteSpace: 'pre-wrap' }}>
            {part.text}
          </span>
        )
      )}
    </div>
  );
}

export function ChatPage({ conversationId, projectPath }: ChatPageProps) {
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isStreaming, currentMessage, continueConversation } = useChatContinuation();

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail?.messages, currentMessage]);

  useEffect(() => {
    if (!conversationId || !projectPath) {
      setDetail(null);
      return;
    }

    const loadDetail = async () => {
      setLoading(true);
      try {
        const data = await fetchConversationDetail(conversationId, projectPath);
        setDetail(data);
      } catch (error) {
        console.error('Failed to load conversation:', error);
        message.error('加载对话失败');
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [conversationId, projectPath]);

  const handleSendMessage = async (input: string) => {
    if (!conversationId || !projectPath) return;

    // 创建用户消息
    const lastUuid = (detail && detail.messages.length > 0)
      ? detail.messages[detail.messages.length - 1].timestamp
      : null;

    const userMsg = createUserMessage(input, lastUuid);

    // 保存用户消息到 JSONL
    try {
      await appendMessageToJsonl(conversationId, projectPath, userMsg);
    } catch (err) {
      message.error('保存消息失败');
      return;
    }

    // 开始流式对话
    let fullResponse = '';
    try {
      await continueConversation(
        {
          sessionId: conversationId,
          projectPath,
          message: input,
        },
        (chunk) => {
          fullResponse += chunk;
        }
      );

      // 保存助手消息到 JSONL
      const assistantMsg = createAssistantMessage(fullResponse, userMsg.uuid);
      await appendMessageToJsonl(conversationId, projectPath, assistantMsg);

      // 刷新对话
      const updated = await fetchConversationDetail(conversationId, projectPath);
      setDetail(updated);
    } catch (err) {
      console.error('[ChatPage] 发送消息失败:', err);
      if (err instanceof Error) {
        console.error('[ChatPage] 错误详情:', err.message);
        console.error('[ChatPage] 堆栈:', err.stack);
      }
      message.error(`发送消息失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <Skeleton active paragraph={{ rows: 4 }} />
        <Skeleton active paragraph={{ rows: 3 }} style={{ marginTop: 24 }} />
      </div>
    );
  }

  if (!detail || detail.messages.length === 0) {
    return (
      <Empty
        description="选择左侧对话查看详情"
        style={{ marginTop: '80px' }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 消息列表 */}
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
              <Avatar
                size={30}
                icon={<RobotOutlined />}
                style={{
                  background: 'oklch(0.546 0.245 262.881)',
                  flexShrink: 0,
                  marginTop: 2,
                  boxShadow: '0 0 0 2px oklch(0.546 0.245 262.881 / 20%)',
                }}
              />
            )}
            <div
              style={{
                maxWidth: '75%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? 'var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl)' : 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
                background: msg.role === 'user' ? 'var(--bubble-user-bg)' : 'var(--bubble-assistant-bg)',
                color: msg.role === 'user' ? 'var(--bubble-user-text)' : 'var(--bubble-assistant-text)',
                border: msg.role === 'assistant' ? '1px solid var(--bubble-assistant-border)' : 'none',
                boxShadow: msg.role === 'user' ? '0 2px 8px oklch(0.546 0.245 262.881 / 25%)' : '0 1px 4px oklch(0 0 0 / 20%)',
                wordBreak: 'break-word',
                fontSize: '14px',
                lineHeight: '1.65',
              }}
            >
              <div style={{ fontSize: '10px', opacity: 0.45, marginBottom: '5px', letterSpacing: '0.02em' }}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
              {renderContent(msg.content, msg.role)}
            </div>
            {msg.role === 'user' && (
              <Avatar
                size={30}
                icon={<UserOutlined />}
                style={{
                  background: 'oklch(0.546 0.245 262.881)',
                  flexShrink: 0,
                  marginTop: 2,
                  boxShadow: '0 0 0 2px oklch(0.546 0.245 262.881 / 20%)',
                }}
              />
            )}
          </div>
        ))}
        {isStreaming && currentMessage && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '10px', marginBottom: '20px' }}>
            <Avatar
              size={30}
              icon={<RobotOutlined />}
              style={{
                background: 'oklch(0.546 0.245 262.881)',
                flexShrink: 0,
                marginTop: 2,
                boxShadow: '0 0 0 2px oklch(0.546 0.245 262.881 / 20%)',
              }}
            />
            <div style={{
              maxWidth: '75%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-xl) var(--radius-xl) var(--radius-xl) var(--radius-sm)',
              background: 'var(--bubble-assistant-bg)',
              border: '1px solid var(--bubble-assistant-border)',
              color: 'var(--bubble-assistant-text)',
              boxShadow: '0 1px 4px oklch(0 0 0 / 20%)',
              fontSize: '14px',
              lineHeight: '1.65',
            }}>
              <span style={{ whiteSpace: 'pre-wrap' }}>{currentMessage}</span>
              <span className="typing-cursor" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <ChatInput
        onSend={handleSendMessage}
        disabled={!conversationId}
        loading={isStreaming}
      />
    </div>
  );
}
