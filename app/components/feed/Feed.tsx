"use client";
import React, { useState, useEffect } from 'react';
import Post from './Post';
import { Heart } from 'lucide-react';

interface FeedProps {
  currentUser: any;
}

export default function Feed({ currentUser }: FeedProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка постов из API
  useEffect(() => {
    loadFeed();
  }, [currentUser]);

  const loadFeed = async () => {
    try {
      const response = await fetch(`/api/posts?feed=true&userId=${currentUser.id}`);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'like',
          postId,
          userId: currentUser.id
        })
      });

      const data = await response.json();
      if (data.success) {
        setPosts(posts.map(post => 
          post.id === postId ? data.post : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleComment = async (postId: string, commentText: string) => {
    try {
      const comment = {
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        text: commentText,
        createdAt: Date.now()
      };

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comment',
          postId,
          comment
        })
      });

      const data = await response.json();
      if (data.success) {
        setPosts(posts.map(post => 
          post.id === postId ? data.post : post
        ));
      }
    } catch (error) {
      console.error('Error commenting on post:', error);
    }
  };

  const handleShare = async (postId: string, type: 'direct' | 'story' | 'message') => {
    // Функция для пересылки
    console.log(`Sharing post ${postId} via ${type}`);
    // Здесь будет логика пересылки
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Heart size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-medium text-zinc-300 mb-2">В ленте пока пусто</h3>
          <p className="text-zinc-500">Подпишитесь на друзей, чтобы видеть их посты</p>
        </div>
      ) : (
        posts.map(post => (
          <Post
            key={post.id}
            post={post}
            currentUser={currentUser}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
          />
        ))
      )}
    </div>
  );
}