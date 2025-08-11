'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useCsrfContext } from '@/contexts/CsrfContext';

export default function DeleteAccountCard() {
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { csrfToken } = useCsrfContext();

  const disabled = confirm.trim().toUpperCase() !== 'DELETE';

  async function onDelete(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;
    setLoading(true);
    try {
  const res = await fetch('/api/user/delete', { method: 'POST', credentials: 'include', headers: { 'X-CSRF-Token': csrfToken } });
      if (res.redirected) {
        if (typeof window !== 'undefined') window.location.replace(res.url);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Eroare la ștergerea contului');
      }
      toast.success('Cont șters');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Eroare';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-900/50 dark:bg-red-950/40">
      <h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-200">Șterge contul</h3>
      <p className="mb-4 text-sm text-red-700 dark:text-red-300">Această acțiune este ireversibilă. Tastează <span className="font-semibold">DELETE</span> pentru a confirma.</p>
      <form onSubmit={onDelete} className="flex flex-col gap-3 max-w-md">
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-red-500"
          placeholder="DELETE"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || disabled}
          className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Se șterge...' : 'Șterge contul'}
        </button>
      </form>
    </div>
  );
}
