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
import { Captcha } from '@/components/Captcha';
import { Eye, EyeOff } from 'lucide-react';
import { AuroraBackground } from '@/components/AuroraBackground';
import { useCsrfContext } from '@/contexts/CsrfContext';

const LoginSchema = z.object({
  email: z.string().email('Email invalid'),
  password: z.string().min(6, 'Minim 6 caractere'),
});

type LoginValues = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [show, setShow] = useState(false);
  const { csrfToken } = useCsrfContext();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(LoginSchema), mode: 'onTouched' });
  const [captcha, setCaptcha] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const onSubmit = async (values: LoginValues) => {
    setServerError(null);
    if (!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
      // allow without captcha if not configured
    } else if (!captcha) {
      toast.error('Te rog completează captcha.');
      return;
    }
    
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'X-CSRF-Token': csrfToken 
      },
      credentials: 'include',
      body: JSON.stringify({ ...values, captcha }),
    });
    const contentType = res.headers.get('content-type') || '';
    // If the response followed a redirect to a page (HTML) or is a redirect type, just go to '/'
    if (res.redirected || res.type === 'opaqueredirect' || (res.ok && !contentType.includes('application/json'))) {
      if (typeof window !== 'undefined') {
        window.location.replace('/');
      } else {
        router.replace('/');
      }
      return;
    }

    // Otherwise, try to parse JSON and handle errors/success
  let data: { error?: string } | null = null;
    if (contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        // ignore parse errors for non-json
      }
    }

    if (!res.ok) {
  const msg = (data && data.error) || 'Login failed';
      setServerError(msg);
      toast.error(msg);
      return;
    }

    toast.success('Autentificat cu succes');
    if (typeof window !== 'undefined') {
      window.location.replace('/');
    } else {
      router.replace('/');
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-100 via-white to-sky-100 dark:from-slate-900 dark:via-slate-950 dark:to-indigo-950">
  <AuroraBackground />

      <div className="relative flex items-center justify-center px-4 py-16">
        <Card className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Bine ai venit înapoi 👋</CardDescription>
          </CardHeader>

          {serverError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/60 dark:text-red-300">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? (
              <div className="pt-2">
                <Captcha onChange={setCaptcha} />
              </div>
            ) : null}
            <Button type="submit" variant="glow" spark className="mt-2 w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner /> Se încarcă…
                </span>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Nu ai cont?{' '}
            <Link href="/register" className="font-medium text-indigo-600 underline-offset-4 hover:underline">
              Register
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            <Link href="/forgot" className="font-medium text-indigo-600 underline-offset-4 hover:underline">
              Ai uitat parola?
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
