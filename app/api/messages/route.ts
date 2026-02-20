import { NextResponse } from 'next/server';
import { redis } from '../../lib/kv';
import { Message } from '../../types';

// Получить сообщения чата
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }

    if (!redis) {
      return NextResponse.json({ error: 'Redis not connected' }, { status: 500 });
    }

    // Получаем все сообщения чата
    const messageIds = await redis.smembers(`messages:chat:${chatId}`);
    const messages = [];

    for (const id of messageIds) {
      const msg = await redis.get(id);
      if (msg) {
        messages.push(JSON.parse(msg as string));
      }
    }

    // Сортируем по времени
    messages.sort((a, b) => a.createdAt - b.createdAt);
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// Отправить сообщение
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chatId, message } = body;

    if (!chatId || !message) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    if (!redis) {
      return NextResponse.json({ error: 'Redis not connected' }, { status: 500 });
    }

    // Сохраняем сообщение
    const messageId = `msg:${chatId}:${message.id}`;
    await redis.set(messageId, JSON.stringify(message));
    await redis.sadd(`messages:chat:${chatId}`, messageId);
    
    // Получаем информацию о чате
    const chatData = await redis.get(`chat:${chatId}`);
    if (!chatData) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const chat = JSON.parse(chatData as string);
    
    // Обновляем lastMessage в чате
    chat.lastMessage = message;
    chat.updatedAt = Date.now();
    await redis.set(`chat:${chatId}`, JSON.stringify(chat));

    // Обновляем список чатов для каждого участника
    for (const participantId of chat.participants) {
      const userChatsKey = `chats:user:${participantId}`;
      const userChatIds = await redis.smembers(userChatsKey);
      
      // Обновляем информацию о чате в списке пользователя
      for (const userChatId of userChatIds) {
        if (userChatId === chatId) {
          const userChat = await redis.get(`chat:${userChatId}`);
          if (userChat) {
            const userChatData = JSON.parse(userChat as string);
            userChatData.lastMessage = message;
            userChatData.updatedAt = Date.now();
            
            // Увеличиваем счетчик непрочитанных для получателя
            if (participantId !== message.userId) {
              userChatData.unreadCount = (userChatData.unreadCount || 0) + 1;
            }
            
            await redis.set(`chat:${userChatId}`, JSON.stringify(userChatData));
          }
        }
      }
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// Отметить сообщения как прочитанные
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { chatId, userId } = body;

    if (!chatId || !userId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    if (!redis) {
      return NextResponse.json({ error: 'Redis not connected' }, { status: 500 });
    }

    // Получаем все сообщения чата
    const messageIds = await redis.smembers(`messages:chat:${chatId}`);
    
    // Отмечаем все непрочитанные сообщения как прочитанные
    for (const id of messageIds) {
      const msgData = await redis.get(id);
      if (msgData) {
        const msg = JSON.parse(msgData as string);
        if (msg.userId !== userId && !msg.read) {
          msg.read = true;
          await redis.set(id, JSON.stringify(msg));
        }
      }
    }

    // Сбрасываем счетчик непрочитанных для пользователя
    const chatData = await redis.get(`chat:${chatId}`);
    if (chatData) {
      const chat = JSON.parse(chatData as string);
      chat.unreadCount = 0;
      await redis.set(`chat:${chatId}`, JSON.stringify(chat));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}