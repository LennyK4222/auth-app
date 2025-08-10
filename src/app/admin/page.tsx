import { requireAdmin } from '@/lib/auth/adminAuth';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <main className="relative mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Panou de administrare
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Bun venit, {admin.name || admin.email}! Administrează platforma aici.
          </p>
        </div>

        <AdminDashboard admin={admin} />
      </main>
    </div>
  );
}
