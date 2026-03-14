export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationDetail {
  sessionId: string;
  messages: ConversationMessage[];
}

// 继续对话相关类型
export interface StreamMessage {
  type: 'text' | 'error' | 'done';
  content: string;
}

export interface ContinueConversationOptions {
  sessionId: string;
  projectPath: string;
  message: string;
  apiKey?: string;
}

export interface JsonlMessage {
  uuid: string;
  parentUuid: string | null;
  type: 'user' | 'assistant';
  message: {
    role: 'user' | 'assistant';
    content: Array<{ type: 'text'; text: string }>;
  };
  timestamp: string;
}
