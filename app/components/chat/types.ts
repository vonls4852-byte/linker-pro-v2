// ==================== ТИПЫ ЧАТОВ ====================

export interface Chat {
  id: string;
  type: 'private' | 'group';
  name: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: number;
  createdAt: number;
  createdBy: string;
  avatar?: string | null;
  admins?: string[];
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
  type?: 'text' | 'image' | 'file' | 'voice' | 'system';
  url?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
}

export interface TypingStatus {
  userId: string;
  userName: string;
  chatId: string;
  timestamp: number;
}

// ==================== ПРОПСЫ КОМПОНЕНТОВ ====================

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

export interface VoiceRecorderProps {
  onSendVoice: (blob: Blob, duration: number) => void;
  onSendVideo: () => void;
  onCancel: () => void;
}

export interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onGroupCreated: (groupData: any) => void;
}

export interface NewChatModalProps {  // ← ДОБАВИТЬ ЭТОТ ИНТЕРФЕЙС
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onChatCreated: (chat: Chat) => void;
  existingChats: Chat[];
}

export interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  currentUser: any;
  onAddParticipants?: () => void;
  onLeaveGroup?: () => void;
  onDeleteGroup?: () => void;
  onToggleAdmin?: (userId: string, action: 'add' | 'remove') => void;
}

export interface AddParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupChat: Chat;
  currentUser: any;
  onParticipantsAdded: () => void;
}