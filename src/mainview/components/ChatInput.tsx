import React, { useState } from 'react';
import { Input, Button } from 'antd';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, loading }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !disabled && !loading) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '12px 16px',
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--bg-surface)',
    }}>
      <Input.TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onPressEnter={(e) => {
          if (!e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="输入消息... (Shift+Enter 换行)"
        autoSize={{ minRows: 1, maxRows: 4 }}
        disabled={disabled || loading}
        style={{ borderRadius: 'var(--radius-lg)' }}
      />
      <Button
        icon={<Send size={16} />}
        onClick={handleSend}
        disabled={!input.trim() || disabled || loading}
        loading={loading}
        style={{
          cursor: (!input.trim() || disabled || loading) ? 'not-allowed' : 'pointer',
          borderRadius: 'var(--radius-md)',
          background: (!input.trim() || disabled || loading) ? 'var(--color-primary-subtle)' : 'var(--color-primary)',
          borderColor: 'transparent',
          color: (!input.trim() || disabled || loading) ? 'var(--color-primary)' : 'var(--text-on-primary)',
          alignSelf: 'flex-end',
          height: 36,
          width: 36,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: (!input.trim() || disabled || loading) ? 'none' : 'var(--shadow-primary)',
          transition: 'all var(--transition-base)',
        }}
      />
    </div>
  );
};
