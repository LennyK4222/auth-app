'use client';

import { useSearchParams, useRouter } from 'next/navigation';
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

const Schema = z.object({ password: z.string().min(6, 'Minim 6 caractere'), confirm: z.string() }).refine((d) => d.password === d.confirm, {
  message: 'Parolele nu coincid',
  path: ['confirm'],
});

type Values = z.infer<typeof Schema>;

export default function ResetPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<Values>({ resolver: zodResolver(Schema) });
  const [done, setDone] = useState(false);
  const { csrfToken } = useCsrfToken();

  const onSubmit = async (values: Values) => {
    if (!token) {
      toast.error('Token invalid');
      return;
    }
    
    const res = await fetch('/api/auth/password/reset', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'X-CSRF-Token': csrfToken 
      },
      body: JSON.stringify({ token, password: values.password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'Eroare');
      return;
    }
    setDone(true);
    reset();
    toast.success('Parola a fost resetată. Te poți autentifica.');
    router.replace('/login');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-100 via-white to-sky-100 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
      <AuroraBackground />
      <div className="relative flex items-center justify-center px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Resetează parola</CardTitle>
            <CardDescription>Introdu o parolă nouă pentru contul tău.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="password">Parolă nouă</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirm">Confirmă parola</Label>
              <Input id="confirm" type="password" {...register('confirm')} />
              {errors.confirm && <p className="mt-1 text-sm text-red-600">{errors.confirm.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting || done} className="w-full" variant="glow" spark>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2"><Spinner /> Se resetează…</span>
              ) : done ? 'Resetat' : 'Resetează parola'}
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
