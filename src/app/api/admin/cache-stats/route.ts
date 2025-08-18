import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { userCache } from '@/lib/userCache';

export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // Verifică autentificarea
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyAuthToken(token);
    
    // Verifică rolul de admin
    // (Poți adăuga verificare suplimentară aici pentru rolul admin)
    
    // Obține statisticile cache-ului
    const stats = userCache.getCacheStats();
    const users = await userCache.getActiveUsers();
    
    return NextResponse.json({
      cache: stats,
      users: {
        total: users.length,
        online: users.filter(u => u.online).length,
        sample: users.slice(0, 5).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email.substring(0, 3) + '***', // Partial pentru privacy
          online: u.online,
          lastSeenAt: u.lastSeenAt
        }))
      },
      performance: {
        cacheHitRatio: stats.age < 30000 ? 'HIGH' : 'LOW',
        recommendedAction: stats.age > 60000 ? 'Consider refreshing cache' : 'Cache is fresh'
      }
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

// Clear cache endpoint (doar pentru admin)
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    await verifyAuthToken(token);
    
    userCache.clearCache();
    
    return NextResponse.json({ 
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
