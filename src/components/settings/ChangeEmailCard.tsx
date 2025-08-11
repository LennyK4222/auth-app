'use client';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useCsrfContext } from '@/contexts/CsrfContext';

export default function ChangeEmailCard({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { csrfToken } = useCsrfContext();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || email === currentEmail) {
      toast.error('Introdu un email nou.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/user/email/change-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ newEmail: email }),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Eroare la trimiterea emailului');
      }
      toast.success('Ți-am trimis un link de confirmare pe noul email. Verifică inboxul.');
      setEmail('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Eroare';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white">
      <h3 className="mb-2 text-lg font-semibold">Schimbă emailul</h3>
      <p className="mb-4 text-sm text-gray-600">Curent: <span className="font-medium">{currentEmail}</span></p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 max-w-md">
        <input
          type="email"
          className="w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="noul@email.tld"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading || !email || email === currentEmail}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Se trimite...' : 'Trimite link de confirmare'}
        </button>
      </form>
    </div>
  );
}
