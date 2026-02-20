"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Image, Mic, X, CheckCheck, MessageCircle, Trash2 } from 'lucide-react';
import { Chat, Message, ChatWindowProps } from './types';
import VoiceRecorder from './VoiceRecorder';

export default function ChatWindow({ chat, currentUser, onClose, onDeleteChat }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Загрузка сообщений
  useEffect(() => {
    if (chat?.id) {
      loadMessages();
    }
  }, [chat?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/messages?chatId=${chat.id}`);
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        updateLastMessage(chat.id, message);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const updateLastMessage = (chatId: string, message: Message) => {
    // Обновляем для текущего пользователя
    const userChats = JSON.parse(localStorage.getItem(`chats_${currentUser.id}`) || '[]');
    const updatedUserChats = userChats.map((c: Chat) => {
      if (c.id === chatId) {
        return { ...c, lastMessage: message, updatedAt: Date.now() };
      }
      return c;
    });
    localStorage.setItem(`chats_${currentUser.id}`, JSON.stringify(updatedUserChats));

    // Обновляем для собеседника
    const otherParticipantId = chat.participants.find(id => id !== currentUser.id);
    if (otherParticipantId) {
      const otherChats = JSON.parse(localStorage.getItem(`chats_${otherParticipantId}`) || '[]');
      const updatedOtherChats = otherChats.map((c: Chat) => {
        if (c.participants.includes(currentUser.id)) {
          return {
            ...c,
            lastMessage: message,
            updatedAt: Date.now(),
            unreadCount: (c.unreadCount || 0) + 1
          };
        }
        return c;
      });
      localStorage.setItem(`chats_${otherParticipantId}`, JSON.stringify(updatedOtherChats));
    }
  };

  const handleSendVoice = (audioBlob: Blob, duration: number) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    
    const voiceMessage: Message = {
      id: Date.now().toString(),
      chatId: chat.id,
      userId: currentUser.id,
      userName: currentUser.fullName,
      content: `🎤 Голосовое сообщение (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`,
      createdAt: Date.now(),
      read: false,
      type: 'voice',
      fileUrl: audioUrl
    };

    setMessages([...messages, voiceMessage]);
    updateLastMessage(chat.id, voiceMessage);
  };

  const handleSendVideo = () => {
    alert('Режим видеосообщений будет доступен в следующем обновлении');
  };

  const handleCancelRecording = () => {
    setIsRecording(false);
  };

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

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] rounded-2xl border border-white/5">
      {/* Шапка чата */}
      <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <MessageCircle size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-medium text-white">{chat.name}</h3>
            <p className="text-xs text-zinc-500">online</p>
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
              {msgs.map((msg, index) => {
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
                          {msg.type === 'voice' ? (
                            <div className="flex items-center gap-2">
                              <button className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                              </button>
                              <span className="text-sm">{msg.content}</span>
                            </div>
                          ) : (
                            <p className="text-sm break-words">{msg.content}</p>
                          )}
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
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Индикатор печатает */}
      {isTyping && (
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
      )}

      {/* Поле ввода */}
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
            onSendVoice={handleSendVoice}
            onSendVideo={handleSendVideo}
            onCancel={handleCancelRecording}
          />
        </div>
      </div>
    </div>
  );
}