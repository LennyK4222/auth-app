"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'react-hot-toast';
// removed framer-motion background in favor of AuroraBackground
import { Eye, EyeOff } from 'lucide-react';
import { AuroraBackground } from '@/components/AuroraBackground';
import { useCsrfToken } from '@/hooks/useCsrfToken';

const RegisterSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Email invalid'),
  password: z.string().min(6, 'Minim 6 caractere'),
});
type RegisterValues = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const { csrfToken } = useCsrfToken();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(RegisterSchema), mode: 'onTouched' });

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null);
    
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'X-CSRF-Token': csrfToken 
      },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      setServerError(data.error || 'Registration failed');
      toast.error(data.error || 'Registration failed');
      return;
    }
    toast.success('Cont creat cu succes');
    router.push('/login');
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-100 via-white to-sky-100 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
      <AuroraBackground />

      <div className="relative flex items-center justify-center px-4 py-16">
        <Card className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>Creează-ți contul în câteva secunde ✨</CardDescription>
          </CardHeader>

          {serverError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/60 dark:text-red-300">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Nume</Label>
              <Input id="name" placeholder="Nume" {...register('name')} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="password">Parola</Label>
              <div className="relative">
                <Input id="password" type={show ? 'text' : 'password'} {...register('password')} />
                <button
                  type="button"
                  onClick={() => setShow((v: boolean) => !v)}
                  aria-label={show ? 'Ascunde parola' : 'Arată parola'}
                  className="absolute inset-y-0 right-2 my-auto grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>
            <Button type="submit" variant="glow" spark className="mt-2 w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> Se încarcă…
                </span>
              ) : (
                'Creează contul'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Ai deja cont?{' '}
            <Link href="/login" className="font-medium text-indigo-600 underline-offset-4 hover:underline">
              Login
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
