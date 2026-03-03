"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Image, Mic, X, CheckCheck, MessageCircle, Trash2, Users } from 'lucide-react';
import { Chat, Message, ChatWindowProps } from './types';
import VoiceRecorder from './VoiceRecorder';
import GroupInfoModal from './GroupInfoModal';
import AddParticipantsModal from './AddParticipantsModal';

// ==================== ОСНОВНОЙ КОМПОНЕНТ ====================
export default function ChatWindow({ chat, currentUser, onClose, onDeleteChat }: ChatWindowProps) {
  // ==================== 1. СОСТОЯНИЯ ====================
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showAddParticipants, setShowAddParticipants] = useState(false);

  // ==================== 2. ЗАГРУЗКА СООБЩЕНИЙ ====================
  useEffect(() => {
    if (chat?.id) {
      loadMessages();
      markAsRead();
    }
  }, [chat?.id]);

  // Периодическая проверка новых сообщений
  useEffect(() => {
    if (!chat?.id) return;

    const interval = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [chat?.id]);

  // Скролл к последнему сообщению
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ==================== 3. ФУНКЦИИ РАБОТЫ С СООБЩЕНИЯМИ ====================
  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/messages?chatId=${chat.id}&_=${Date.now()}`);
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chat.id, userId: currentUser.id })
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      chatId: chat.id,
      userId: currentUser.id,
      userName: currentUser.fullName,
      content: newMessage,
      createdAt: Date.now(),
      read: false
    };

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chat.id, message })
      });

      const data = await response.json();
      if (data.success) {
        setMessages([...messages, message]);
        setNewMessage('');

        const event = new CustomEvent('messageSent', { detail: { chatId: chat.id, message } });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ==================== 4. ФУНКЦИИ ДЛЯ ГОЛОСОВЫХ СООБЩЕНИЙ ====================
  const handleSendVoice = async (audioBlob: Blob, duration: number) => {
    const voiceMessage: Message = {
      id: Date.now().toString(),
      chatId: chat.id,
      userId: currentUser.id,
      userName: currentUser.fullName,
      content: `🎤 Голосовое сообщение (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`,
      createdAt: Date.now(),
      read: false,
      type: 'voice'
    };

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chat.id, message: voiceMessage })
      });

      const data = await response.json();
      if (data.success) {
        setMessages([...messages, voiceMessage]);
        const event = new CustomEvent('messageSent', { detail: { chatId: chat.id, message: voiceMessage } });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
  };

  const handleSendVideo = () => {
    alert('Режим видеосообщений будет доступен в следующем обновлении');
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
  };

  // ==================== 5. ФУНКЦИИ ДЛЯ ГРУПП ====================
  const handleOpenGroupInfo = () => {
    if (chat.isGroup) {
      setShowGroupInfo(true);
    }
  };

  const handleLeaveGroup = () => {
    // TODO: выход из группы
    console.log('Leave group:', chat.id);
  };

  const handleDeleteGroup = () => {
    // TODO: удаление группы
    console.log('Delete group:', chat.id);
  };

  const handleAddParticipants = () => {
    setShowGroupInfo(false);
    setShowAddParticipants(true);
  };

  const handleParticipantsAdded = () => {
    // Обновить информацию о группе
    setShowAddParticipants(false);
    // Можно перезагрузить данные группы
  };

  // ==================== 6. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Сегодня';
    if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
    return date.toLocaleDateString('ru-RU');
  };

  // Группировка сообщений по датам
  const groupedMessages: { [key: string]: Message[] } = {};
  messages.forEach(msg => {
    const date = formatDate(msg.createdAt);
    if (!groupedMessages[date]) groupedMessages[date] = [];
    groupedMessages[date].push(msg);
  });

  // ==================== 7. JSX КОМПОНЕНТА ====================
  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] rounded-2xl border border-white/5">
      {/* Шапка чата */}
      <ChatHeader
        chat={chat}
        currentUser={currentUser}
        onClose={onClose}
        onDeleteChat={onDeleteChat}
        onOpenGroupInfo={handleOpenGroupInfo}
      />

      {/* Сообщения */}
      <MessagesList
        groupedMessages={groupedMessages}
        currentUser={currentUser}
        formatTime={formatTime}
      />
      <div ref={messagesEndRef} />

      {/* Индикатор печатает */}
      {isTyping && <TypingIndicator />}

      {/* Поле ввода */}
      <MessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        sendMessage={sendMessage}
        onSendVoice={handleSendVoice}
        onSendVideo={handleSendVideo}
        onCancelRecording={handleCancelRecording}
      />

      {/* Модалка информации о группе */}
      {chat.isGroup && (
        <GroupInfoModal
          isOpen={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
          chat={chat}
          currentUser={currentUser}
          onAddParticipants={handleAddParticipants}
          onLeaveGroup={handleLeaveGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      )}

      {/* Модалка добавления участников */}
      <AddParticipantsModal
        isOpen={showAddParticipants}
        onClose={() => setShowAddParticipants(false)}
        groupChat={chat}
        currentUser={currentUser}
        onParticipantsAdded={handleParticipantsAdded}
      />
    </div>
  );
}

// ==================== 8. КОМПОНЕНТ ШАПКИ ЧАТА ====================
function ChatHeader({ chat, currentUser, onClose, onDeleteChat, onOpenGroupInfo }: any) {
  return (
    <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          {chat.isGroup ? (
            <Users size={18} className="text-white" />
          ) : (
            <MessageCircle size={18} className="text-white" />
          )}
        </div>
        <div
          className={chat.isGroup ? 'cursor-pointer' : ''}
          onClick={onOpenGroupInfo}
        >
          <h3 className="font-medium text-white">{chat.name}</h3>
          <p className="text-xs text-zinc-500">
            {chat.isGroup
              ? `${chat.participants?.length || 0} участников`
              : 'online'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onDeleteChat && (
          <button
            onClick={() => onDeleteChat(chat.id)}
            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Удалить чат"
          >
            <Trash2 size={18} className="text-red-400" />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          title="Закрыть"
        >
          <X size={20} className="text-zinc-400" />
        </button>
      </div>
    </div>
  );
}

// ==================== 9. КОМПОНЕНТ СПИСКА СООБЩЕНИЙ ====================
function MessagesList({ groupedMessages, currentUser, formatTime }: any) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {Object.entries(groupedMessages).map(([date, msgs]) => (
        <div key={date}>
          <div className="flex justify-center mb-4">
            <span className="px-3 py-1 bg-black/30 rounded-full text-xs text-zinc-500">
              {date}
            </span>
          </div>
          <div className="space-y-4">
            {(msgs as Message[]).map((msg, index) => (
              <MessageItem
                key={msg.id}
                msg={msg}
                index={index}
                msgs={msgs as Message[]}
                currentUser={currentUser}
                formatTime={formatTime}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ==================== 10. КОМПОНЕНТ СООБЩЕНИЯ ====================
function MessageItem({ msg, index, msgs, currentUser, formatTime }: any) {
  const isMe = msg.userId === currentUser.id;
  const isSystem = msg.userId === 'system';
  const showAvatar = index === 0 || msgs[index - 1]?.userId !== msg.userId;

  if (isSystem) {
    return (
      <div key={msg.id} className="flex justify-center">
        <span className="px-4 py-2 bg-black/30 rounded-full text-xs text-zinc-500">
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
        {!isMe && showAvatar && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mt-1">
            <span className="text-white text-xs font-bold">
              {msg.userName?.charAt(0) || '?'}
            </span>
          </div>
        )}
        {!isMe && !showAvatar && <div className="w-8 shrink-0" />}
        <div>
          {!isMe && showAvatar && (
            <p className="text-xs text-zinc-500 mb-1 ml-1">{msg.userName}</p>
          )}
          <div className={`
            px-4 py-2 rounded-2xl
            ${isMe
              ? 'bg-blue-500 text-white rounded-tr-none'
              : 'bg-[#1a1a1a] text-white rounded-tl-none'
            }
          `}>
            <p className="text-sm break-words">{msg.content}</p>
          </div>
          <div className={`
            flex items-center gap-1 mt-1 text-[10px] text-zinc-600
            ${isMe ? 'justify-end' : 'justify-start'}
          `}>
            <span>{formatTime(msg.createdAt)}</span>
            {isMe && (
              <CheckCheck
                size={12}
                className={msg.read ? 'text-blue-400' : 'text-zinc-600'}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== 11. КОМПОНЕНТ ИНДИКАТОРА ПЕЧАТИ ====================
function TypingIndicator() {
  return (
    <div className="px-6 py-2">
      <div className="flex items-center gap-1 text-sm text-zinc-500">
        <span>печатает</span>
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ==================== 12. КОМПОНЕНТ ПОЛЯ ВВОДА ====================
function MessageInput({ newMessage, setNewMessage, sendMessage, onSendVoice, onSendVideo, onCancelRecording }: any) {
  return (
    <div className="p-4 border-t border-white/5 shrink-0">
      <div className="flex items-center gap-2">
        <button className="p-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl transition-colors">
          <Paperclip size={20} className="text-green-400" />
        </button>
        <button className="p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl transition-colors">
          <Image size={20} className="text-purple-400" />
        </button>

        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Написать сообщение..."
          className="flex-1 bg-[#1a1a1a] rounded-xl px-4 py-3 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors text-white"
        />

        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          className="p-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors disabled:opacity-50"
        >
          <Send size={20} className="text-white" />
        </button>

        <VoiceRecorder
          onSendVoice={onSendVoice}
          onSendVideo={onSendVideo}
          onCancel={onCancelRecording}
        />
      </div>
    </div>
  );
}