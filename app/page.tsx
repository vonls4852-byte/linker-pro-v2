"use client";
// ==================== 1. ИМПОРТЫ ====================
import { useState, useEffect } from 'react';
import AuthScreen from './components/auth/AuthScreen';
import ProfileHeader from './components/profile/ProfileHeader';
import Feed from './components/feed/Feed';
import { 
  Grid, Heart, MessageCircle, User, UserPlus, Settings, LogOut, 
  Send, Plus, X, Camera 
} from 'lucide-react';
import FriendsList from './components/friends/FriendsList';
import ChatList from './components/chat/ChatList';
import ChatWindow from './components/chat/ChatWindow';

// ==================== 2. ТИПЫ ====================
type TabType = 'profile' | 'friends' | 'chat' | 'feed' | 'settings';

// ==================== 3. ОСНОВНОЙ КОМПОНЕНТ ====================
export default function Home() {
  // ==================== 3.1 СОСТОЯНИЯ ====================
  
  // Авторизация
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedUsers, setSavedUsers] = useState<any[]>([]);

  // Навигация
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Посты
  const [posts, setPosts] = useState<any[]>([]);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);

  // Чаты
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [leftColumnWidth, setLeftColumnWidth] = useState(30);
  const [isDragging, setIsDragging] = useState(false);

  // Модалки
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // ==================== 3.2 ЗАГРУЗКА ДАННЫХ ====================
  useEffect(() => {
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    const saved = localStorage.getItem('saved_accounts');
    if (saved) {
      setSavedUsers(JSON.parse(saved));
    }

    setIsLoading(false);
  }, []);

  // ==================== 3.3 ФУНКЦИИ АВТОРИЗАЦИИ ====================
  const handleAuthSuccess = (user: any) => {
    setCurrentUser(user);
    const updatedSavedUsers = [...savedUsers.filter((u: any) => u.id !== user.id), user];
    setSavedUsers(updatedSavedUsers);
    localStorage.setItem('saved_accounts', JSON.stringify(updatedSavedUsers));
  };

  const handleLogout = () => {
    localStorage.removeItem('current_user');
    setCurrentUser(null);
    setShowLogoutModal(false);
  };

  const handleSwitchAccount = () => {
    setShowLogoutModal(false);
    setShowAccountPicker(true);
  };

  const handleSelectAccount = (user: any) => {
    setCurrentUser(user);
    setShowAccountPicker(false);
    localStorage.setItem('current_user', JSON.stringify(user));
  };

  const handleAddAccount = () => {
    setShowAccountPicker(false);
    setCurrentUser(null);
  };

  const handleRemoveAccount = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSavedUsers = savedUsers.filter((u: any) => u.id !== userId);
    setSavedUsers(updatedSavedUsers);
    localStorage.setItem('saved_accounts', JSON.stringify(updatedSavedUsers));
  };

  // ==================== 3.4 ФУНКЦИИ ДЛЯ ПОСТОВ ====================
  const handlePostImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setNewPostImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const createPost = async () => {
    if (!newPostText.trim() && !newPostImage) return;

    const newPost = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.fullName,
      userNickname: currentUser.nickname,
      userAvatar: currentUser.avatarUrl,
      content: newPostText,
      image: newPostImage,
      likes: [],
      comments: [],
      createdAt: Date.now()
    };

    setPosts([newPost, ...posts]);
    setShowCreatePostModal(false);
    setNewPostText('');
    setNewPostImage(null);
  };

  const handleLikePost = (postId: string) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const hasLiked = post.likes.includes(currentUser.id);
        return {
          ...post,
          likes: hasLiked
            ? post.likes.filter((id: string) => id !== currentUser.id)
            : [...post.likes, currentUser.id]
        };
      }
      return post;
    });
    setPosts(updatedPosts);
  };

  const handleAddComment = (postId: string, commentText: string, comments: any[], setComments: any) => {
    if (!commentText.trim()) return;

    const comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.fullName,
      text: commentText,
      createdAt: Date.now()
    };

    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return { ...post, comments: [...post.comments, comment] };
      }
      return post;
    });
    setPosts(updatedPosts);
    setComments([...comments, comment]);
  };

  const handleSharePost = (type: 'chat' | 'story' | 'copy', postId: string) => {
    switch (type) {
      case 'chat':
        alert('Выберите чат для отправки');
        break;
      case 'story':
        alert('Добавлено в историю');
        break;
      case 'copy':
        navigator.clipboard.writeText(`https://linker.com/post/${postId}`);
        alert('Ссылка скопирована');
        break;
    }
  };

  // ==================== 3.5 ФУНКЦИИ ДЛЯ ПЕРЕТАСКИВАНИЯ ====================
  const startDragging = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDrag = (e: MouseEvent) => {
    if (!isDragging) return;

    const container = document.querySelector('.chats-container');
    if (!container) return;

    const containerWidth = container.clientWidth;
    const mouseX = e.clientX;
    const containerLeft = container.getBoundingClientRect().left;

    let newWidth = ((mouseX - containerLeft) / containerWidth) * 100;
    newWidth = Math.max(20, Math.min(50, newWidth));

    setLeftColumnWidth(newWidth);
  };

  const stopDragging = () => setIsDragging(false);

  // ==================== 3.6 ЭФФЕКТ ДЛЯ ПЕРЕТАСКИВАНИЯ ====================
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', stopDragging);
    } else {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDragging);
    }
    return () => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDragging);
    };
  }, [isDragging]);

  // ==================== 3.7 УСЛОВИЯ ОТОБРАЖЕНИЯ ====================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} themeColor="#3b82f6" />;
  }

  // ==================== 4. JSX ====================
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ===== 4.1 HEADER ===== */}
      <Header 
        currentUser={currentUser} 
        onLogoutClick={() => setShowLogoutModal(true)} 
      />

      {/* ===== 4.2 НАВИГАЦИЯ ===== */}
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {/* ===== 4.3 ОСНОВНОЙ КОНТЕНТ ===== */}
      <MainContent 
        activeTab={activeTab}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        posts={posts}
        setPosts={setPosts}
        setShowCreatePostModal={setShowCreatePostModal}
        handleLikePost={handleLikePost}
        handleAddComment={handleAddComment}
        handleSharePost={handleSharePost}
        selectedChat={selectedChat}
        setSelectedChat={setSelectedChat}
        leftColumnWidth={leftColumnWidth}
        startDragging={startDragging}
      />

      {/* ===== 4.4 МОДАЛКИ ===== */}
      <Modals
        showCreatePostModal={showCreatePostModal}
        setShowCreatePostModal={setShowCreatePostModal}
        newPostText={newPostText}
        setNewPostText={setNewPostText}
        newPostImage={newPostImage}
        setNewPostImage={setNewPostImage}
        handlePostImageSelect={handlePostImageSelect}
        createPost={createPost}
        showAccountPicker={showAccountPicker}
        setShowAccountPicker={setShowAccountPicker}
        showLogoutModal={showLogoutModal}
        setShowLogoutModal={setShowLogoutModal}
        savedUsers={savedUsers}
        currentUser={currentUser}
        onSelectAccount={handleSelectAccount}
        onRemoveAccount={handleRemoveAccount}
        onAddAccount={handleAddAccount}
        onLogout={handleLogout}
        onSwitchAccount={handleSwitchAccount}
      />
    </div>
  );
}

