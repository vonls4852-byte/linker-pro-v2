import { Redis } from '@upstash/redis';
import { User, Post, Chat, Message, FriendRequest } from '../types';

// Проверяем, что URL действительно есть
console.log('REDIS_URL exists:', !!process.env.REDIS_URL);

export const redis = new Redis({
  url: process.env.REDIS_URL || '',
  token: '', // Railway Redis не требует токен отдельно
});

// Проверим подключение при старте
redis.set('test:connection', 'ok').catch(err => {
  console.error('Redis connection failed:', err);
});

// ==================== БАЗОВЫЕ ОПЕРАЦИИ ====================

// Сохранение пользователя
export async function saveUser(user: User) {
  try {
    await redis.set(`user:id:${user.id}`, JSON.stringify(user));
    await redis.set(`user:nickname:${user.nickname}`, user.id);
    await redis.set(`user:phone:${user.phone}`, user.id);
    if (user.email) {
      await redis.set(`user:email:${user.email}`, user.id);
    }
    await redis.sadd('users:all', user.id);
    return true;
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
}

// Получение пользователя по ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    const user = await redis.get(`user:id:${id}`);
    return user ? JSON.parse(user as string) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Получение пользователя по никнейму
export async function getUserByNickname(nickname: string): Promise<User | null> {
  try {
    const userId = await redis.get(`user:nickname:${nickname}`);
    if (!userId) return null;
    return await getUserById(userId as string);
  } catch (error) {
    console.error('Error getting user by nickname:', error);
    return null;
  }
}

// Получение пользователя по телефону
export async function getUserByPhone(phone: string): Promise<User | null> {
  try {
    const userId = await redis.get(`user:phone:${phone}`);
    if (!userId) return null;
    return await getUserById(userId as string);
  } catch (error) {
    console.error('Error getting user by phone:', error);
    return null;
  }
}

// Получение пользователя по email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const userId = await redis.get(`user:email:${email}`);
    if (!userId) return null;
    return await getUserById(userId as string);
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

// Получение всех пользователей
export async function getAllUsers(): Promise<Partial<User>[]> {
  try {
    const ids = await redis.smembers('users:all');
    const users = [];
    for (const id of ids) {
      const user = await getUserById(id as string);
      if (user) {
        const { password, ...safeUser } = user;
        users.push(safeUser);
      }
    }
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

// Обновление пользователя
export async function updateUser(id: string, data: Partial<User>): Promise<User | null> {
  try {
    const user = await getUserById(id);
    if (!user) return null;

    const updated = { ...user, ...data };
    await redis.set(`user:id:${id}`, JSON.stringify(updated));

    // Если обновился никнейм, нужно обновить и индекс
    if (data.nickname && data.nickname !== user.nickname) {
      await redis.del(`user:nickname:${user.nickname}`);
      await redis.set(`user:nickname:${data.nickname}`, id);
    }

    // Если обновился телефон
    if (data.phone && data.phone !== user.phone) {
      await redis.del(`user:phone:${user.phone}`);
      await redis.set(`user:phone:${data.phone}`, id);
    }

    // Если обновился email
    if (data.email && data.email !== user.email) {
      if (user.email) await redis.del(`user:email:${user.email}`);
      await redis.set(`user:email:${data.email}`, id);
    }

    return updated;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

// Остальные функции (посты, чаты, друзья) добавим потом