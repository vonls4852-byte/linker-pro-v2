"use client";
import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, LogOut, Trash2, Crown } from 'lucide-react';

// ==================== ИНТЕРФЕЙСЫ ====================
interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: any;
  currentUser: any;
  onAddParticipants?: () => void;
  onLeaveGroup?: () => void;
  onDeleteGroup?: () => void;
}

// ==================== ОСНОВНОЙ КОМПОНЕНТ ====================
export default function GroupInfoModal({
  isOpen,
  onClose,
  chat,
  currentUser,
  onAddParticipants,
  onLeaveGroup,
  onDeleteGroup
}: GroupInfoModalProps) {
  // ==================== 1. СОСТОЯНИЯ ====================
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  // ==================== 2. ЗАГРУЗКА ДАННЫХ ====================
  useEffect(() => {
    if (chat?.participants) {
      loadParticipants();
    }
  }, [chat]);

  // ==================== 3. ФУНКЦИЯ ЗАГРУЗКИ ====================
  const loadParticipants = async () => {
    setLoading(true);
    try {
      const participantsData = [];
      for (const userId of chat.participants) {
        const response = await fetch(`/api/users?id=${userId}`);
        const data = await response.json();
        if (data.user) {
          participantsData.push(data.user);
        }
      }
      setParticipants(participantsData);
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== 4. ПРОВЕРКА ОТКРЫТИЯ ====================
  if (!isOpen || !chat) return null;

  // ==================== 5. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
  const isCreator = chat.createdBy === currentUser.id;
  const isAdmin = chat.admins?.includes(currentUser.id) || isCreator;

  // ==================== 6. ОБРАБОТЧИКИ ДЕЙСТВИЙ ====================
  const handleAddClick = () => {
    if (onAddParticipants) {
      onAddParticipants();
    }
  };

  const handleLeaveClick = () => {
    setConfirmAction('leave');
  };

  const handleDeleteClick = () => {
    setConfirmAction('delete');
  };

  const handleConfirm = () => {
    if (confirmAction === 'leave' && onLeaveGroup) {
      onLeaveGroup();
    } else if (confirmAction === 'delete' && onDeleteGroup) {
      onDeleteGroup();
    }
    setConfirmAction(null);
  };

  const handleCancelConfirm = () => {
    setConfirmAction(null);
  };

  // ==================== 7. JSX КОМПОНЕНТА ====================
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md border border-white/10">

        {/* Заголовок */}
        <ModalHeader onClose={onClose} />

        {/* Информация о группе */}
        <GroupInfo
          chat={chat}
          isCreator={isCreator}
          participantsCount={participants.length}
        />

        {/* Список участников */}
        <ParticipantsList
          participants={participants}
          loading={loading}
          chat={chat}
          currentUser={currentUser}
          isAdmin={isAdmin}
          onAddClick={handleAddClick}
        />

        {/* Кнопки действий */}
        <ActionButtons
          isAdmin={isAdmin}
          isCreator={isCreator}
          onAddClick={handleAddClick}
          onLeaveClick={handleLeaveClick}
          onDeleteClick={handleDeleteClick}
        />

        {/* Модалка подтверждения */}
        {confirmAction && (
          <ConfirmModal
            action={confirmAction}
            onConfirm={handleConfirm}
            onCancel={handleCancelConfirm}
          />
        )}
      </div>
    </div>
  );
}

// ==================== 6. КОМПОНЕНТ ЗАГОЛОВКА ====================
function ModalHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-blue-500">Информация о группе</h2>
      <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg">
        <X size={20} className="text-zinc-400" />
      </button>
    </div>
  );
}

// ==================== 7. КОМПОНЕНТ ИНФОРМАЦИИ О ГРУППЕ ====================
function GroupInfo({ chat, isCreator, participantsCount }: any) {
  return (
    <div className="mb-6 text-center">
      <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
        <Users size={36} className="text-white" />
      </div>
      <h3 className="text-xl font-bold text-white">{chat.name}</h3>
      <p className="text-sm text-zinc-500 mt-1">
        {participantsCount} участников
      </p>
      {isCreator && (
        <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-yellow-500/20 rounded-full text-xs text-yellow-400">
          <Crown size={12} />
          Создатель
        </span>
      )}
    </div>
  );
}

