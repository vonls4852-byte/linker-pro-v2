"use client";
import React, { useState } from 'react';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
  themeColor: string;
}

export default function AuthScreen({ onAuthSuccess, themeColor }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    // Подробная отладка
    console.log('🔍 СОСТОЯНИЕ ПОЛЕЙ:');
    console.log('fullName:', JSON.stringify(fullName));
    console.log('phone:', JSON.stringify(phone));
    console.log('nickname:', JSON.stringify(nickname));
    console.log('email:', JSON.stringify(email));
    console.log('password:', JSON.stringify(password));
    console.log('confirmPassword:', JSON.stringify(confirmPassword));

    // Проверка на пустые поля
    if (!fullName || fullName.trim() === '') {
      setError('Введите имя и фамилию');
      return;
    }
    if (!phone || phone.trim() === '') {
      setError('Введите номер телефона');
      return;
    }
    if (!nickname || nickname.trim() === '') {
      setError('Введите никнейм');
      return;
    }
    if (!password || password.trim() === '') {
      setError('Введите пароль');
      return;
    }
    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Очищаем телефон от всех нецифровых символов
      const cleanPhone = phone.replace(/\D/g, '');
      console.log('📞 Очищенный телефон:', cleanPhone);

      const requestBody = {
        action: 'register',
        fullName: fullName.trim(),
        phone: cleanPhone,
        nickname: nickname.trim().toLowerCase(),
        email: email.trim() || null,
        password
      };
      
      console.log('📤 Отправка на сервер:', requestBody);

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Статус ответа:', response.status);
      
      const data = await response.json();
      console.log('📥 Ответ сервера:', data);

      if (data.success) {
        localStorage.setItem('current_user', JSON.stringify(data.user));
        onAuthSuccess(data.user);
      } else {
        setError(data.error || 'Ошибка регистрации');
      }
    } catch (err) {
      console.error('❌ Ошибка:', err);
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    console.log('📤 Вход:', { phone, nickname, email, password: '***' });

    if (!password || password.trim() === '') {
      setError('Введите пароль');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: any = {
        action: 'login',
        password
      };

      if (phone && phone.trim() !== '') {
        payload.phone = phone.replace(/\D/g, '');
      } else if (nickname && nickname.trim() !== '') {
        payload.nickname = nickname.trim().toLowerCase();
      } else if (email && email.trim() !== '') {
        payload.email = email.trim();
      } else {
        setError('Введите телефон, никнейм или email');
        setLoading(false);
        return;
      }

      console.log('📤 Отправка на сервер:', payload);

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('📥 Статус ответа:', response.status);
      
      const data = await response.json();
      console.log('📥 Ответ сервера:', data);

      if (data.success) {
        localStorage.setItem('current_user', JSON.stringify(data.user));
        onAuthSuccess(data.user);
      } else {
        setError(data.error || 'Ошибка входа');
      }
    } catch (err) {
      console.error('❌ Ошибка:', err);
      setError('Ошибка соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  // Сброс полей при переключении режима
  const switchToRegister = () => {
    setMode('register');
    setError('');
    setPhone('');
    setNickname('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const switchToLogin = () => {
    setMode('login');
    setError('');
    setFullName('');
    setPhone('');
    setNickname('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  if (mode === 'login') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-5xl font-black italic text-center mb-8" style={{ color: themeColor }}>
            LINKER
          </h1>
          <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
            <h2 className="text-2xl font-bold mb-6">Вход</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Телефон / Никнейм / Email"
                value={phone || nickname || email}
                onChange={(e) => {
                  const val = e.target.value;
                  // Очищаем все поля
                  setPhone('');
                  setNickname('');
                  setEmail('');
                  // Определяем тип введенных данных
                  if (val.includes('@')) {
                    setEmail(val);
                  } else if (val.match(/^[0-9\s\+\-\(\)]+$/)) {
                    setPhone(val);
                  } else {
                    setNickname(val);
                  }
                }}
                className="w-full bg-black/50 rounded-xl px-4 py-3 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors"
              />
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 rounded-xl px-4 py-3 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors"
              />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                style={{ backgroundColor: themeColor }}
              >
                {loading ? 'Загрузка...' : 'Войти'}
              </button>
              <button
                onClick={switchToRegister}
                className="w-full text-sm text-zinc-500 hover:text-white transition-colors"
              >
                Нет аккаунта? Зарегистрироваться
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-5xl font-black italic text-center mb-8" style={{ color: themeColor }}>
          LINKER
        </h1>
        <div className="bg-[#111] rounded-2xl p-6 border border-white/5">
          <h2 className="text-2xl font-bold mb-6">Регистрация</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Имя и фамилия"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-black/50 rounded-xl px-4 py-3 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors"
            />
            <input
              type="tel"
              placeholder="Телефон"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-black/50 rounded-xl px-4 py-3 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors"
            />
            <input
              type="text"
              placeholder="Никнейм"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-black/50 rounded-xl px-4 py-3 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors"
            />
            <input
              type="email"
              placeholder="Email (необязательно)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 rounded-xl px-4 py-3 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors"
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 rounded-xl px-4 py-3 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors"
            />
            <input
              type="password"
              placeholder="Повторите пароль"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-black/50 rounded-xl px-4 py-3 text-sm border border-white/5 outline-none focus:border-blue-500 transition-colors"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-3 rounded-xl font-medium transition-all disabled:opacity-50"
              style={{ backgroundColor: themeColor }}
            >
              {loading ? 'Загрузка...' : 'Зарегистрироваться'}
            </button>
            <button
              onClick={switchToLogin}
              className="w-full text-sm text-zinc-500 hover:text-white transition-colors"
            >
              Уже есть аккаунт? Войти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}