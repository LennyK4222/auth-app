"use client";
import React from "react";
import { useAuth } from "@/hooks/useAuth";

// Displays a subtle animated aura overlay for admins only
export default function AdminAura({ className = "" }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden
      suppressHydrationWarning
    >
      {/* Enhanced corner glows with energy effect */}
      <div className="absolute -top-24 -left-16 h-80 w-80 rounded-full blur-[60px] opacity-60 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.4),rgba(147,51,234,0.2),transparent_70%)]" />
      <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full blur-[60px] opacity-60 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.3),rgba(59,130,246,0.2),transparent_70%)]" />

      {/* Animated scanline border with energy pulses */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 rounded-2xl border border-blue-400/30" />
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-blue-400/90 to-transparent animate-energy-scan" />
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-purple-400/70 to-transparent animate-energy-scan-reverse" />
      </div>

      <style jsx>{`
        /* Enhanced energy scan animations */
        @keyframes energyScan {
          0% { transform: translateX(-100%); opacity: 0.0; filter: blur(2px); }
          10% { opacity: 1; filter: blur(0px); }
          50% { opacity: 0.9; filter: blur(0px); }
          100% { transform: translateX(100%); opacity: 0.0; filter: blur(2px); }
        }
        @keyframes energyScanReverse {
          0% { transform: translateX(100%); opacity: 0.0; filter: blur(2px); }
          10% { opacity: 1; filter: blur(0px); }
          50% { opacity: 0.8; filter: blur(0px); }
          100% { transform: translateX(-100%); opacity: 0.0; filter: blur(2px); }
        }
        .animate-energy-scan {
          animation: energyScan 2.8s linear infinite;
        }
        .animate-energy-scan-reverse {
          animation: energyScanReverse 3.2s linear infinite;
        }

        /* Global admin-specific effects applied via data attributes */
        :global([data-admin-avatar]) { position: relative; }
        
        /* Enhanced rotating energy ring with multiple layers */
        @keyframes kiRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes kiRotateReverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes kiEnergyPulse { 
          0%, 100% { 
            box-shadow: 0 0 0 rgba(59,130,246,0), 0 0 0 rgba(147,51,234,0);
            filter: drop-shadow(0 0 0 rgba(59,130,246,0));
          }
          50% { 
            box-shadow: 0 0 15px rgba(59,130,246,0.4), 0 0 25px rgba(147,51,234,0.2);
            filter: drop-shadow(0 0 12px rgba(59,130,246,0.5));
          }
        }
        
        :global([data-admin-avatar]::before) {
          content: '';
          position: absolute;
          inset: -8px;
          border-radius: 9999px;
          z-index: 0;
          background:
            conic-gradient(from 0deg,
              rgba(0,0,0,0) 0deg,
              rgba(59,130,246,0.8) 8deg,
              rgba(0,0,0,0) 20deg,
              rgba(147,51,234,0.6) 180deg,
              rgba(0,0,0,0) 192deg,
              rgba(236,72,153,0.7) 340deg,
              rgba(0,0,0,0) 352deg
            );
          filter: drop-shadow(0 0 12px rgba(59,130,246,0.4));
          animation: kiRotate 3.5s linear infinite;
        }
        
        :global([data-admin-avatar]::after) {
          content: '';
          position: absolute;
          inset: -6px;
          border-radius: 9999px;
          z-index: 1;
          background:
            conic-gradient(from 180deg,
              rgba(0,0,0,0) 0deg,
              rgba(147,51,234,0.6) 6deg,
              rgba(0,0,0,0) 18deg,
              rgba(236,72,153,0.5) 170deg,
              rgba(0,0,0,0) 182deg
            );
          animation: kiRotateReverse 2.8s linear infinite;
        }

        /* Minimalist Badge Glow */
        @keyframes minimalistGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59,130,246,0.0);
          }
          50% {
            box-shadow: 0 0 8px 1px rgba(59,130,246,0.3);
          }
        }

        :global([data-admin-badge]) {
          position: relative;
          overflow: visible;
          animation: minimalistGlow 3s ease-in-out infinite;
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          :global([data-admin-badge]), 
          :global([data-admin-badge]::before), 
          :global([data-admin-badge]::after),
          :global([data-admin-avatar]::before),
          :global([data-admin-avatar]::after) {
            animation: none !important;
          }
          .animate-energy-scan,
          .animate-energy-scan-reverse {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
