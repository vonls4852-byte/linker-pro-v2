"use client";
import React, { useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import { CreateGroupModalProps } from './types';

export default function CreateGroupModal({
  isOpen,
  onClose,
  currentUser,
  onGroupCreated
}: CreateGroupModalProps) {
  // ==================== 1. СОСТОЯНИЯ ====================
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // ==================== 2. ПОИСК ПОЛЬЗОВАТЕЛЕЙ ====================
  const searchFriends = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/users?search=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      if (data.users) {
        const friends = data.users.filter(
          (user: any) =>
            user.id !== currentUser.id &&
            !selectedUsers.some((u) => u.id === user.id)
        );
        setSearchResults(friends);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== 3. УПРАВЛЕНИЕ ВЫБРАННЫМИ ====================
  const addUser = (user: any) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchResults(searchResults.filter((u) => u.id !== user.id));
    setSearchQuery('');
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  // ==================== 4. СОЗДАНИЕ ГРУППЫ ====================
  const createGroup = () => {
    if (selectedUsers.length < 1) {
      alert('Добавьте хотя бы одного участника');
      return;
    }

    const groupData = {
      id: `group_${Date.now()}`,
      name: groupName.trim() || `Группа ${selectedUsers.length + 1}`,
      type: 'group',
      participants: [currentUser.id, ...selectedUsers.map((u) => u.id)],
      createdBy: currentUser.id,
      admins: [currentUser.id],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      unreadCount: 0,
      lastMessage: undefined,
      avatar: null
    };

    onGroupCreated(groupData);
    onClose();
    setGroupName('');
    setSelectedUsers([]);
    setSearchQuery('');
  };

  // ==================== 5. JSX ====================
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md border border-white/10">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-500">Создать группу</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded-lg"
          >
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        {/* Название группы */}
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Название группы (необязательно)"
          className="w-full bg-black/50 rounded-xl px-4 py-3 mb-4 text-sm border border-white/5 outline-none focus:border-blue-500"
        />

        {/* Поиск участников */}
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchFriends()}
            placeholder="Поиск пользователей..."
            className="w-full bg-black/50 rounded-xl pl-10 pr-4 py-3 text-sm border border-white/5 outline-none focus:border-blue-500"
          />
        </div>

        {/* Выбранные участники */}
        {selectedUsers.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-zinc-500 mb-2">
              Выбрано: {selectedUsers.length}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-1 bg-blue-500/20 rounded-full pl-2 pr-1 py-1"
                >
                  <span className="text-xs text-white">
                    {user.fullName || user.nickname}
                  </span>
                  <button
                    onClick={() => removeUser(user.id)}
                    className="p-1 hover:bg-blue-500/30 rounded-full"
                  >
                    <X size={12} className="text-blue-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Результаты поиска */}
        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
            {searchResults.map((user) => (
              <div
                key={user.id}
                onClick={() => addUser(user)}
                className="flex items-center gap-3 p-2 bg-black/30 hover:bg-black/50 rounded-xl cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {user.fullName?.charAt(0) || user.nickname?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">
                    {user.fullName || user.nickname}
                  </p>
                  <p className="text-xs text-zinc-500">@{user.nickname}</p>
                </div>
                <Check size={18} className="text-blue-400" />
              </div>
            ))}
          </div>
        )}

        {/* Кнопка создания */}
        <button
          onClick={createGroup}
          disabled={selectedUsers.length === 0}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium disabled:opacity-50"
        >
          Создать группу ({selectedUsers.length + 1} участников)
        </button>
      </div>
    </div>
  );
}