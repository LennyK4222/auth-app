"use client";
import { motion } from 'framer-motion';
import React from 'react';

// A subtle, performant aurora gradient background using radial gradients and parallax
export function AuroraBackground({ className = '' }: { className?: string }) {
  return (
  <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden suppressHydrationWarning>
      <motion.div
        className="absolute -top-1/3 -left-1/4 h-[120vmin] w-[120vmin] rounded-full"
        style={{
          background:
            'radial-gradient(35% 35% at 50% 50%, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0) 70%), radial-gradient(30% 30% at 60% 40%, rgba(56,189,248,0.14) 0%, rgba(56,189,248,0) 70%)',
          filter: 'blur(40px)'
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      />
      <motion.div
        className="absolute -bottom-1/3 -right-1/4 h-[120vmin] w-[120vmin] rounded-full"
        style={{
          background:
            'radial-gradient(35% 35% at 50% 50%, rgba(129,140,248,0.18) 0%, rgba(129,140,248,0) 70%), radial-gradient(30% 30% at 40% 60%, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0) 70%)',
          filter: 'blur(40px)'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      />
    </div>
  );
}
