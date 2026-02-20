"use client";
import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Share2 } from 'lucide-react';

interface PostProps {
  post: any;
  currentUser: any;
  onLike: (postId: string) => void;
  onComment: (postId: string, comment: string) => void;
  onShare: (postId: string, type: 'direct' | 'story' | 'message') => void;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
}

export default function Post({ post, currentUser, onLike, onComment, onShare }: PostProps) {
  const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUser?.id) || false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleLike = () => {
    if (isLiked) {
      setLikesCount((prev: number) => prev - 1);
    } else {
      setLikesCount((prev: number) => prev + 1);
    }
    setIsLiked(!isLiked);
    onLike(post.id);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.fullName,
      text: newComment,
      createdAt: Date.now()
    };

    setComments([...comments, comment]);
    setNewComment('');
    onComment(post.id, newComment);
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} д назад`;
    return new Date(timestamp).toLocaleDateString('ru-RU');
  };

  return (
    <div className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
      {/* Шапка поста */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
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
            <p className="text-xs text-zinc-500">{formatTime(post.createdAt)}</p>
          </div>
        </div>
        <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <MoreHorizontal size={18} className="text-zinc-400" />
        </button>
      </div>

      {/* Изображение поста */}
      {post.image && (
        <div className="w-full aspect-square bg-black">
          <img src={post.image} alt="Post" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Текст поста (если нет фото) */}
      {!post.image && post.content && (
        <div className="p-4 bg-black/30 border-y border-white/5">
          <p className="text-zinc-300">{post.content}</p>
        </div>
      )}

      {/* Действия */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 transition-colors ${
              isLiked ? 'text-red-500' : 'text-zinc-400 hover:text-red-500'
            }`}
          >
            <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-sm">{likesCount}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
          >
            <MessageCircle size={22} />
            <span className="text-sm">{comments.length}</span>
          </button>
          
          {/* Кнопка "Переслать" с меню */}
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
            >
              <Send size={22} />
            </button>
            
            {showShareMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#1a1a1a] rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden">
                <div className="p-2 border-b border-white/10">
                  <p className="text-xs text-zinc-400">Поделиться</p>
                </div>
                <button
                  onClick={() => {
                    onShare(post.id, 'direct');
                    setShowShareMenu(false);
                  }}
                  className="flex items-center gap-3 w-full p-3 hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Send size={16} className="text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-white">Отправить в чат</p>
                    <p className="text-xs text-zinc-500">Личное сообщение</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onShare(post.id, 'story');
                    setShowShareMenu(false);
                  }}
                  className="flex items-center gap-3 w-full p-3 hover:bg-white/5 transition-colors border-t border-white/5"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-400 text-lg">✨</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-white">В историю</p>
                    <p className="text-xs text-zinc-500">Поделиться в stories</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onShare(post.id, 'message');
                    setShowShareMenu(false);
                  }}
                  className="flex items-center gap-3 w-full p-3 hover:bg-white/5 transition-colors border-t border-white/5"
                >
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Share2 size={16} className="text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-white">Поделиться</p>
                    <p className="text-xs text-zinc-500">Скопировать ссылку</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
        <button className="text-zinc-400 hover:text-white transition-colors">
          <Bookmark size={22} />
        </button>
      </div>

      {/* Комментарии (как было) */}
      {showComments && (
        <div className="border-t border-white/5 p-4">
          {/* ... остальной код комментариев ... */}
        </div>
      )}
    </div>
  );
}