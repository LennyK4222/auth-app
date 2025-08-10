'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { AuroraBackground } from '@/components/AuroraBackground';
import { toast } from 'react-hot-toast';
import { useCsrfToken } from '@/hooks/useCsrfToken';

const Schema = z.object({ email: z.string().email('Email invalid') });

type Values = z.infer<typeof Schema>;

export default function ForgotPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(Schema) });
  const [sent, setSent] = useState(false);
  const { csrfToken } = useCsrfToken();

  const onSubmit = async (values: Values) => {
    const res = await fetch('/api/auth/password/reset-request', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'X-CSRF-Token': csrfToken 
      },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Eroare');
      return;
    }
    setSent(true);
    toast.success('Dacă emailul există, vei primi un link de resetare. Verifică inboxul.');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-100 via-white to-sky-100 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
      <AuroraBackground />
      <div className="relative flex items-center justify-center px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Ai uitat parola?</CardTitle>
            <CardDescription>Îți trimitem un link de resetare.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting || sent} className="w-full" variant="glow" spark>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2"><Spinner /> Se trimite…</span>
              ) : sent ? 'Trimis' : 'Trimite link'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            <Link href="/login" className="font-medium text-indigo-600 underline-offset-4 hover:underline">Înapoi la login</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
