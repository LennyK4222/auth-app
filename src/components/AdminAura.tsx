"use client";
import React from "react";
import { useAuth } from "@/hooks/useAuth";

// Displays a subtle animated aura overlay for admins only
export default function AdminAura({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden
      suppressHydrationWarning
    >
      {/* soft corner glows */}
      <div className="absolute -top-24 -left-16 h-80 w-80 rounded-full blur-[60px] opacity-50 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.25),transparent_60%)]" />
      <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full blur-[60px] opacity-50 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.18),transparent_60%)]" />

      {/* animated scanline border */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 rounded-2xl border border-red-500/20" />
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-red-400/70 to-transparent animate-admin-scan" />
      </div>

      <style jsx>{`
        @keyframes adminScan {
          0% { transform: translateX(-100%); opacity: 0.0; }
          10% { opacity: 1; }
          50% { opacity: 0.8; }
          100% { transform: translateX(100%); opacity: 0.0; }
        }
        .animate-admin-scan {
          animation: adminScan 3.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
