import { NextResponse } from 'next/server';
import { 
  sendFriendRequest, 
  getIncomingRequests, 
  acceptFriendRequest, 
  rejectFriendRequest,
  getUserFriends,
  removeFriend,
  getUserById
} from '../../lib/kv';
import { FriendRequest } from '../../types';
import { redis } from '../../lib/kv';

// Вспомогательная функция для создания уведомления
async function createNotification(notification: any) {
  if (!redis) return null;
  
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newNotification = {
    ...notification,
    id,
    read: false,
    createdAt: Date.now(),
    time: Date.now(),
    link: '#',
    icon: '🔔'
  };

  await redis.set(`notification:${id}`, JSON.stringify(newNotification));
  await redis.sadd(`notifications:${notification.userId}`, id);
  
  return newNotification;
}

// Получить друзей или заявки
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (type === 'requests') {
      const requests = await getIncomingRequests(userId);
      return NextResponse.json({ requests });
    }

    const friends = await getUserFriends(userId);
    return NextResponse.json({ friends });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
  }
}

// Отправить заявку в друзья
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fromUserId, toUserId } = body;

    if (!fromUserId || !toUserId) {
      return NextResponse.json({ error: 'Missing user IDs' }, { status: 400 });
    }

    const fromUser = await getUserById(fromUserId);
    const toUser = await getUserById(toUserId);

    if (!fromUser || !toUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const requestData: FriendRequest = {
      id: Date.now().toString(),
      fromUserId,
      fromUserName: fromUser.fullName,
      fromUserNickname: fromUser.nickname,
      toUserId,
      status: 'pending',
      createdAt: Date.now()
    };

    await sendFriendRequest(requestData);

    // Создаём уведомление для получателя
    await createNotification({
      userId: toUserId,
      type: 'friend',
      fromUserId,
      fromUserName: fromUser.fullName,
      fromUserNickname: fromUser.nickname,
      fromUserAvatar: fromUser.avatarUrl,
      title: 'Заявка в друзья',
      text: `${fromUser.fullName} хочет добавить вас в друзья`
    });

    return NextResponse.json({ success: true, request: requestData });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
  }
}

// Принять/отклонить заявку или удалить из друзей
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, requestId, userId, friendId } = body;

    if (action === 'accept') {
      const acceptedRequest = await acceptFriendRequest(requestId);
      
      if (!acceptedRequest) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 });
      }

      // Создаём уведомление для отправителя
      const fromUser = await getUserById(acceptedRequest.fromUserId);
      const toUser = await getUserById(acceptedRequest.toUserId);
      
      if (fromUser && toUser) {
        await createNotification({
          userId: acceptedRequest.fromUserId,
          type: 'friend',
          fromUserId: acceptedRequest.toUserId,
          fromUserName: toUser.fullName,
          fromUserNickname: toUser.nickname,
          fromUserAvatar: toUser.avatarUrl,
          title: 'Заявка принята',
          text: `${toUser.fullName} принял вашу заявку в друзья`
        });
      }
      
      return NextResponse.json({ success: true, request: acceptedRequest });
    }

    if (action === 'reject') {
      const rejectedRequest = await rejectFriendRequest(requestId);
      return NextResponse.json({ success: true, request: rejectedRequest });
    }

    if (action === 'remove') {
      if (!userId || !friendId) {
        return NextResponse.json({ error: 'Missing user IDs' }, { status: 400 });
      }
      await removeFriend(userId, friendId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}