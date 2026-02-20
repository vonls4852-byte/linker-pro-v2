"use client";
import React, { useState, useEffect } from 'react';
import { UserPlus, UserMinus, MessageCircle, Search, X, Check, Bell } from 'lucide-react';

interface FriendsListProps {
  currentUser: any;
}

export default function FriendsList({ currentUser }: FriendsListProps) {
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'sent' | 'search'>('friends');
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Загрузка данных
  useEffect(() => {
    loadFriends();
    loadFriendRequests();
    loadSentRequests();
  }, [currentUser]);

  const loadFriends = async () => {
    try {
      const response = await fetch(`/api/friends?userId=${currentUser.id}`);
      const data = await response.json();
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await fetch(`/api/friends?userId=${currentUser.id}&type=requests`);
      const data = await response.json();
      setFriendRequests(data.requests || []);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const loadSentRequests = () => {
    const saved = localStorage.getItem(`sent_requests_${currentUser.id}`);
    if (saved) {
      setSentRequests(JSON.parse(saved));
    } else {
      setSentRequests([]);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    
    try {
      const response = await fetch(`/api/users?search=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.users) {
        const currentUserId = currentUser.id;
        const results = data.users.filter((user: any) => 
          user.id !== currentUserId &&
          !friends.some(f => f.id === user.id) &&
          !sentRequests.some(r => r.toUserId === user.id)
        );
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: string, userName: string, userNickname: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: currentUser.id,
          toUserId: userId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const newRequest = {
          id: data.request.id,
          toUserId: userId,
          toUserName: userName,
          toUserNickname: userNickname,
          status: 'pending',
          createdAt: Date.now()
        };
        
        const updatedSent = [...sentRequests, newRequest];
        setSentRequests(updatedSent);
        localStorage.setItem(`sent_requests_${currentUser.id}`, JSON.stringify(updatedSent));
        setSearchResults(prev => prev.filter(u => u.id !== userId));
      }
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  const acceptRequest = async (requestId: string, fromUserId: string, fromUserName: string, fromUserNickname: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          requestId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setFriendRequests(prev => prev.filter(r => r.id !== requestId));
        const newFriend = {
          id: fromUserId,
          name: fromUserName,
          nickname: fromUserNickname,
          avatar: null,
          addedAt: Date.now()
        };
        setFriends(prev => [...prev, newFriend]);
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/friends', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          requestId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const cancelSentRequest = (requestId: string) => {
    const updatedRequests = sentRequests.filter(r => r.id !== requestId);
    setSentRequests(updatedRequests);
    localStorage.setItem(`sent_requests_${currentUser.id}`, JSON.stringify(updatedRequests));
  };

  const removeFriend = async (friendId: string, friendName: string) => {
    if (confirm(`Удалить ${friendName} из друзей?`)) {
      try {
        const response = await fetch('/api/friends', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'remove',
            userId: currentUser.id,
            friendId
          })
        });

        const data = await response.json();
        
        if (data.success) {
          setFriends(prev => prev.filter(f => f.id !== friendId));
        }
      } catch (error) {
        console.error('Error removing friend:', error);
      }
    }
  };

  // Создать чат с другом
  const startChat = (friendId: string, friendName: string) => {
    // Создаём событие для переключения на чат
    const event = new CustomEvent('startChat', { 
      detail: { 
        userId: friendId,
        userName: friendName 
      } 
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Шапка */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-blue-500">Друзья</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('search')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <UserPlus size={16} />
            <span>Найти друзей</span>
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#111] rounded-2xl p-5 border border-white/5">
          <p className="text-3xl font-bold">{friends.length}</p>
          <p className="text-sm text-zinc-500 mt-1">друзей</p>
        </div>
        <div className="bg-[#111] rounded-2xl p-5 border border-white/5">
          <p className="text-3xl font-bold">{friendRequests.length}</p>
          <p className="text-sm text-zinc-500 mt-1">входящие</p>
        </div>
        <div className="bg-[#111] rounded-2xl p-5 border border-white/5">
          <p className="text-3xl font-bold">{sentRequests.length}</p>
          <p className="text-sm text-zinc-500 mt-1">отправленные</p>
        </div>
        <div className="bg-[#111] rounded-2xl p-5 border border-white/5">
          <p className="text-3xl font-bold">{friends.filter(f => onlineUsers.includes(f.id)).length}</p>
          <p className="text-sm text-zinc-500 mt-1">онлайн</p>
        </div>
      </div>

      {/* Табы */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'friends' ? 'bg-blue-500 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Мои друзья ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'requests' ? 'bg-blue-500 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Входящие ({friendRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'sent' ? 'bg-blue-500 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Отправленные ({sentRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            activeTab === 'search' ? 'bg-blue-500 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Поиск
        </button>
      </div>

      {/* Контент */}
      <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
        {activeTab === 'friends' && (
          <>
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus size={48} className="mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-400">У вас пока нет друзей</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm transition-colors"
                >
                  Найти друзей
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map(friend => (
                  <div key={friend.id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {friend.name ? friend.name.charAt(0).toUpperCase() : '?'}
                          </span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${
                          onlineUsers.includes(friend.id) ? 'bg-green-500' : 'bg-gray-500'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-white">{friend.name || 'Пользователь'}</p>
                        <p className="text-xs text-zinc-500">@{friend.nickname || 'unknown'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startChat(friend.id, friend.name || friend.nickname)}
                        className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="Написать сообщение"
                      >
                        <MessageCircle size={18} className="text-blue-400" />
                      </button>
                      <button
                        onClick={() => removeFriend(friend.id, friend.name || 'Пользователь')}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Удалить из друзей"
                      >
                        <UserMinus size={18} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'requests' && (
          <>
            {friendRequests.length === 0 ? (
              <div className="text-center py-12">
                <Bell size={48} className="mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-400">Нет входящих заявок</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friendRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {request.fromUserName ? request.fromUserName.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{request.fromUserName || 'Пользователь'}</p>
                        <p className="text-xs text-zinc-500">@{request.fromUserNickname || 'unknown'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRequest(request.id, request.fromUserId, request.fromUserName, request.fromUserNickname)}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                      >
                        <Check size={18} className="text-green-400" />
                      </button>
                      <button
                        onClick={() => rejectRequest(request.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                      >
                        <X size={18} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'sent' && (
          <>
            {sentRequests.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus size={48} className="mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-400">Нет отправленных заявок</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sentRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {request.toUserName ? request.toUserName.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{request.toUserName || 'Пользователь'}</p>
                        <p className="text-xs text-zinc-500">@{request.toUserNickname || 'unknown'}</p>
                        <p className="text-[10px] text-yellow-500 mt-1">Ожидание ответа</p>
                      </div>
                    </div>
                    <button
                      onClick={() => cancelSentRequest(request.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Отменить заявку"
                    >
                      <X size={18} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'search' && (
          <>
            <div className="relative mb-4">
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

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-black/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {user.fullName ? user.fullName.charAt(0).toUpperCase() : 
                           user.nickname ? user.nickname.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.fullName || user.nickname || 'Пользователь'}</p>
                        <p className="text-xs text-zinc-500">@{user.nickname || 'unknown'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => sendFriendRequest(user.id, user.fullName || user.nickname, user.nickname)}
                      className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-sm transition-colors"
                    >
                      Добавить
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}