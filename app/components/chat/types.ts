export interface Chat {
  id: string;
  type: 'private' | 'group';
  name: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: number;
  createdAt: number;
  avatar?: string;
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: number;
  read: boolean;
  readBy?: string[];
  type?: 'text' | 'image' | 'file' | 'voice';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface ChatListProps {
  currentUser: any;
  onSelectChat: (chat: Chat | null) => void;
  selectedChatId?: string;
}

export interface ChatWindowProps {
  chat: Chat;
  currentUser: any;
  onClose: () => void;
  onDeleteChat?: (chatId: string) => void;
}

export interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onChatCreated: (chat: Chat) => void;
  existingChats: Chat[];
}

export interface VoiceRecorderProps {
  onSendVoice: (blob: Blob, duration: number) => void;
  onSendVideo: () => void;
  onCancel: () => void;
}