"use client";
import ReCAPTCHA from 'react-google-recaptcha';
import { useState, useEffect } from 'react';

export function Captcha({ onChange }: { onChange: (token: string | null) => void }) {
  const [siteKey, setSiteKey] = useState<string | null>(null);
  useEffect(() => {
    // NEXT_PUBLIC_ vars are inlined at build; guard for undefined
    const key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || null;
    setSiteKey(key);
  }, []);
  if (!siteKey) return null;
  return <ReCAPTCHA sitekey={siteKey} onChange={(token: string | null) => onChange(token)} />;
}
