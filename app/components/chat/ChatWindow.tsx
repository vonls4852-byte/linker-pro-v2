"use client";
import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  Image,
  Mic,
  X,
  CheckCheck,
  MessageCircle,
  Trash2,
  Users
} from 'lucide-react';
import { Chat, Message, ChatWindowProps, TypingStatus } from './types';
import VoiceRecorder from './VoiceRecorder';
import GroupInfoModal from './GroupInfoModal';
import AddParticipantsModal from './AddParticipantsModal';

export default function ChatWindow({
  chat,
  currentUser,
  onClose,
  onDeleteChat
}: ChatWindowProps) {
  // ==================== 1. СОСТОЯНИЯ ====================
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showAddParticipants, setShowAddParticipants] = useState(false);
  const [typingUser, setTypingUser] = useState<TypingStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== 2. EFFECTS ====================
  useEffect(() => {
    if (chat?.id) {
      loadMessages();
      markAsRead();
    }
  }, [chat?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!chat?.id) return;
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [chat?.id]);

  useEffect(() => {
    if (!chat?.id || chat.type !== 'group') return;
    const interval = setInterval(checkTypingStatus, 1000);
    return () => clearInterval(interval);
  }, [chat?.id, currentUser.id]);

  // ==================== 3. ФУНКЦИИ СООБЩЕНИЙ ====================
  const loadMessages = async () => {
    try {
      const response = await fetch(
        `/api/messages?chatId=${chat.id}&_=${Date.now()}`
      );
      const data = await response.json();
      if (data.messages) setMessages(data.messages);
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
      const event = new CustomEvent('messagesRead', { detail: { chatId: chat.id } });
      window.dispatchEvent(event);
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
        const event = new CustomEvent('messageSent', {
          detail: { chatId: chat.id, message }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ==================== 4. ФУНКЦИИ ПЕЧАТИ ====================
  const sendTypingStatus = async () => {
    if (chat.type !== 'group') return;
    try {
      await fetch('/api/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: chat.id,
          userId: currentUser.id,
          userName: currentUser.fullName
        })
      });
    } catch (error) {
      console.error('Error sending typing status:', error);
    }
  };

  const handleTyping = () => {
    if (chat.type !== 'group') return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(sendTypingStatus, 500);
  };

  const checkTypingStatus = async () => {
    try {
      const response = await fetch(`/api/typing?chatId=${chat.id}`);
      const data = await response.json();
      if (data.typing && data.typing.userId !== currentUser.id) {
        setTypingUser(data.typing);
      } else {
        setTypingUser(null);
      }
    } catch (error) {
      console.error('Error checking typing status:', error);
    }
  };

  // ==================== 5. ФУНКЦИИ ГОЛОСА ====================
  const handleSendVoice = async (audioBlob: Blob, duration: number) => {
    const voiceMessage: Message = {
      id: Date.now().toString(),
      chatId: chat.id,
      userId: currentUser.id,
      userName: currentUser.fullName,
      content: `🎤 Голосовое (${Math.floor(duration / 60)}:${(duration % 60)
        .toString()
        .padStart(2, '0')})`,
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
      if (response.ok) {
        setMessages([...messages, voiceMessage]);
        window.dispatchEvent(
          new CustomEvent('messageSent', {
            detail: { chatId: chat.id, message: voiceMessage }
          })
        );
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
    }
  };

  const handleSendVideo = () => alert('Видеосообщения скоро будут');
  const handleCancelRecording = () => setIsRecording(false);

  // ==================== 6. ФУНКЦИИ ГРУПП ====================
    const handleOpenGroupInfo = () => chat.type === 'group' && setShowGroupInfo(true);
  const handleAddParticipants = () => {
    setShowGroupInfo(false);
    setShowAddParticipants(true);
  };
  const handleParticipantsAdded = () => {
    setShowAddParticipants(false);
    loadMessages();
  };
  const handleLeaveGroup = () => console.log('Leave group:', chat.id);
  const handleDeleteGroup = () => console.log('Delete group:', chat.id);

  // ==================== 7. ВСПОМОГАТЕЛЬНЫЕ ====================
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Сегодня';
    const yesterday = new Date(today.setDate(today.getDate() - 1));
    if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
    return date.toLocaleDateString('ru-RU');
  };

  const groupedMessages: { [key: string]: Message[] } = {};
  messages.forEach((msg) => {
    const date = formatDate(msg.createdAt);
    if (!groupedMessages[date]) groupedMessages[date] = [];
    groupedMessages[date].push(msg);
  });

  // ==================== 8. JSX ====================
  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] rounded-2xl border border-white/5">
      {/* Шапка */}
      <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            {chat.type === 'group' ? (
              <Users size={18} className="text-white" />
            ) : (
              <MessageCircle size={18} className="text-white" />
            )}
          </div>
          <div
            className={chat.type === 'group' ? 'cursor-pointer' : ''}
            onClick={handleOpenGroupInfo}
          >
            <h3 className="font-medium text-white">{chat.name}</h3>
            {chat.type === 'group' && typingUser ? (
              <p className="text-xs text-blue-400">
                {typingUser.userName} печатает...
              </p>
            ) : (
              <p className="text-xs text-zinc-500">
                {chat.type === 'group'
                  ? `${chat.participants?.length || 0} участников`
                  : 'online'}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onDeleteChat && (
            <button
              onClick={() => onDeleteChat(chat.id)}
              className="p-2 hover:bg-red-500/10 rounded-lg"
            >
              <Trash2 size={18} className="text-red-400" />
            </button>
          )}
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg">
            <X size={20} className="text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Сообщения */}
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
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className="p-4 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <button className="p-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl">
            <Paperclip size={20} className="text-green-400" />
          </button>
          <button className="p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl">
            <Image size={20} className="text-purple-400" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Написать сообщение..."
            className="flex-1 bg-[#1a1a1a] rounded-xl px-4 py-3 text-sm border border-white/5 outline-none focus:border-blue-500 text-white"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="p-3 bg-blue-500 hover:bg-blue-600 rounded-xl disabled:opacity-50"
          >
            <Send size={20} className="text-white" />
          </button>
          <VoiceRecorder
            onSendVoice={handleSendVoice}
            onSendVideo={handleSendVideo}
            onCancel={handleCancelRecording}
          />
        </div>
      </div>

      {/* Модалки */}
      {chat.type === 'group' && (
        <>
          <GroupInfoModal
            isOpen={showGroupInfo}
            onClose={() => setShowGroupInfo(false)}
            chat={chat}
            currentUser={currentUser}
            onAddParticipants={handleAddParticipants}
            onLeaveGroup={handleLeaveGroup}
            onDeleteGroup={handleDeleteGroup}
          />
          <AddParticipantsModal
            isOpen={showAddParticipants}
            onClose={() => setShowAddParticipants(false)}
            groupChat={chat}
            currentUser={currentUser}
            onParticipantsAdded={handleParticipantsAdded}
          />
        </>
      )}
    </div>
  );
}

// ==================== 9. КОМПОНЕНТ СООБЩЕНИЯ ====================
function MessageItem({
  msg,
  index,
  msgs,
  currentUser,
  formatTime
}: any) {
  const isMe = msg.userId === currentUser.id;
  const isSystem = msg.userId === 'system';
  const showAvatar = index === 0 || msgs[index - 1]?.userId !== msg.userId;

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <span className="px-4 py-2 bg-black/30 rounded-full text-xs text-zinc-500">
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
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
          <div
            className={`
              px-4 py-2 rounded-2xl
              ${
                isMe
                  ? 'bg-blue-500 text-white rounded-tr-none'
                  : 'bg-[#1a1a1a] text-white rounded-tl-none'
              }
            `}
          >
            <p className="text-sm break-words">{msg.content}</p>
          </div>
          <div
            className={`
              flex items-center gap-1 mt-1 text-[10px] text-zinc-600
              ${isMe ? 'justify-end' : 'justify-start'}
            `}
          >
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