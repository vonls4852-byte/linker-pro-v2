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

    const messageIds = await redis.smembers(`messages:chat:${chatId}`);
    const messages = [];

    for (const id of messageIds) {
      const msg = await redis.get(id);
      if (msg) {
        messages.push(JSON.parse(msg as string));
      }
    }

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

    const messageId = `msg:${chatId}:${message.id}`;
    await redis.set(messageId, JSON.stringify(message));
    await redis.sadd(`messages:chat:${chatId}`, messageId);
    
    // Обновляем lastMessage в чате
    const chat = await redis.get(`chat:${chatId}`);
    if (chat) {
      const chatData = JSON.parse(chat as string);
      chatData.lastMessage = message;
      await redis.set(`chat:${chatId}`, JSON.stringify(chatData));
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}