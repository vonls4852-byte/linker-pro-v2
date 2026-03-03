"use client";
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Users, Plus, Search, CheckCheck, X, Trash2 } from 'lucide-react';
import CreateGroupModal from './CreateGroupModal';

// ==================== ИНТЕРФЕЙСЫ ====================
interface ChatListProps {
  currentUser: any;
  onSelectChat: (chat: any) => void;
  selectedChatId?: string;
}

// ==================== ОСНОВНОЙ КОМПОНЕНТ ====================
export default function ChatList({ currentUser, onSelectChat, selectedChatId }: ChatListProps) {
  // ==================== 1. СОСТОЯНИЯ ====================
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  
  // Состояния для модалок
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  
  // Состояния для поиска пользователей
  const [newChatSearch, setNewChatSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ==================== 2. ЗАГРУЗКА ДАННЫХ ====================
  useEffect(() => {
    loadChats();
  }, [currentUser]);

  // Слушаем событие отправки сообщения
  useEffect(() => {
    const handleMessageSent = (event: CustomEvent) => {
      const { chatId, message } = event.detail;
      updateChatLastMessage(chatId, message);
    };

    window.addEventListener('messageSent', handleMessageSent as EventListener);
    return () => window.removeEventListener('messageSent', handleMessageSent as EventListener);
  }, []);

  // ==================== 3. ФУНКЦИИ РАБОТЫ С ЧАТАМИ ====================
  const loadChats = () => {
    try {
      const saved = localStorage.getItem(`chats_${currentUser.id}`);
      if (saved) {
        setChats(JSON.parse(saved));
      } else {
        setChats([]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
    }
  };

  const updateChatLastMessage = (chatId: string, message: any) => {
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId
          ? { ...chat, lastMessage: message, updatedAt: Date.now() }
          : chat
      ).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    );
  };

  // ==================== 4. ФУНКЦИИ ПОИСКА ПОЛЬЗОВАТЕЛЕЙ ====================
  const searchUsers = async () => {
    if (!newChatSearch.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`/api/users?search=${encodeURIComponent(newChatSearch)}`);
      const data = await response.json();

      if (data.users && Array.isArray(data.users)) {
        const existingChatUserIds = chats.map(chat =>
          chat.participants?.find((id: string) => id !== currentUser.id)
        ).filter(Boolean);

        const results = data.users.filter((user: any) =>
          user.id !== currentUser.id &&
          !existingChatUserIds.includes(user.id)
        );

        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // ==================== 5. ФУНКЦИИ СОЗДАНИЯ ЧАТОВ ====================
  const createNewChat = (userId: string, userName: string, userNickname: string) => {
    const chatId = `chat_${Date.now()}`;
    const otherChatId = `chat_${Date.now() + 1}`;

    // Чат для текущего пользователя
    const newChat = {
      id: chatId,
      type: 'private',
      participants: [currentUser.id, userId],
      name: userName,
      lastMessage: null,
      unreadCount: 0,
      updatedAt: Date.now(),
      createdAt: Date.now()
    };

    // Чат для другого пользователя
    const otherUserChat = {
      id: otherChatId,
      type: 'private',
      participants: [userId, currentUser.id],
      name: currentUser.fullName || currentUser.nickname,
      lastMessage: null,
      unreadCount: 0,
      updatedAt: Date.now(),
      createdAt: Date.now()
    };

    // Сохраняем оба чата
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    localStorage.setItem(`chats_${currentUser.id}`, JSON.stringify(updatedChats));

    const otherUserChats = JSON.parse(localStorage.getItem(`chats_${userId}`) || '[]');
    otherUserChats.push(otherUserChat);
    localStorage.setItem(`chats_${userId}`, JSON.stringify(otherUserChats));

    // Создаём приветственное сообщение
    const welcomeMessage = {
      id: `welcome_${Date.now()}`,
      chatId,
      userId: 'system',
      userName: 'Система',
      content: 'Чат создан. Напишите первое сообщение!',
      createdAt: Date.now(),
      read: true
    };
    localStorage.setItem(`messages_${chatId}`, JSON.stringify([welcomeMessage]));

    // Закрываем модалку и открываем новый чат
    setShowNewChatModal(false);
    setNewChatSearch('');
    setSearchResults([]);
    onSelectChat(newChat);
  };

  const handleGroupCreated = (groupData: any) => {
    console.log('Group created:', groupData);

    const updatedChats = [groupData, ...chats];
    setChats(updatedChats);
    localStorage.setItem(`chats_${currentUser.id}`, JSON.stringify(updatedChats));

    // Создаём приветственное сообщение для группы
    const welcomeMessage = {
      id: `welcome_${Date.now()}`,
      chatId: groupData.id,
      userId: 'system',
      userName: 'Система',
      content: `Группа "${groupData.name}" создана. Добавьте участников!`,
      createdAt: Date.now(),
      read: true
    };
    localStorage.setItem(`messages_${groupData.id}`, JSON.stringify([welcomeMessage]));

    setShowCreateGroupModal(false);
    onSelectChat(groupData);
  };

  // ==================== 6. ФУНКЦИИ УПРАВЛЕНИЯ ЧАТАМИ ====================
  const deleteChat = (chatId: string, chatName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (confirm(`Удалить чат "${chatName}"?`)) {
      const updatedChats = chats.filter(c => c.id !== chatId);
      setChats(updatedChats);
      localStorage.setItem(`chats_${currentUser.id}`, JSON.stringify(updatedChats));

      if (selectedChatId === chatId) {
        onSelectChat(null);
      }

      localStorage.removeItem(`messages_${chatId}`);
    }
  };

  // ==================== 7. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'сейчас';
    if (minutes < 60) return `${minutes} мин`;
    if (hours < 24) return `${hours} ч`;
    if (days < 7) return `${days} д`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getChatName = (chat: any) => {
    if (chat.type === 'group') return chat.name;
    return chat.name || 'Пользователь';
  };

  const getChatAvatar = (chat: any) => {
    if (chat.type === 'group') {
      return <Users size={24} className="text-green-400" />;
    }
    return <MessageCircle size={24} className="text-blue-400" />;
  };

  // Фильтрация чатов по поиску
  const filteredChats = chats
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .filter(chat => {
      if (!searchQuery) return true;
      return (chat.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    });

  // ==================== 8. JSX КОМПОНЕНТА ====================
  return (
    <div className="h-full flex flex-col bg-[#111] rounded-2xl border border-white/5">
      {/* ===== ШАПКА ===== */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-500">Чаты</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
              title="Создать группу"
            >
              <Users size={20} className="text-white" />
            </button>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors"
              title="Новый личный чат"
            >
              <Plus size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Поиск по чатам */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по чатам"
            className="w-full bg-black/50 rounded-xl pl-10 pr-4 py-2.5 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors text-white"
          />
        </div>
      </div>

      {/* ===== СПИСОК ЧАТОВ ===== */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredChats.length === 0 ? (
          <EmptyChats searchQuery={searchQuery} />
        ) : (
          <div className="space-y-1">
            {filteredChats.map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                isSelected={selectedChatId === chat.id}
                currentUser={currentUser}
                onlineUsers={onlineUsers}
                onSelect={onSelectChat}
                onDelete={deleteChat}
                formatTime={formatTime}
                getChatName={getChatName}
                getChatAvatar={getChatAvatar}
              />
            ))}
          </div>
        )}
      </div>

      {/* ===== МОДАЛКИ ===== */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        searchQuery={newChatSearch}
        setSearchQuery={setNewChatSearch}
        searchResults={searchResults}
        loading={loading}
        onSearch={searchUsers}
        onCreateChat={createNewChat}
      />

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        currentUser={currentUser}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
}

// ==================== 9. КОМПОНЕНТ ПУСТОГО СПИСКА ====================
function EmptyChats({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <MessageCircle size={48} className="text-zinc-700 mb-3" />
      <p className="text-zinc-500 text-sm">
        {searchQuery ? 'Ничего не найдено' : 'Нет чатов'}
      </p>
      <p className="text-xs text-zinc-600 mt-1">
        {searchQuery ? 'Попробуйте другой запрос' : 'Нажмите + чтобы создать'}
      </p>
    </div>
  );
}

// ==================== 10. КОМПОНЕНТ ЭЛЕМЕНТА ЧАТА ====================
function ChatItem({ 
  chat, 
  isSelected, 
  currentUser, 
  onlineUsers, 
  onSelect, 
  onDelete, 
  formatTime,
  getChatName,
  getChatAvatar 
}: any) {
  const lastMsg = chat.lastMessage;
  const isMe = lastMsg?.userId === currentUser.id;

  return (
    <div
      onClick={() => onSelect(chat)}
      className={`
        p-3 rounded-xl cursor-pointer transition-all group
        ${isSelected
          ? 'bg-blue-500/20 border border-blue-500/30'
          : 'hover:bg-white/5'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {/* Аватар */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            {getChatAvatar(chat)}
          </div>
          {chat.type === 'private' && (
            <div className={`
              absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black
              ${onlineUsers.includes(chat.participants?.find((id: string) => id !== currentUser.id) || '')
                ? 'bg-green-500'
                : 'bg-gray-500'
              }
            `} />
          )}
        </div>

        {/* Информация о чате */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <p className="font-medium truncate text-white">
              {getChatName(chat)}
            </p>
            {lastMsg && (
              <p className="text-[10px] text-zinc-500 ml-2 shrink-0">
                {formatTime(lastMsg.createdAt)}
              </p>
            )}
          </div>

          {lastMsg ? (
            <div className="flex items-center gap-1">
              {isMe && (
                <CheckCheck
                  size={12}
                  className={lastMsg.read ? 'text-blue-400' : 'text-zinc-600'}
                />
              )}
              <p className="text-xs text-zinc-500 truncate">
                {isMe ? 'Вы: ' : ''}{lastMsg.content}
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-600">Нет сообщений</p>
          )}
        </div>

        {/* Счетчик и кнопка удаления */}
        <div className="flex items-center gap-2">
          {chat.unreadCount > 0 && (
            <div className="w-5 h-5 bg-blue-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
              {chat.unreadCount}
            </div>
          )}
          <button
            onClick={(e) => onDelete(chat.id, getChatName(chat), e)}
            className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            title="Удалить чат"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== 11. КОМПОНЕНТ МОДАЛКИ НОВОГО ЧАТА ====================
function NewChatModal({ 
  isOpen, 
  onClose, 
  searchQuery, 
  setSearchQuery, 
  searchResults, 
  loading, 
  onSearch, 
  onCreateChat 
}: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-500">Новый чат</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Поиск */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              placeholder="Введите имя или никнейм..."
              className="w-full bg-black/50 rounded-xl pl-10 pr-4 py-3 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors text-white"
            />
          </div>

          {/* Кнопка поиска */}
          <button
            onClick={onSearch}
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
                  onClick={() => onCreateChat(user.id, user.fullName || user.nickname, user.nickname)}
                  className="flex items-center gap-3 p-3 bg-black/30 hover:bg-black/50 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() :
                        user.nickname ? user.nickname.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{user.fullName || user.nickname}</p>
                    <p className="text-xs text-zinc-500">@{user.nickname || 'unknown'}</p>
                  </div>
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