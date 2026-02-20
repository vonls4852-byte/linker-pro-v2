"use client";
import { useState, useEffect } from 'react';
import AuthScreen from './components/auth/AuthScreen';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = (user: any) => {
    setCurrentUser(user);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} themeColor="#3b82f6" />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <h1 className="text-2xl font-bold">Добро пожаловать, {currentUser.fullName}!</h1>
      <button 
        onClick={() => {
          localStorage.removeItem('current_user');
          setCurrentUser(null);
        }}
        className="mt-4 px-4 py-2 bg-red-500 rounded-xl"
      >
        Выйти
      </button>
    </div>
  );
}