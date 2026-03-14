export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  installed: boolean;
  linkPath?: string;
  installedAt?: string;
  fullName?: string;
  descriptionZh?: string;
  homepage?: string;
  tags?: string[];
}

export interface StatusData {
  user: {
    username: string;
    role: string;
    vipExpiresAt: string | null;
  };
  plan: string;
  quota: {
    role: string;
    kits: { current: number; limit: number; unlimited: boolean };
    pluginsPerKit: { limit: number; unlimited: boolean };
    installToday: { used: number; limit: number; remaining: number; unlimited: boolean };
  };
}

export interface AuthStatus {
  loggedIn: boolean;
  username: string;
}

export interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  projectPath: string;
}
