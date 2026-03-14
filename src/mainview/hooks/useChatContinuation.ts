import { useState, useCallback, useRef } from 'react';
import type { ContinueConversationOptions } from '@/lib/claude/types';
import { view } from '../rpc';

export function useChatContinuation() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void)[]>([]);

  const removeListeners = () => {
    unsubscribeRef.current.forEach((fn) => fn());
    unsubscribeRef.current = [];
  };

  const continueConversation = useCallback(
    async (options: ContinueConversationOptions, onChunk: (chunk: string) => void) => {
      setIsStreaming(true);
      setCurrentMessage('');
      setError(null);

      return new Promise<void>((resolve, reject) => {
        removeListeners();

        const unsubChunk = view.rpc.addMessageListener('chatChunk', (msg) => {
          if (msg.type === 'text') {
            setCurrentMessage((prev) => prev + msg.content);
            onChunk(msg.content);
          } else if (msg.type === 'done') {
            setIsStreaming(false);
          } else if (msg.type === 'error') {
            setError(msg.content);
            setIsStreaming(false);
          }
        });

        const unsubDone = view.rpc.addMessageListener('chatDone', ({ exitCode }) => {
          removeListeners();
          setIsStreaming(false);
          if (exitCode !== 0) reject(new Error(`Script exited with code ${exitCode}`));
          else resolve();
        });

        const unsubError = view.rpc.addMessageListener('chatError', ({ message: msg }) => {
          removeListeners();
          setError(msg);
          setIsStreaming(false);
          reject(new Error(msg));
        });

        unsubscribeRef.current = [unsubChunk, unsubDone, unsubError];

        view.rpc.request
          .chatContinue({
            sessionId: options.sessionId,
            projectPath: options.projectPath,
            message: options.message,
            apiKey: options.apiKey,
          })
          .catch((err: Error) => {
            removeListeners();
            setIsStreaming(false);
            reject(err);
          });
      });
    },
    []
  );

  return {
    isStreaming,
    currentMessage,
    error,
    continueConversation,
  };
}
