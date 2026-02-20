import { NextResponse } from 'next/server';
import { getAllUsers, getUserById, updateUser } from '../../lib/kv';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const user = await getUserById(id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const { password, ...safeUser } = user;
      return NextResponse.json({ user: safeUser });
    }

    const users = await getAllUsers();
    return NextResponse.json({ users, total: users.length });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}