import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken } from './jwt';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    redirect('/login');
  }

  try {
    const payload = await verifyAuthToken(token);
    await connectToDatabase();
    
    const user = await User.findById(payload.sub).select('role email name');
    if (!user) {
      redirect('/login');
    }

    if (user.role !== 'admin') {
      redirect('/');
    }

    return {
      userId: payload.sub,
      email: user.email,
      name: user.name,
      role: user.role
    };
  } catch {
    redirect('/login');
  }
}

export async function isAdmin(token: string): Promise<boolean> {
  try {
    const payload = await verifyAuthToken(token);
    await connectToDatabase();
    
    const user = await User.findById(payload.sub).select('role');
    return user?.role === 'admin';
  } catch {
    return false;
  }
}
