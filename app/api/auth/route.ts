import { NextResponse } from 'next/server';
import { saveUser, getUserByNickname, getUserByPhone, getUserByEmail } from '../../lib/kv';
import bcrypt from 'bcryptjs';
import { User } from '../../types';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Регистрация
    if (body.action === 'register') {
      const { fullName, phone, nickname, email, password } = body;

      if (!fullName || !phone || !nickname || !password) {
        return NextResponse.json({ success: false, error: 'Заполните все поля' }, { status: 400 });
      }

      const existingByNickname = await getUserByNickname(nickname);
      const existingByPhone = await getUserByPhone(phone);
      
      if (existingByNickname || existingByPhone) {
        return NextResponse.json({ 
          success: false, 
          error: 'Пользователь с таким никнеймом или телефоном уже существует' 
        }, { status: 409 });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = Date.now().toString();

      const newUser: User = {
        id: userId,
        fullName,
        phone,
        nickname,
        email: email || null,
        password: hashedPassword,
        avatarUrl: null,
        bio: '',
        website: null,
        location: null,
        birthday: null,
        gender: null,
        role: 'user',
        isTester: false,
        testerSince: null,
        experimentsCount: 0,
        testedFeatures: [],
        bugsFound: 0,
        testTime: 0,
        achievements: [],
        testerLevel: 1,
        xp: 0,
        level: 1,
        createdAt: new Date().toISOString(),
        lastActive: Date.now(),
        settings: {
          themeColor: '#3b82f6',
          themeMode: 'dark',
          themeStyle: 'gradient',
          themeBlur: true,
          themeAnimations: true,
          privateAccount: false,
          showBirthday: true,
          showOnline: true,
          readReceipts: true
        }
      };

      await saveUser(newUser);
      const { password: _, ...userWithoutPassword } = newUser;

      return NextResponse.json({ success: true, user: userWithoutPassword }, { status: 201 });
    }

    // Вход
    if (body.action === 'login') {
      const { phone, nickname, email, password } = body;

      let user = null;
      if (phone) user = await getUserByPhone(phone);
      else if (nickname) user = await getUserByNickname(nickname);
      else if (email) user = await getUserByEmail(email);

      if (!user) {
        return NextResponse.json({ success: false, error: 'Пользователь не найден' }, { status: 404 });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return NextResponse.json({ success: false, error: 'Неверный пароль' }, { status: 401 });
      }

      const { password: _, ...userWithoutPassword } = user;
      return NextResponse.json({ success: true, user: userWithoutPassword });
    }

    return NextResponse.json({ success: false, error: 'Неизвестное действие' }, { status: 400 });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}