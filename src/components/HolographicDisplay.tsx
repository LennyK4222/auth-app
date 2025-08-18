export default function HolographicDisplay({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-fuchsia-500/10 animate-pulse" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-[ping_2.5s_ease-in-out_infinite]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}


