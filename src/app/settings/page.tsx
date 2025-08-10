import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuthToken } from '@/lib/auth/jwt';
// Update the import path to the correct location and filename
import { ProfileHeader } from '@/components/settings/ProfileHeader';
// Update the import path to the correct location and filename
import { AccountSettings } from '@/components/settings/AccountSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { UserStats } from '@/components/settings/UserStats';
import { Heartbeat } from '@/components/Heartbeat';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');
  let payload: { sub: string; email: string; name?: string };
  try {
    payload = await verifyAuthToken(token);
  } catch {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <main className="relative mx-auto max-w-6xl px-4 py-10">
        <Heartbeat />
        
        {/* Header modern cu avatar și statistici */}
        <ProfileHeader user={payload} />
        
        {/* Grid layout pentru settings */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Statistici utilizator */}
          <div className="lg:col-span-1">
            <UserStats userId={payload.sub} />
          </div>
          
          {/* Settings principale */}
          <div className="lg:col-span-2 space-y-8">
            <AccountSettings user={payload} />
            <SecuritySettings user={payload} />
            <NotificationSettings user={payload} />
            <PrivacySettings user={payload} />
          </div>
        </div>
      </main>
    </div>
  );
}
