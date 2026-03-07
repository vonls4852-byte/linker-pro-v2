import { NextResponse } from 'next/server';
import { redis } from '../../../lib/kv';
import { uploadFileToBucket } from '../../../lib/s3';
import { imgproxy } from '../../../lib/imgproxy';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chatId = formData.get('chatId') as string;
    const userId = formData.get('userId') as string;

    if (!file || !chatId || !userId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    if (!redis) {
      return NextResponse.json({ error: 'Redis not connected' }, { status: 500 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const chatData = await redis.get(`chat:${chatId}`);
    if (!chatData) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const chat = JSON.parse(chatData as string);
    
    const isAdmin = chat.admins?.includes(userId) || chat.createdBy === userId;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const key = await uploadFileToBucket(buffer, fileName, file.type);

    chat.avatar = key;
    chat.updatedAt = Date.now();
    await redis.set(`chat:${chatId}`, JSON.stringify(chat));

    const userData = await redis.get(`user:id:${userId}`);
    const userName = userData ? JSON.parse(userData).fullName : 'Пользователь';
    
    const systemMessage = {
      id: `sys_${Date.now()}`,
      chatId,
      userId: 'system',
      userName: 'Система',
      content: `${userName} изменил(а) аватар группы`,
      createdAt: Date.now(),
      read: true,
      type: 'system'
    };

    const messageId = `msg:${chatId}:${systemMessage.id}`;
    await redis.set(messageId, JSON.stringify(systemMessage));
    await redis.sadd(`messages:chat:${chatId}`, messageId);

    const avatarUrl = imgproxy.getUrl(key, { width: 200, height: 200, format: 'webp' });

    return NextResponse.json({ 
      success: true, 
      key,
      url: avatarUrl 
    });
  } catch (error) {
    console.error('Error uploading group avatar:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}