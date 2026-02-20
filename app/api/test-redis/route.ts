import { NextResponse } from 'next/server';
import { redis } from '../../lib/kv';

export async function GET() {
  const result: any = {
    timestamp: new Date().toISOString(),
    env: {
      hasRedisUrl: !!process.env.REDIS_URL,
      redisUrlStart: process.env.REDIS_URL ? process.env.REDIS_URL.substring(0, 20) + '...' : 'not set'
    }
  };

  // Проверяем, подключен ли redis
  if (!redis) {
    result.success = false;
    result.error = 'Redis client is null - check REDIS_URL environment variable';
    return NextResponse.json(result, { status: 500 });
  }

  try {
    // Пробуем записать
    await redis.set('test:connection', 'ok');
    const test = await redis.get('test:connection');
    
    result.success = true;
    result.test = test;
    result.message = 'Redis connected!';
  } catch (error) {
    result.success = false;
    result.error = String(error);
  }

  return NextResponse.json(result);
}