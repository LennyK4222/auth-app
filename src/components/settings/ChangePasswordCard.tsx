"use client";
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'react-hot-toast';
import { useOptionalCsrfContext } from '@/contexts/CsrfContext';

export function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { csrfToken } = useOptionalCsrfContext();

  const onChangePassword = async () => {
    if (!currentPassword.trim()) {
      toast.error('Te rog să introduci parola curentă');
      return;
    }
    if (currentPassword.length < 6) {
      toast.error('Parola curentă trebuie să aibă minim 6 caractere');
      return;
    }
    if (!newPassword.trim()) {
      toast.error('Te rog să introduci o parolă nouă');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Parola nouă trebuie să aibă minim 6 caractere');
      return;
    }
    if (currentPassword === newPassword) {
      toast.error('Parola nouă trebuie să fie diferită de cea curentă');
      return;
    }
    if (!csrfToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Nu s-a putut schimba parola');
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Parola a fost schimbată cu succes');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Eroare';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60">
      <h2 className="text-lg font-semibold">Schimbare parolă</h2>
      <div className="mt-4 space-y-4">
        <div>
          <Label>Parola curentă *</Label>
          <Input 
            type="password" 
            value={currentPassword} 
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Introdu parola curentă"
            required
          />
        </div>
        <div>
          <Label>Parola nouă *</Label>
          <Input 
            type="password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Introdu o parolă nouă (minim 6 caractere)"
            required
          />
        </div>
      </div>
      <div className="mt-4">
        <Button 
          onClick={onChangePassword} 
          disabled={loading || !currentPassword.trim() || !newPassword.trim()}
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2"><Spinner /> Schimbare…</span>
          ) : (
            'Schimbă parola'
          )}
        </Button>
        {(!currentPassword.trim() || !newPassword.trim()) && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Completează ambele câmpuri pentru a schimba parola
          </p>
        )}
      </div>
    </section>
  );
}
