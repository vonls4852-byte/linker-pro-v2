// ==================== ТИПЫ ПОЛЬЗОВАТЕЛЯ ====================

export interface User {
  id: string;
  fullName: string;
  phone: string;
  nickname: string;
  email: string | null;
  password: string;
  avatarUrl: string | null;
  bio: string;
  website: string | null;
  location: string | null;
  birthday: string | null;
  gender: string | null;
  role: 'user' | 'helper' | 'moderator' | 'admin' | 'developer';
  isTester: boolean;
  testerSince: number | null;
  experimentsCount: number;
  testedFeatures: string[];
  bugsFound: number;
  testTime: number;
  achievements: string[];
  testerLevel: number;
  xp: number;
  level: number;
  createdAt: string;
  lastActive: number;
  settings: UserSettings;
}

export interface UserSettings {
  themeColor: string;
  themeMode: 'dark' | 'light';
  themeStyle: 'gradient' | 'solid' | 'minimal';
  themeBlur: boolean;
  themeAnimations: boolean;
  privateAccount: boolean;
  showBirthday: boolean;
  showOnline: boolean;
  readReceipts: boolean;
}

// ==================== ТИПЫ ПОСТОВ ====================

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userNickname: string;
  userAvatar: string | null;
  content: string;
  image: string | null;
  likes: string[];
  comments: Comment[];
  createdAt: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
}

// ==================== ТИПЫ ЧАТОВ ====================

export interface Chat {
  id: string;
  name: string | null;
  isGroup: boolean;
  participants: string[];
  lastMessage: Message | null;
  createdAt: number;
  createdBy: string;
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice';
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  read: boolean;
  readBy: string[];
  createdAt: number;
}

// ==================== ТИПЫ ДРУЗЕЙ ====================

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserNickname: string;
  toUserId: string;
  toUserName?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface Friend {
  id: string;
  name: string;
  nickname: string;
  avatarUrl: string | null;
  addedAt: number;
}

// ==================== ТИПЫ УВЕДОМЛЕНИЙ ====================

export interface Notification {
  id: string;
  userId: string;
  type: 'friend' | 'like' | 'comment' | 'message' | 'system';
  fromUserId: string;
  fromUserName: string;
  fromUserNickname: string;
  fromUserAvatar?: string | null;
  postId?: string;
  postContent?: string;
  title?: string;
  text?: string;
  time: number;
  link: string;
  icon: string;
  read: boolean;
  createdAt: number;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// ==================== ТИПЫ ДЛЯ API ====================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface LoginRequest {
  action: 'login';
  phone?: string;
  nickname?: string;
  email?: string;
  password: string;
}

export interface RegisterRequest {
  action: 'register';
  fullName: string;
  phone: string;
  nickname: string;
  email?: string | null;
  password: string;
}

export interface UpdateUserRequest {
  action: 'update';
  userId: string;
  data: Partial<User>;
}

// ==================== ТИПЫ ДЛЯ НАСТРОЕК ====================

export interface AppSettings {
  themeColor: string;
  themeMode: 'dark' | 'light';
  themeStyle: 'gradient' | 'solid' | 'minimal';
  themeBlur: boolean;
  themeAnimations: boolean;
  isTester: boolean;
  testerSince: number | null;
  experimentsCount: number;
  testedFeatures: string[];
  bugsFound: number;
  testTime: number;
  achievements: string[];
  testerLevel: number;
}