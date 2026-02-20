import { NextResponse } from 'next/server';
import { redis } from '../../lib/kv';
import { Notification } from '../../types';

// Получить уведомления пользователя
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (!redis) {
      return NextResponse.json({ error: 'Redis not connected' }, { status: 500 });
    }

    // Получаем все уведомления пользователя
    const notificationIds = await redis.smembers(`notifications:${userId}`);
    const notifications: Notification[] = [];
    let unreadCount = 0;

    for (const id of notificationIds) {
      const notif = await redis.get(`notification:${id}`);
      if (notif) {
        const notification = JSON.parse(notif as string);
        notifications.push(notification);
        if (!notification.read) unreadCount++;
      }
    }

    // Сортируем по дате (новые сверху)
    notifications.sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({ 
      notifications: notifications.slice(0, 20), 
      unreadCount 
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// Отметить как прочитанное
export async function PATCH(request: Request) {
  try {
    const { notificationId, userId, markAll } = await request.json();

    if (!redis) {
      return NextResponse.json({ error: 'Redis not connected' }, { status: 500 });
    }

    if (markAll && userId) {
      // Отметить все как прочитанные
      const notificationIds = await redis.smembers(`notifications:${userId}`);
      
      for (const id of notificationIds) {
        const notif = await redis.get(`notification:${id}`);
        if (notif) {
          const notification = JSON.parse(notif as string);
          notification.read = true;
          await redis.set(`notification:${id}`, JSON.stringify(notification));
        }
      }
      
      return NextResponse.json({ success: true });
    }

    if (notificationId) {
      // Отметить одно уведомление
      const notif = await redis.get(`notification:${notificationId}`);
      if (notif) {
        const notification = JSON.parse(notif as string);
        notification.read = true;
        await redis.set(`notification:${notificationId}`, JSON.stringify(notification));
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}