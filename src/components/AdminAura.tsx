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

        /* Global admin-specific effects applied via data attributes */
        :global([data-admin-avatar]) { position: relative; }
        /* rotating ring + two bright slices to mimic orbiting sparks */
        @keyframes rotateFast { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseGlow { 
          0%, 100% { box-shadow: 0 0 0 rgba(34,211,238,0); }
          50% { box-shadow: 0 0 10px rgba(34,211,238,0.25); }
        }
        :global([data-admin-avatar]::before) {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 9999px;
          z-index: 0;
          background:
            conic-gradient(from 0deg,
              rgba(0,0,0,0) 0deg,
              rgba(34,211,238,0.55) 6deg,
              rgba(0,0,0,0) 18deg,
              rgba(217,70,239,0.55) 186deg,
              rgba(0,0,0,0) 198deg
            );
          filter: drop-shadow(0 0 8px rgba(34,211,238,0.35));
          animation: rotateFast 4.8s linear infinite;
        }
        :global([data-admin-avatar]::after) {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 9999px;
          z-index: 0;
          border: 1px solid rgba(34,211,238,0.28);
          background: radial-gradient(circle at center, rgba(34,211,238,0.15), rgba(34,211,238,0) 60%);
          animation: pulseGlow 2.6s ease-in-out infinite;
        }

        /* Admin badge aura + shimmer */
        @keyframes rotateAura { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes adminShimmer {
          0% { transform: translateX(-120%); opacity: 0.0; }
          10% { opacity: 0.9; }
          50% { opacity: 0.7; }
          100% { transform: translateX(120%); opacity: 0.0; }
        }
        /* Clean pulse effect for admin badge */
        @keyframes kiPulseBadge {
          0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.00), inset 0 0 0 0 rgba(251,191,36,0.00); }
          50%  { box-shadow: 0 0 0 8px rgba(239,68,68,0.25), inset 0 0 0 1px rgba(251,191,36,0.45); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.00), inset 0 0 0 0 rgba(251,191,36,0.00); }
        }
        :global([data-admin-badge]) { 
          position: relative; 
          overflow: visible; 
          animation: kiPulseBadge 1.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          :global([data-admin-badge]::before), :global([data-admin-badge]::after) {
            animation: none !important;
          }
          :global([data-admin-badge]) { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
