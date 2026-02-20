"use client";
import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, Plus, Search, CheckCheck, Trash2 } from 'lucide-react';
import { Chat, ChatListProps } from './types';
import NewChatModal from './NewChatModal';

export default function ChatList({ currentUser, onSelectChat, selectedChatId }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Загрузка чатов
  useEffect(() => {
    loadChats();
  }, [currentUser]);

  const loadChats = () => {
    try {
      const saved = localStorage.getItem(`chats_${currentUser.id}`);
      if (saved) {
        setChats(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  // Форматирование времени
  const formatTime = (timestamp: number): string => {
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

  // Получить имя чата
  const getChatName = (chat: Chat): string => {
    if (chat.type === 'group') return chat.name;
    return chat.name;
  };

  // Получить иконку чата
  const getChatIcon = (chat: Chat) => {
    if (chat.type === 'group') {
      return <Users size={24} className="text-green-400" />;
    }
    return <MessageCircle size={24} className="text-blue-400" />;
  };

  // Удалить чат
  const deleteChat = (chatId: string, chatName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm(`Удалить чат "${chatName}"?`)) {
      // Удаляем у текущего пользователя
      const updatedChats = chats.filter((c: Chat) => c.id !== chatId);
      setChats(updatedChats);
      localStorage.setItem(`chats_${currentUser.id}`, JSON.stringify(updatedChats));

      // Если удаляемый чат был выбран - закрываем
      if (selectedChatId === chatId) {
        onSelectChat(null);
      }

      // Удаляем сообщения
      localStorage.removeItem(`messages_${chatId}`);

      // Удаляем у собеседника
      const otherParticipantId = chats.find((c: Chat) => c.id === chatId)?.participants
        .find((id: string) => id !== currentUser.id);
      
      if (otherParticipantId) {
        const otherChats = JSON.parse(localStorage.getItem(`chats_${otherParticipantId}`) || '[]');
        const updatedOtherChats = otherChats.filter((c: Chat) => 
          !c.participants.includes(currentUser.id)
        );
        localStorage.setItem(`chats_${otherParticipantId}`, JSON.stringify(updatedOtherChats));
      }
    }
  };

  // Обработчик создания нового чата
  const handleChatCreated = (newChat: Chat) => {
    const updatedChats = [newChat, ...chats];
    setChats(updatedChats);
    localStorage.setItem(`chats_${currentUser.id}`, JSON.stringify(updatedChats));
    setShowNewChatModal(false);
    onSelectChat(newChat);
  };

  // Фильтрация чатов по поиску
  const filteredChats = chats
    .sort((a: Chat, b: Chat) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .filter((chat: Chat) => {
      if (!searchQuery) return true;
      return chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

  return (
    <div className="h-full flex flex-col bg-[#111] rounded-2xl border border-white/5">
      {/* Шапка */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-500">Чаты</h2>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors"
            title="Новый чат"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>
        
        {/* Поиск */}
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

      {/* Список чатов */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <MessageCircle size={48} className="text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm">
              {searchQuery ? 'Ничего не найдено' : 'Нет чатов'}
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              {searchQuery ? 'Попробуйте другой запрос' : 'Нажмите + чтобы создать'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredChats.map((chat: Chat) => {
              const isSelected = selectedChatId === chat.id;
              const lastMsg = chat.lastMessage;
              const isMe = lastMsg?.userId === currentUser.id;

              return (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
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
                        {getChatIcon(chat)}
                      </div>
                      {chat.type === 'private' && (
                        <div className={`
                          absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black
                          ${onlineUsers.includes(chat.participants.find((id: string) => id !== currentUser.id) || '')
                            ? 'bg-green-500'
                            : 'bg-gray-500'
                          }
                        `} />
                      )}
                    </div>

                    {/* Информация */}
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

                    {/* Счетчик и удаление */}
                    <div className="flex items-center gap-2">
                      {chat.unreadCount > 0 && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                          {chat.unreadCount}
                        </div>
                      )}
                      <button
                        onClick={(e) => deleteChat(chat.id, getChatName(chat), e)}
                        className="p-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Удалить чат"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Модалка создания чата */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        currentUser={currentUser}
        onChatCreated={handleChatCreated}
        existingChats={chats}
      />
    </div>
  );
}