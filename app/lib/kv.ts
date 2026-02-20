import Redis from 'ioredis';
import { User, Post, Chat, Message, FriendRequest } from '../types';

// Создаём клиент Redis для Railway
let redis: Redis | null = null;

try {
  const url = process.env.REDIS_URL;
  if (url) {
    console.log('✅ Connecting to Redis...');
    redis = new Redis(url);
    console.log('✅ Redis connected');
  } else {
    console.error('❌ REDIS_URL not set');
  }
} catch (error) {
  console.error('❌ Redis connection error:', error);
}

// ==================== БАЗОВЫЕ ОПЕРАЦИИ ====================

// Сохранение пользователя
export async function saveUser(user: User) {
  if (!redis) {
    console.error('Redis not connected');
    return false;
  }
  
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
    return false;
  }
}

// Получение пользователя по ID
export async function getUserById(id: string): Promise<User | null> {
  if (!redis) return null;
  
  try {
    const user = await redis.get(`user:id:${id}`);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Получение пользователя по никнейму
export async function getUserByNickname(nickname: string): Promise<User | null> {
  if (!redis) return null;
  
  try {
    const userId = await redis.get(`user:nickname:${nickname}`);
    if (!userId) return null;
    return await getUserById(userId);
  } catch (error) {
    console.error('Error getting user by nickname:', error);
    return null;
  }
}

// Получение пользователя по телефону
export async function getUserByPhone(phone: string): Promise<User | null> {
  if (!redis) return null;
  
  try {
    const userId = await redis.get(`user:phone:${phone}`);
    if (!userId) return null;
    return await getUserById(userId);
  } catch (error) {
    console.error('Error getting user by phone:', error);
    return null;
  }
}

// Получение пользователя по email
export async function getUserByEmail(email: string): Promise<User | null> {
  if (!redis) return null;
  
  try {
    const userId = await redis.get(`user:email:${email}`);
    if (!userId) return null;
    return await getUserById(userId);
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

// Получение всех пользователей
export async function getAllUsers(): Promise<Partial<User>[]> {
  if (!redis) return [];
  
  try {
    const ids = await redis.smembers('users:all');
    const users = [];
    for (const id of ids) {
      const user = await getUserById(id);
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
  if (!redis) return null;
  
  try {
    const user = await getUserById(id);
    if (!user) return null;
    
    const updated = { ...user, ...data };
    await redis.set(`user:id:${id}`, JSON.stringify(updated));
    
    if (data.nickname && data.nickname !== user.nickname) {
      await redis.del(`user:nickname:${user.nickname}`);
      await redis.set(`user:nickname:${data.nickname}`, id);
    }
    
    if (data.phone && data.phone !== user.phone) {
      await redis.del(`user:phone:${user.phone}`);
      await redis.set(`user:phone:${data.phone}`, id);
    }
    
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

// Остальные функции-заглушки
export async function savePost(post: Post) { return true; }
export async function getUserPosts(userId: string): Promise<Post[]> { return []; }
export async function getFeed(userId: string): Promise<Post[]> { return []; }
export async function saveChat(chat: Chat) { return true; }
export async function getUserChats(userId: string): Promise<Chat[]> { return []; }
export async function saveMessage(chatId: string, message: Message) { return true; }
export async function getChatMessages(chatId: string): Promise<Message[]> { return []; }
export async function sendFriendRequest(request: FriendRequest) { return true; }
export async function getIncomingRequests(userId: string): Promise<FriendRequest[]> { return []; }
export async function acceptFriendRequest(requestId: string) { return null; }
export async function getUserFriends(userId: string): Promise<Partial<User>[]> { return []; }

// Экспортируем redis для прямого использования
export { redis };