// ==================== 5. КОМПОНЕНТ HEADER ====================
function Header({ currentUser, onLogoutClick }: any) {
  return (
    <header className="h-16 bg-black/80 border-b border-white/5 flex items-center justify-between px-6">
      <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">
        LINKER
      </h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-400">@{currentUser.nickname}</span>
        <button
          onClick={onLogoutClick}
          className="p-2 hover:bg-red-500/10 rounded-xl transition-colors group"
          title="Выйти"
        >
          <LogOut size={20} className="text-zinc-400 group-hover:text-red-400" />
        </button>
      </div>
    </header>
  );
}

// ==================== 6. КОМПОНЕНТ НАВИГАЦИИ ====================
function Navigation({ activeTab, onTabChange }: any) {
  const tabs = [
    { id: 'profile', icon: User, label: 'Профиль' },
    { id: 'friends', icon: UserPlus, label: 'Друзья' },
    { id: 'chat', icon: MessageCircle, label: 'Чаты' },
    { id: 'feed', icon: Heart, label: 'Лента' },
    { id: 'settings', icon: Settings, label: 'Настройки' },
  ];

  return (
    <nav className="flex gap-2 px-6 py-3 border-b border-white/5 bg-black/40 overflow-x-auto">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === id ? 'text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
          }`}
          style={{ backgroundColor: activeTab === id ? '#3b82f6' : 'transparent' }}
        >
          <Icon size={18} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

// ==================== 7. КОМПОНЕНТ ОСНОВНОГО КОНТЕНТА ====================
function MainContent({
  activeTab,
  currentUser,
  setCurrentUser,
  posts,
  setPosts,
  setShowCreatePostModal,
  handleLikePost,
  handleAddComment,
  handleSharePost,
  selectedChat,
  setSelectedChat,
  leftColumnWidth,
  startDragging,
}: any) {
  return (
    <main className="max-w-4xl mx-auto p-6">
      {activeTab === 'profile' && (
        <ProfileSection
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          posts={posts}
          setPosts={setPosts}
          setShowCreatePostModal={setShowCreatePostModal}
          handleLikePost={handleLikePost}
          handleAddComment={handleAddComment}
          handleSharePost={handleSharePost}
        />
      )}

      {activeTab === 'feed' && (
        <Feed currentUser={currentUser} />
      )}

      {activeTab === 'friends' && (
        <FriendsList currentUser={currentUser} />
      )}

      {activeTab === 'chat' && (
        <ChatSection
          currentUser={currentUser}
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
          leftColumnWidth={leftColumnWidth}
          startDragging={startDragging}
        />
      )}

      {activeTab === 'settings' && (
        <ComingSoon title="Настройки" icon={<Settings size={48} />} />
      )}
    </main>
  );
}

// ==================== 8. СЕКЦИЯ ЧАТОВ ====================
function ChatSection({ currentUser, selectedChat, setSelectedChat, leftColumnWidth, startDragging }: any) {
  return (
    <div className="chats-container flex h-[calc(100vh-180px)] -mx-6 relative">
      {/* Левая колонка - список чатов */}
      <div
        className="bg-[#0a0a0a] border-r border-white/5 flex flex-col relative overflow-hidden"
        style={{ width: `${leftColumnWidth}%` }}
      >
        <ChatList
          currentUser={currentUser}
          onSelectChat={setSelectedChat}
          selectedChatId={selectedChat?.id}
        />
      </div>

      {/* Разделитель (перетаскиваемый) */}
      <div
        className="w-1 bg-transparent hover:bg-blue-500/50 cursor-col-resize transition-colors absolute top-0 bottom-0 z-10"
        style={{ left: `${leftColumnWidth}%`, transform: 'translateX(-50%)' }}
        onMouseDown={startDragging}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-white/10 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-1 h-4 bg-white/30 rounded-full mx-px" />
          <div className="w-1 h-4 bg-white/30 rounded-full mx-px" />
        </div>
      </div>

      {/* Правая колонка - окно чата */}
      <div
        className="bg-[#0a0a0a] flex flex-col"
        style={{ width: `${100 - leftColumnWidth}%` }}
      >
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            currentUser={currentUser}
            onClose={() => setSelectedChat(null)}
            onDeleteChat={(chatId: string) => {
              setSelectedChat(null);
              const updatedChats = JSON.parse(localStorage.getItem(`chats_${currentUser.id}`) || '[]')
                .filter((c: any) => c.id !== chatId);
              localStorage.setItem(`chats_${currentUser.id}`, JSON.stringify(updatedChats));
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={64} className="text-zinc-700 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-zinc-400 mb-2">Выберите чат</h3>
              <p className="text-sm text-zinc-600">Начните общение с друзьями</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== 9. СЕКЦИЯ ПРОФИЛЯ ====================
function ProfileSection({
  currentUser,
  setCurrentUser,
  posts,
  setPosts,
  setShowCreatePostModal,
  handleLikePost,
  handleAddComment,
  handleSharePost,
}: any) {
  return (
    <>
      <ProfileHeader
        user={currentUser}
        onUpdate={setCurrentUser}
        themeColor="#3b82f6"
      />

      <div className="flex justify-center my-6">
        <button
          onClick={() => setShowCreatePostModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          <span>Создать пост</span>
        </button>
      </div>

      {posts.length === 0 ? (
        <EmptyPosts />
      ) : (
        <div className="space-y-4 mt-6">
          {posts.map((post: any) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onLike={handleLikePost}
              onAddComment={handleAddComment}
              onShare={handleSharePost}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ==================== 10. ПУСТОЕ СОСТОЯНИЕ ПОСТОВ ====================
function EmptyPosts() {
  return (
    <div className="text-center py-20">
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <Heart size={32} className="text-white" />
      </div>
      <h3 className="text-xl font-medium text-zinc-300 mb-2">Нет постов</h3>
      <p className="text-zinc-500">Создайте свой первый пост</p>
    </div>
  );
}

// ==================== 11. КАРТОЧКА ПОСТА ====================
function PostCard({ post, currentUser, onLike, onAddComment, onShare }: any) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const isLiked = post.likes?.includes(currentUser.id);

  const handleLike = () => {
    onLike(post.id);
  };

  const handleAddComment = () => {
    onAddComment(post.id, newComment, comments, setComments);
    setNewComment('');
  };

  return (
    <div className="bg-[#111] rounded-2xl p-4 border border-white/5 hover:border-blue-500/30 transition-colors">
      {/* Шапка поста */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
          {post.userAvatar ? (
            <img src={post.userAvatar} alt={post.userName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-bold text-lg">
              {post.userName?.charAt(0) || '?'}
            </span>
          )}
        </div>
        <div>
          <p className="font-medium text-white">{post.userName}</p>
          <p className="text-xs text-zinc-500">@{post.userNickname}</p>
        </div>
      </div>

      {/* Текст поста */}
      {post.content && (
        <p className="text-zinc-300 mb-3 whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Фото поста */}
      {post.image && (
        <div className="rounded-xl overflow-hidden mb-3">
          <img src={post.image} alt="Post" className="w-full h-auto" />
        </div>
      )}

      {/* Статистика */}
      <div className="flex items-center gap-4 text-sm text-zinc-500 mb-3">
        <span>{post.likes?.length || 0} лайков</span>
        <span>{post.comments?.length || 0} комментариев</span>
      </div>

      {/* Кнопки действий */}
      <div className="flex items-center gap-4 pt-2 border-t border-white/5">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 transition-colors ${
            isLiked ? 'text-red-500' : 'text-zinc-400 hover:text-red-500'
          }`}
        >
          <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
          <span className="text-sm">Лайк</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-zinc-400 hover:text-blue-500 transition-colors"
        >
          <MessageCircle size={18} />
          <span className="text-sm">Комментировать</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center gap-2 text-zinc-400 hover:text-green-500 transition-colors"
          >
            <Send size={18} />
            <span className="text-sm">Переслать</span>
          </button>

          {showShareMenu && (
            <ShareMenu onShare={onShare} postId={post.id} onClose={() => setShowShareMenu(false)} />
          )}
        </div>
      </div>

      {/* Комментарии */}
      {showComments && (
        <CommentsSection
          comments={comments}
          newComment={newComment}
          setNewComment={setNewComment}
          onAddComment={handleAddComment}
        />
      )}
    </div>
  );
}

