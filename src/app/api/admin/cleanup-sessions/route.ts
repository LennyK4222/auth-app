import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredSessions } from '@/lib/sessions';

// Este un endpoint intern pentru curățenia sesiunilor expirate
// Poate fi apelat printr-un cron job extern sau un task scheduler
export async function POST(req: NextRequest) {
  // Verifică dacă requestul vine dintr-o sursă de încredere
  const authHeader = req.headers.get('authorization');
  const expectedToken = process.env.CLEANUP_TOKEN; // Setează în .env.local
  
  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const deletedCount = await cleanupExpiredSessions();
    
    return NextResponse.json({
      message: 'Cleanup completed',
      deletedSessions: deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Session cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}

// Pentru debugging în development
export async function GET(_req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }
  
  try {
    const deletedCount = await cleanupExpiredSessions();
    
    return NextResponse.json({
      message: 'Development cleanup completed',
      deletedSessions: deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Session cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
