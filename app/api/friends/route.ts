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

// Получить друзей или заявки
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'friends' | 'requests'

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

    // Создаём объект заявки с правильным типом
    const requestData: FriendRequest = {
      id: Date.now().toString(),
      fromUserId,
      fromUserName: fromUser.fullName,
      fromUserNickname: fromUser.nickname,
      toUserId,
      toUserName: toUser.fullName,
      status: 'pending',
      createdAt: Date.now()
    };

    await sendFriendRequest(requestData);
    return NextResponse.json({ success: true, request: requestData });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
  }
}

// Принять/отклонить заявку или удалить из друзей
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, requestId, userId, friendId } = body;

    if (action === 'accept') {
      const request = await acceptFriendRequest(requestId);
      return NextResponse.json({ success: true, request });
    }

    if (action === 'reject') {
      const request = await rejectFriendRequest(requestId);
      return NextResponse.json({ success: true, request });
    }

    if (action === 'remove') {
      await removeFriend(userId, friendId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}