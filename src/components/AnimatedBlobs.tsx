"use client";
import { motion } from 'framer-motion';

export function AnimatedBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-indigo-300/30 blur-3xl"
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-sky-300/30 blur-3xl"
      />
    </div>
  );
}
