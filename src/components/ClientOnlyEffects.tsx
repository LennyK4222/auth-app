"use client";

import { useEffect, useState } from "react";
import ParticleNetwork from "@/components/ParticleNetwork";
import AdminAura from "@/components/AdminAura";

export default function ClientOnlyEffects() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <>
      <ParticleNetwork />
      <AdminAura />
    </>
  );
}
