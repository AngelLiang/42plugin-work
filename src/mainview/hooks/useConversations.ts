import { useState, useEffect } from 'react';
import { fetchConversationHistory } from '@/lib/42plugin/api';
import { Conversation } from '@/lib/42plugin/types';

export function useConversations(workDir?: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConversationHistory(workDir);
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError('加载对话历史失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [workDir]);

  return {
    conversations,
    loading,
    error,
    reload: loadConversations,
  };
}
