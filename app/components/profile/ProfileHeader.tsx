"use client";
import React, { useState } from 'react';
import { Camera, MapPin, Globe, Calendar, Heart, MessageCircle, Eye, X, Trash2, Grid } from 'lucide-react';

interface ProfileHeaderProps {
  user: any;
  onUpdate: (updatedUser: any) => void;
  themeColor: string;
}

export default function ProfileHeader({ user, onUpdate, themeColor }: ProfileHeaderProps) {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarLikes, setAvatarLikes] = useState(0);
  const [avatarComments, setAvatarComments] = useState(0);
  const [avatarViews, setAvatarViews] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(user?.fullName || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editWebsite, setEditWebsite] = useState(user?.website || '');
  const [editLocation, setEditLocation] = useState(user?.location || '');
  const [editBirthday, setEditBirthday] = useState(user?.birthday || '');
  const [editGender, setEditGender] = useState(user?.gender || '');
  const [showBirthday, setShowBirthday] = useState(user?.settings?.showBirthday !== false);
  const [activeProfileTab, setActiveProfileTab] = useState<'posts' | 'reels' | 'saved'>('posts');

  const handleAvatarUpload = async (file: File) => {
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);

      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = { ...user, avatarUrl: data.avatarUrl };
        onUpdate(updatedUser);
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
      } else {
        alert('Ошибка загрузки: ' + data.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Не удалось загрузить аватар');
    } finally {
      setIsUploadingAvatar(false);
      setShowAvatarModal(false);
      setAvatarPreview(null);
    }
  };

  const handleAvatarDelete = async () => {
    if (!user?.avatarUrl) return;

    try {
      const response = await fetch(
        `/api/upload/avatar?userId=${user.id}&avatarUrl=${encodeURIComponent(user.avatarUrl)}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        const updatedUser = { ...user, avatarUrl: null };
        onUpdate(updatedUser);
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Не удалось удалить аватар');
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    handleAvatarUpload(file);
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          fullName: editName,
          bio: editBio,
          website: editWebsite,
          location: editLocation,
          birthday: editBirthday,
          gender: editGender,
          settings: { ...user.settings, showBirthday }
        })
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = { ...user, ...data.user };
        onUpdate(updatedUser);
        localStorage.setItem('current_user', JSON.stringify(updatedUser));
        setShowEditProfile(false);
      } else {
        alert('Ошибка сохранения: ' + data.error);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Не удалось сохранить профиль');
    }
  };

  return (
    <>
      {/* Шапка профиля с обложкой */}
      <div className="h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl relative overflow-hidden mb-16">
        <div className="absolute inset-0 bg-black/20" />
        <button className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-colors">
          <Camera size={16} />
          <span>Изменить обложку</span>
        </button>
      </div>

      {/* Аватар и основная информация */}
      <div className="flex items-start gap-6 -mt-24 px-4">
        <div className="relative">
          <div
            onClick={() => setShowAvatarModal(true)}
            className="w-28 h-28 rounded-full border-4 border-black shadow-2xl flex items-center justify-center overflow-hidden cursor-pointer group relative"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-4xl">
                  {user?.fullName?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={24} className="text-white" />
            </div>
          </div>
          {isUploadingAvatar && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white" />
            </div>
          )}
        </div>

        <div className="flex-1 mt-9">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{user?.fullName}</h1>
              <p className="text-zinc-400 text-sm mt-0.5">@{user?.nickname}</p>
            </div>
            <button
              onClick={() => setShowEditProfile(true)}
              className="px-5 py-2 rounded-xl text-sm font-medium transition-colors text-white hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              Редактировать профиль
            </button>
          </div>

          <p className="text-zinc-300 text-sm mt-3">{user?.bio || 'Расскажите о себе'}</p>

          {(user?.location || user?.website || (user?.birthday && user?.settings?.showBirthday)) && (
            <div className="flex flex-col gap-2 mt-4 text-sm text-zinc-400">
              {user?.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span>{user.location}</span>
                </div>
              )}
              {user?.website && (
                <div className="flex items-center gap-2">
                  <Globe size={14} />
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    {user.website.replace('https://', '')}
                  </a>
                </div>
              )}
              {user?.birthday && user?.settings?.showBirthday && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>{new Date(user.birthday).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-5 mt-4">
            <div>
              <span className="font-bold">0</span>
              <span className="text-zinc-500 text-xs ml-1">публикации</span>
            </div>
            <div>
              <span className="font-bold">0</span>
              <span className="text-zinc-500 text-xs ml-1">подписчики</span>
            </div>
            <div>
              <span className="font-bold">0</span>
              <span className="text-zinc-500 text-xs ml-1">подписки</span>
            </div>
          </div>
        </div>
      </div>

      {/* Табы профиля (Instagram стиль) */}
      <div className="flex justify-center gap-12 mt-8 border-t border-white/5 pt-4">
        <button
          onClick={() => setActiveProfileTab('posts')}
          className={`flex items-center gap-2 py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeProfileTab === 'posts'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-zinc-500 hover:text-white'
          }`}
        >
          <Grid size={18} />
          <span>Публикации</span>
        </button>
        <button
          onClick={() => setActiveProfileTab('reels')}
          className={`flex items-center gap-2 py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeProfileTab === 'reels'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-zinc-500 hover:text-white'
          }`}
        >
          <span className="text-xl">🎥</span>
          <span>Reels</span>
        </button>
        <button
          onClick={() => setActiveProfileTab('saved')}
          className={`flex items-center gap-2 py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeProfileTab === 'saved'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-zinc-500 hover:text-white'
          }`}
        >
          <span className="text-xl">🔖</span>
          <span>Сохраненное</span>
        </button>
      </div>

      {/* Модалка аватара */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col lg:flex-row bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <button
              onClick={() => setShowAvatarModal(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors flex items-center justify-center"
            >
              <X size={20} className="text-white" />
            </button>

            <div className="lg:w-2/3 bg-black flex items-center justify-center p-4 lg:p-8">
              <div className="relative w-full max-h-[70vh] flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
                ) : (
                  <div className="w-64 h-64 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-black text-8xl">
                      {user?.fullName?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:w-1/3 bg-[#0a0a0a] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col">
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-xl">
                        {user?.fullName?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{user?.fullName}</h3>
                    <p className="text-sm text-zinc-500">@{user?.nickname}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  <label className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Camera size={18} className="text-blue-400" />
                    </div>
                    <span className="text-xs">Загрузить</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarSelect}
                      disabled={isUploadingAvatar}
                    />
                  </label>

                  {user?.avatarUrl && (
                    <button
                      onClick={handleAvatarDelete}
                      className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Trash2 size={18} className="text-red-400" />
                      </div>
                      <span className="text-xs">Удалить</span>
                    </button>
                  )}
                </div>

                <div className="bg-white/5 rounded-xl p-5 space-y-4">
                  <h4 className="font-medium text-sm uppercase tracking-wider text-zinc-400">Статистика</h4>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Eye size={16} className="text-blue-400" />
                      </div>
                      <span className="text-sm">Просмотры</span>
                    </div>
                    <span className="font-bold">{avatarViews}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Heart size={16} className="text-red-400" />
                      </div>
                      <span className="text-sm">Лайки</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{avatarLikes}</span>
                      <button
                        onClick={() => {
                          setIsLiked(!isLiked);
                          setAvatarLikes(prev => isLiked ? prev - 1 : prev + 1);
                        }}
                        className={`p-1.5 rounded-full transition-colors ${isLiked ? 'text-red-500' : 'text-zinc-500 hover:text-red-500'}`}
                      >
                        <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <MessageCircle size={16} className="text-green-400" />
                      </div>
                      <span className="text-sm">Комментарии</span>
                    </div>
                    <span className="font-bold">{avatarComments}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модалка редактирования профиля */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] rounded-2xl p-5 w-full max-w-md border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#111] pt-1 z-10">
              <h2 className="text-xl font-bold" style={{ color: themeColor }}>Редактировать профиль</h2>
              <button onClick={() => setShowEditProfile(false)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                <X size={18} className="text-zinc-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Имя</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-black/50 rounded-xl px-3 py-2.5 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors"
                  maxLength={50}
                />
                <p className="text-[10px] text-zinc-600 text-right mt-0.5">{editName.length}/50</p>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">О себе</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={2}
                  className="w-full bg-black/50 rounded-xl px-3 py-2.5 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors resize-none"
                  maxLength={150}
                />
                <p className="text-[10px] text-zinc-600 text-right mt-0.5">{editBio.length}/150</p>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Веб-сайт</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">https://</span>
                  <input
                    type="text"
                    value={editWebsite.replace('https://', '')}
                    onChange={(e) => setEditWebsite(`https://${e.target.value}`)}
                    className="w-full bg-black/50 rounded-xl pl-16 pr-3 py-2.5 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors"
                    placeholder="ваш-сайт.ру"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Местоположение</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full bg-black/50 rounded-xl pl-9 pr-3 py-2.5 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors"
                    placeholder="Город, страна"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Дата рождения</label>
                <input
                  type="date"
                  value={editBirthday}
                  onChange={(e) => setEditBirthday(e.target.value)}
                  className="w-full bg-black/50 rounded-xl px-3 py-2.5 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors"
                />
                <div className="flex items-center justify-between mt-2 p-2 bg-black/30 rounded-lg">
                  <div className="flex-1">
                    <p className="text-xs font-medium">Показывать дату рождения</p>
                    <p className="text-[10px] text-zinc-500">{showBirthday ? 'Видна всем' : 'Только вы'}</p>
                  </div>
                  <button
                    onClick={() => setShowBirthday(!showBirthday)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${showBirthday ? '' : 'bg-zinc-700'}`}
                    style={{ backgroundColor: showBirthday ? themeColor : undefined }}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${showBirthday ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Пол</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full bg-black/50 rounded-xl px-3 py-2.5 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">Не указан</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                  <option value="other">Другой</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 sticky bottom-0 bg-[#111] pb-1">
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors text-white hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: themeColor }}
                >
                  Сохранить
                </button>
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}