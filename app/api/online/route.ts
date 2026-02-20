import { NextResponse } from 'next/server';
import { getOnlineStatus, updateLastActive } from '../../lib/kv';

// Получить статусы пользователей
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get('userIds')?.split(',') || [];
    
    if (userIds.length === 0) {
      return NextResponse.json({ error: 'No user IDs provided' }, { status: 400 });
    }
    
    const status = await getOnlineStatus(userIds);
    return NextResponse.json({ status });
  } catch (error) {
    console.error('Error getting online status:', error);
    return NextResponse.json({ error: 'Failed to get online status' }, { status: 500 });
  }
}

// Обновить статус (вызывается при каждом действии пользователя)
export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    await updateLastActive(userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating online status:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}