// ==================== 12. МЕНЮ ПЕРЕСЫЛКИ ====================
function ShareMenu({ onShare, postId, onClose }: any) {
  return (
    <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
      <div className="p-2 border-b border-white/10">
        <p className="text-xs text-zinc-400">Поделиться</p>
      </div>
      <button
        onClick={() => {
          onShare('chat', postId);
          onClose();
        }}
        className="flex items-center gap-3 w-full p-3 hover:bg-white/5 transition-colors"
      >
        <MessageCircle size={16} className="text-blue-400" />
        <span className="text-sm text-white">В чат</span>
      </button>
      <button
        onClick={() => {
          onShare('story', postId);
          onClose();
        }}
        className="flex items-center gap-3 w-full p-3 hover:bg-white/5 transition-colors border-t border-white/5"
      >
        <span className="text-purple-400 text-lg">✨</span>
        <span className="text-sm text-white">В историю</span>
      </button>
      <button
        onClick={() => {
          onShare('copy', postId);
          onClose();
        }}
        className="flex items-center gap-3 w-full p-3 hover:bg-white/5 transition-colors border-t border-white/5"
      >
        <span className="text-green-400 text-lg">🔗</span>
        <span className="text-sm text-white">Копировать ссылку</span>
      </button>
    </div>
  );
}

