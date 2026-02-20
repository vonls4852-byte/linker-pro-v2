"use client";
import React, { useState } from 'react';
import { Search, X, MessageCircle } from 'lucide-react';
import { Chat, NewChatModalProps } from './types';

export default function NewChatModal({ isOpen, onClose, currentUser, onChatCreated, existingChats }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Поиск пользователей
  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    
    try {
      // Получаем всех пользователей
      const allUsers = JSON.parse(localStorage.getItem('all_users') || '[]');
      
      // Получаем ID пользователей, с которыми уже есть чат
      const existingChatUserIds = existingChats.map((chat: Chat) => 
        chat.participants.find((id: string) => id !== currentUser.id)
      );
      
      // Фильтруем: все пользователи, кроме себя и тех, с кем уже есть чат
      const results = allUsers.filter((user: any) => 
        user.id !== currentUser.id &&
        !existingChatUserIds.includes(user.id) &&
        (user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         user.nickname?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Создать новый чат
  const createNewChat = (userId: string, userName: string) => {
    const newChat: Chat = {
      id: `chat_${Date.now()}`,
      type: 'private',
      participants: [currentUser.id, userId],
      name: userName,
      unreadCount: 0,
      updatedAt: Date.now(),
      createdAt: Date.now()
    };

    // Создаём чат и для другого пользователя
    const otherUserChat: Chat = {
      ...newChat,
      id: `chat_${Date.now() + 1}`,
      name: currentUser.fullName || currentUser.nickname,
      participants: [userId, currentUser.id]
    };

    // Сохраняем для другого пользователя
    const otherChats = JSON.parse(localStorage.getItem(`chats_${userId}`) || '[]');
    otherChats.push(otherUserChat);
    localStorage.setItem(`chats_${userId}`, JSON.stringify(otherChats));

    // Создаём приветственное сообщение
    const welcomeMessage = {
      id: `welcome_${Date.now()}`,
      chatId: newChat.id,
      userId: 'system',
      userName: 'Система',
      content: 'Чат создан. Напишите первое сообщение!',
      createdAt: Date.now(),
      read: true
    };
    localStorage.setItem(`messages_${newChat.id}`, JSON.stringify([welcomeMessage]));

    onChatCreated(newChat);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md border border-white/10">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-500">Новый чат</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        {/* Поиск */}
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              placeholder="Введите имя или никнейм..."
              className="w-full bg-black/50 rounded-xl pl-10 pr-4 py-3 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors text-white"
            />
          </div>

          <button
            onClick={searchUsers}
            disabled={loading}
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Поиск...' : 'Найти'}
          </button>

          {/* Результаты поиска */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <p className="text-xs text-zinc-500">Найдено пользователей:</p>
              {searchResults.map((user: any) => (
                <div
                  key={user.id}
                  onClick={() => createNewChat(user.id, user.fullName || user.nickname)}
                  className="flex items-center gap-3 p-3 bg-black/30 hover:bg-black/50 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {user.fullName?.charAt(0) || user.nickname?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{user.fullName || user.nickname}</p>
                    <p className="text-xs text-zinc-500">@{user.nickname}</p>
                  </div>
                  <MessageCircle size={18} className="text-blue-400" />
                </div>
              ))}
            </div>
          )}

          {/* Пустой результат */}
          {searchQuery && searchResults.length === 0 && !loading && (
            <p className="text-center text-zinc-500 py-4 text-sm">
              Пользователи не найдены
            </p>
          )}
        </div>
      </div>
    </div>
  );
}