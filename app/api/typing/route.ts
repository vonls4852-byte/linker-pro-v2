import { NextResponse } from 'next/server';
import { redis } from '../../lib/kv';

// ==================== POST: СООБЩИТЬ О ПЕЧАТИ ====================
export async function POST(request: Request) {
  try {
    const { chatId, userId, userName } = await request.json();

    if (!chatId || !userId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    if (!redis) {
      return NextResponse.json({ error: 'Redis not connected' }, { status: 500 });
    }

    const typingKey = `typing:${chatId}`;
    const typingData = {
      userId,
      userName,
      timestamp: Date.now()
    };

    // Сохраняем статус печати с сроком жизни 5 секунд
    await redis.setex(typingKey, 5, JSON.stringify(typingData));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating typing status:', error);
    return NextResponse.json({ error: 'Failed to update typing status' }, { status: 500 });
  }
}

// ==================== GET: ПОЛУЧИТЬ СТАТУС ПЕЧАТИ ====================
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

    const typingKey = `typing:${chatId}`;
    const typingData = await redis.get(typingKey);

    if (!typingData) {
      return NextResponse.json({ typing: null });
    }

    const typing = JSON.parse(typingData as string);

    // Проверяем, не истекло ли (хотя Redis сам удаляет через 5 секунд)
    if (Date.now() - typing.timestamp > 5000) {
      return NextResponse.json({ typing: null });
    }

    return NextResponse.json({ typing });
  } catch (error) {
    console.error('Error getting typing status:', error);
    return NextResponse.json({ error: 'Failed to get typing status' }, { status: 500 });
  }
}