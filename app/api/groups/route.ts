import { NextResponse } from 'next/server';
import { redis } from '../../lib/kv';

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
async function getChat(chatId: string) {
  if (!redis) return null;
  const chat = await redis.get(`chat:${chatId}`);
  return chat ? JSON.parse(chat) : null;
}

async function saveChat(chat: any) {
  if (!redis) return;
  await redis.set(`chat:${chat.id}`, JSON.stringify(chat));
  
  // Обновляем в списках пользователей
  for (const participantId of chat.participants) {
    await redis.sadd(`chats:user:${participantId}`, chat.id);
  }
}

// ==================== ДОБАВИТЬ УЧАСТНИКОВ ====================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chatId, userIds, addedBy } = body;

    if (!chatId || !userIds || !addedBy) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    if (!redis) {
      return NextResponse.json({ error: 'Redis not connected' }, { status: 500 });
    }

    const chat = await getChat(chatId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Проверяем, что добавляющий является админом или создателем
    const isAdmin = chat.admins?.includes(addedBy) || chat.createdBy === addedBy;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Добавляем новых участников
    const newParticipants = [...new Set([...chat.participants, ...userIds])];
    chat.participants = newParticipants;
    chat.updatedAt = Date.now();

    await saveChat(chat);

    // Создаём системное сообщение о добавлении
    const adderData = await redis.get(`user:id:${addedBy}`);
    const adderName = adderData ? JSON.parse(adderData).fullName : 'Пользователь';
    
    const systemMessage = {
      id: `sys_${Date.now()}`,
      chatId,
      userId: 'system',
      userName: 'Система',
      content: `${adderName} добавил(а) ${userIds.length} новых участников`,
      createdAt: Date.now(),
      read: true,
      type: 'system'
    };

    const messageId = `msg:${chatId}:${systemMessage.id}`;
    await redis.set(messageId, JSON.stringify(systemMessage));
    await redis.sadd(`messages:chat:${chatId}`, messageId);

    return NextResponse.json({ 
      success: true, 
      chat,
      message: systemMessage
    });
  } catch (error) {
    console.error('Error adding participants:', error);
    return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 });
  }
}

// ==================== ВЫХОД ИЗ ГРУППЫ ====================
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { chatId, userId, action } = body;

    if (!chatId || !userId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    if (!redis) {
      return NextResponse.json({ error: 'Redis not connected' }, { status: 500 });
    }

    const chat = await getChat(chatId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Выход из группы
    if (action === 'leave') {
      // Удаляем пользователя из участников
      chat.participants = chat.participants.filter((id: string) => id !== userId);
      
      // Если пользователь был админом, удаляем из админов
      if (chat.admins) {
        chat.admins = chat.admins.filter((id: string) => id !== userId);
      }

      // Если это был создатель, передаём права первому админу или остаёмся
      if (chat.createdBy === userId) {
        if (chat.participants.length > 0) {
          // Назначаем нового создателя (первого участника)
          chat.createdBy = chat.participants[0];
          // Делаем его админом
          if (!chat.admins) chat.admins = [];
          if (!chat.admins.includes(chat.createdBy)) {
            chat.admins.push(chat.createdBy);
          }
        }
      }

      chat.updatedAt = Date.now();
      await saveChat(chat);

      // Удаляем чат из списка пользователя
      await redis.srem(`chats:user:${userId}`, chatId);

      // Создаём системное сообщение
      const leaverData = await redis.get(`user:id:${userId}`);
      const leaverName = leaverData ? JSON.parse(leaverData).fullName : 'Пользователь';
      
      const systemMessage = {
        id: `sys_${Date.now()}`,
        chatId,
        userId: 'system',
        userName: 'Система',
        content: `${leaverName} покинул(а) группу`,
        createdAt: Date.now(),
        read: true,
        type: 'system'
      };

      const messageId = `msg:${chatId}:${systemMessage.id}`;
      await redis.set(messageId, JSON.stringify(systemMessage));
      await redis.sadd(`messages:chat:${chatId}`, messageId);

      return NextResponse.json({ success: true, chat });
    }

    // Удаление группы (только создатель)
    if (action === 'delete') {
      if (chat.createdBy !== userId) {
        return NextResponse.json({ error: 'Only creator can delete group' }, { status: 403 });
      }

      // Удаляем все сообщения чата
      const messageIds = await redis.smembers(`messages:chat:${chatId}`);
      for (const id of messageIds) {
        await redis.del(id);
      }
      await redis.del(`messages:chat:${chatId}`);

      // Удаляем чат из списков всех участников
      for (const participantId of chat.participants) {
        await redis.srem(`chats:user:${participantId}`, chatId);
      }

      // Удаляем сам чат
      await redis.del(`chat:${chatId}`);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing group action:', error);
    return NextResponse.json({ error: 'Failed to process group action' }, { status: 500 });
  }
}