// ==================== 8. КОМПОНЕНТ СПИСКА УЧАСТНИКОВ ====================
function ParticipantsList({ participants, loading, chat, currentUser, isAdmin, onAddClick }: {
  participants: any[];
  loading: boolean;
  chat: any;
  currentUser: any;
  isAdmin: boolean;
  onAddClick: () => void;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-zinc-400">Участники</h4>
        {isAdmin && (
          <button
            onClick={onAddClick}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <UserPlus size={14} />
            Добавить
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {loading ? (
          <LoadingState />
        ) : participants.length > 0 ? (
          participants.map(user => (
            <ParticipantItem
              key={user.id}
              user={user}
              chat={chat}
              currentUser={currentUser}
              isAdmin={isAdmin}
            />
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

// ==================== 9. КОМПОНЕНТ УЧАСТНИКА ====================
function ParticipantItem({ user, chat, currentUser, isAdmin }: {
  user: any;
  chat: any;
  currentUser: any;
  isAdmin: boolean;
}) {
  const isCreator = chat.createdBy === user.id;
  const isCurrentUser = user.id === currentUser.id;
  const isUserAdmin = chat.admins?.includes(user.id);

  return (
    <div className="flex items-center justify-between p-2 bg-black/30 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">
            {user.fullName?.charAt(0) || user.nickname?.charAt(0) || '?'}
          </span>
        </div>
        <div>
          <p className="font-medium text-white flex items-center gap-2">
            {user.fullName || user.nickname}
            {isCurrentUser && <span className="text-xs text-zinc-500">(вы)</span>}
            {isCreator && <Crown size={12} className="text-yellow-400" />}
            {isUserAdmin && !isCreator && (
              <span className="text-xs text-blue-400">админ</span>
            )}
          </p>
          <p className="text-xs text-zinc-500">@{user.nickname}</p>
        </div>
      </div>
    </div>
  );
}

// ==================== 10. КОМПОНЕНТ ЗАГРУЗКИ ====================
function LoadingState() {
  return (
    <div className="text-center py-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      <p className="text-xs text-zinc-500 mt-2">Загрузка...</p>
    </div>
  );
}

// ==================== 11. КОМПОНЕНТ ПУСТОГО СОСТОЯНИЯ ====================
function EmptyState() {
  return (
    <p className="text-center text-zinc-500 py-4">
      Нет участников
    </p>
  );
}

// ==================== 12. КОМПОНЕНТ КНОПОК ДЕЙСТВИЙ ====================
function ActionButtons({ isAdmin, isCreator, onAddClick, onLeaveClick, onDeleteClick }: any) {
  return (
    <div className="space-y-2">
      {isAdmin && (
        <button
          onClick={onAddClick}
          className="w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl text-blue-400 font-medium transition-colors flex items-center justify-center gap-2"
        >
          <UserPlus size={18} />
          Добавить участников
        </button>
      )}

      <button
        onClick={onLeaveClick}
        className="w-full py-3 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-xl text-yellow-400 font-medium transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={18} />
        {isCreator ? 'Передать создание и выйти' : 'Выйти из группы'}
      </button>

      {isCreator && (
        <button
          onClick={onDeleteClick}
          className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400 font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={18} />
          Удалить группу
        </button>
      )}
    </div>
  );
}

// ==================== 13. КОМПОНЕНТ ПОДТВЕРЖДЕНИЯ ====================
function ConfirmModal({ action, onConfirm, onCancel }: any) {
  const messages = {
    leave: {
      title: 'Выйти из группы?',
      text: 'Вы перестанете получать сообщения от этой группы',
      confirmText: 'Выйти',
      color: 'yellow'
    },
    delete: {
      title: 'Удалить группу?',
      text: 'Это действие нельзя отменить. Все сообщения будут удалены.',
      confirmText: 'Удалить',
      color: 'red'
    }
  };

  const msg = messages[action as keyof typeof messages];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-[#111] rounded-2xl p-6 w-full max-w-sm border border-white/10">
        <h3 className="text-lg font-bold text-white mb-2">{msg.title}</h3>
        <p className="text-sm text-zinc-400 mb-6">{msg.text}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 bg-${msg.color}-500/20 hover:bg-${msg.color}-500/30 rounded-lg text-${msg.color}-400 font-medium transition-colors`}
          >
            {msg.confirmText}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white font-medium transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}