// ==================== 13. СЕКЦИЯ КОММЕНТАРИЕВ ====================
function CommentsSection({ comments, newComment, setNewComment, onAddComment }: any) {
  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      {comments.length > 0 && (
        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
          {comments.map((comment: any) => (
            <div key={comment.id} className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {comment.userName?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{comment.userName}</span>
                  <span className="text-xs text-zinc-600">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-zinc-300">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAddComment()}
          placeholder="Напишите комментарий..."
          className="flex-1 bg-black/50 rounded-xl px-4 py-2 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors"
        />
        <button
          onClick={onAddComment}
          disabled={!newComment.trim()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          Отправить
        </button>
      </div>
    </div>
  );
}

// ==================== 14. ЗАГЛУШКА ====================
function ComingSoon({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="text-center py-20 text-zinc-500">
      <div className="mx-auto mb-4 text-zinc-700">{icon}</div>
      <p>{title} (в разработке)</p>
    </div>
  );
}

// ==================== 15. КОМПОНЕНТ МОДАЛОК ====================
function Modals({
  showCreatePostModal,
  setShowCreatePostModal,
  newPostText,
  setNewPostText,
  newPostImage,
  setNewPostImage,
  handlePostImageSelect,
  createPost,
  showAccountPicker,
  setShowAccountPicker,
  showLogoutModal,
  setShowLogoutModal,
  savedUsers,
  currentUser,
  onSelectAccount,
  onRemoveAccount,
  onAddAccount,
  onLogout,
  onSwitchAccount,
}: any) {
  return (
    <>
      {/* Модалка создания поста */}
      {showCreatePostModal && (
        <CreatePostModal
          newPostText={newPostText}
          setNewPostText={setNewPostText}
          newPostImage={newPostImage}
          setNewPostImage={setNewPostImage}
          handlePostImageSelect={handlePostImageSelect}
          createPost={createPost}
          onClose={() => {
            setShowCreatePostModal(false);
            setNewPostText('');
            setNewPostImage(null);
          }}
        />
      )}

      {/* Модалка смены аккаунта */}
      {showAccountPicker && (
        <AccountPickerModal
          savedUsers={savedUsers}
          onSelectAccount={onSelectAccount}
          onRemoveAccount={onRemoveAccount}
          onAddAccount={onAddAccount}
          onClose={() => setShowAccountPicker(false)}
        />
      )}

      {/* Модалка выхода */}
      {showLogoutModal && (
        <LogoutModal
          currentUser={currentUser}
          onLogout={onLogout}
          onSwitchAccount={onSwitchAccount}
          onClose={() => setShowLogoutModal(false)}
        />
      )}
    </>
  );
}

// ==================== 16. МОДАЛКА СОЗДАНИЯ ПОСТА ====================
function CreatePostModal({
  newPostText,
  setNewPostText,
  newPostImage,
  setNewPostImage,
  handlePostImageSelect,
  createPost,
  onClose,
}: any) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] rounded-2xl p-6 w-full max-w-lg border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-blue-500">Создать пост</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        <div className="space-y-4">
          <textarea
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            placeholder="Что у вас нового?"
            rows={4}
            className="w-full bg-black/50 rounded-xl px-4 py-3 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors resize-none"
          />

          {newPostImage && (
            <div className="relative rounded-xl overflow-hidden">
              <img src={newPostImage} alt="Preview" className="w-full h-48 object-cover" />
              <button
                onClick={() => setNewPostImage(null)}
                className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 rounded-lg transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <label className="flex-1 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <Camera size={16} className="text-purple-400" />
              <span>Добавить фото</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePostImageSelect}
              />
            </label>

            <button
              onClick={createPost}
              disabled={!newPostText.trim() && !newPostImage}
              className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Опубликовать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== 17. МОДАЛКА ВЫБОРА АККАУНТА ====================
function AccountPickerModal({
  savedUsers,
  onSelectAccount,
  onRemoveAccount,
  onAddAccount,
  onClose,
}: any) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md border border-white/10">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-500">Сменить аккаунт</h2>
        <div className="space-y-3 mb-6">
          {savedUsers.length > 0 ? (
            savedUsers.map((user: any) => (
              <div
                key={user.id}
                onClick={() => onSelectAccount(user)}
                className="flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 rounded-xl cursor-pointer transition-all group relative"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{user.fullName || 'Пользователь'}</p>
                  <p className="text-sm text-zinc-500">@{user.nickname}</p>
                </div>
                <button
                  onClick={(e) => onRemoveAccount(user.id, e)}
                  className="p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 rounded-lg"
                >
                  <LogOut size={16} className="text-red-400" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-zinc-500 py-4">Нет сохраненных аккаунтов</p>
          )}
        </div>
        <button
          onClick={onAddAccount}
          className="w-full py-3 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 text-white hover:opacity-90 active:scale-95 bg-blue-500"
        >
          <User size={18} />
          <span>Войти в другой аккаунт</span>
        </button>
        <button
          onClick={onClose}
          className="w-full py-3 px-4 bg-transparent hover:bg-white/5 rounded-xl text-zinc-400 font-medium transition-colors mt-3"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}

// ==================== 18. МОДАЛКА ВЫХОДА ====================
function LogoutModal({ currentUser, onLogout, onSwitchAccount, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md border border-white/10">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-2xl">
              {currentUser?.fullName?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          <h3 className="text-xl font-bold mb-1 text-white">{currentUser?.fullName || 'Пользователь'}</h3>
          <p className="text-sm text-zinc-500">@{currentUser?.nickname}</p>
        </div>
        <div className="space-y-3">
          <button
            onClick={onLogout}
            className="w-full py-3 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 text-white hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#ef4444' }}
          >
            <LogOut size={18} />
            <span>Выйти</span>
          </button>
          <button
            onClick={onSwitchAccount}
            className="w-full py-3 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 text-white hover:opacity-90 active:scale-95 bg-blue-500"
          >
            <User size={18} />
            <span>Сменить аккаунт</span>
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-transparent hover:bg-white/5 rounded-xl text-zinc-400 font-medium transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}