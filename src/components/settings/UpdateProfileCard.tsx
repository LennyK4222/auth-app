"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'react-hot-toast';
import { useCsrfToken } from '@/hooks/useCsrfToken';

export function UpdateProfileCard({ initialName, email }: { initialName?: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName || '');
  const [loading, setLoading] = useState(false);
  const { csrfToken } = useCsrfToken();

  const onSave = async () => {
    if (!csrfToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Eroare la salvare');
  toast.success('Profil actualizat');
  // Refresh server components (navbar, header) to reflect new name
  router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Eroare';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="text-lg font-semibold">Profil</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Actualizează-ți numele afișat.</p>
      <div className="mt-4 space-y-4">
        <div>
          <Label>Email</Label>
          <Input value={email} disabled />
        </div>
        <div>
          <Label>Nume</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Numele tău" />
        </div>
      </div>
      <div className="mt-4">
  <Button onClick={onSave} disabled={loading || (name.trim() === (initialName || ''))}>
          {loading ? (
            <span className="inline-flex items-center gap-2"><Spinner /> Salvare…</span>
          ) : (
            'Salvează'
          )}
        </Button>
      </div>
    </section>
  );
}
