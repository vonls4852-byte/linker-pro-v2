import { NextResponse } from 'next/server';
import { redis } from '../../lib/kv';

export async function GET() {
  const result: any = {
    timestamp: new Date().toISOString(),
    env: {
      hasRedisUrl: !!process.env.REDIS_URL,
    }
  };

  if (!redis) {
    result.success = false;
    result.error = 'Redis client is null';
    return NextResponse.json(result, { status: 500 });
  }

  try {
    await redis.set('test:connection', 'ok');
    const test = await redis.get('test:connection');
    
    result.success = true;
    result.test = test;
    result.message = 'Redis connected with ioredis!';
  } catch (error) {
    result.success = false;
    result.error = String(error);
  }

  return NextResponse.json(result);
}