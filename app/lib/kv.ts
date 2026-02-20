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

// ==================== ОНЛАЙН-СТАТУС ====================

// Обновить активность пользователя
export async function updateLastActive(userId: string) {
  if (!redis) return;
  try {
    await redis.set(`lastactive:${userId}`, Date.now().toString());
  } catch (error) {
    console.error('Error updating last active:', error);
  }
}

// Получить время последней активности
export async function getLastActive(userId: string): Promise<number | null> {
  if (!redis) return null;
  try {
    const value = await redis.get(`lastactive:${userId}`);
    return value ? parseInt(value as string, 10) : null;
  } catch (error) {
    console.error('Error getting last active:', error);
    return null;
  }
}

// Проверить, онлайн ли пользователь
export async function isUserOnline(userId: string): Promise<boolean> {
  const lastActive = await getLastActive(userId);
  if (!lastActive) return false;
  
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  return lastActive > fiveMinutesAgo;
}

// Получить статусы нескольких пользователей
export async function getOnlineStatus(userIds: string[]): Promise<Record<string, boolean>> {
  const status: Record<string, boolean> = {};
  
  for (const userId of userIds) {
    status[userId] = await isUserOnline(userId);
  }
  
  return status;
}

// ==================== ДРУЗЬЯ ====================

// Отправить заявку
export async function sendFriendRequest(request: FriendRequest) {
  if (!redis) return false;

  try {
    await redis.set(`friend:request:${request.id}`, JSON.stringify(request));
    await redis.sadd(`friend:requests:to:${request.toUserId}`, request.id);
    return true;
  } catch (error) {
    console.error('Error sending friend request:', error);
    return false;
  }
}

// Получить входящие заявки
export async function getIncomingRequests(userId: string): Promise<FriendRequest[]> {
  if (!redis) return [];

  try {
    const requestIds = await redis.smembers(`friend:requests:to:${userId}`);
    const requests = [];

    for (const id of requestIds) {
      const req = await redis.get(`friend:request:${id}`);
      if (req) {
        const reqData = JSON.parse(req) as FriendRequest;
        if (reqData.status === 'pending') requests.push(reqData);
      }
    }

    return requests;
  } catch (error) {
    console.error('Error getting incoming requests:', error);
    return [];
  }
}

// Принять заявку
export async function acceptFriendRequest(requestId: string): Promise<FriendRequest | null> {
  if (!redis) return null;

  try {
    const req = await redis.get(`friend:request:${requestId}`);
    if (!req) return null;

    const requestData = JSON.parse(req) as FriendRequest;
    requestData.status = 'accepted';

    await redis.set(`friend:request:${requestId}`, JSON.stringify(requestData));
    await redis.sadd(`friends:user:${requestData.fromUserId}`, requestData.toUserId);
    await redis.sadd(`friends:user:${requestData.toUserId}`, requestData.fromUserId);

    return requestData;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return null;
  }
}

// Отклонить заявку
export async function rejectFriendRequest(requestId: string): Promise<FriendRequest | null> {
  if (!redis) return null;

  try {
    const req = await redis.get(`friend:request:${requestId}`);
    if (!req) return null;

    const requestData = JSON.parse(req) as FriendRequest;
    requestData.status = 'rejected';

    await redis.set(`friend:request:${requestId}`, JSON.stringify(requestData));

    return requestData;
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return null;
  }
}

// Получить друзей пользователя
export async function getUserFriends(userId: string): Promise<Partial<User>[]> {
  if (!redis) return [];

  try {
    const friendIds = await redis.smembers(`friends:user:${userId}`);
    const friends = [];

    for (const id of friendIds) {
      const user = await getUserById(id);
      if (user) {
        const { password, ...safeUser } = user;
        friends.push(safeUser);
      }
    }

    return friends;
  } catch (error) {
    console.error('Error getting user friends:', error);
    return [];
  }
}

// Удалить из друзей
export async function removeFriend(userId: string, friendId: string): Promise<boolean> {
  if (!redis) return false;

  try {
    await redis.srem(`friends:user:${userId}`, friendId);
    await redis.srem(`friends:user:${friendId}`, userId);
    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    return false;
  }
}

// Экспортируем redis для прямого использования
export { redis };