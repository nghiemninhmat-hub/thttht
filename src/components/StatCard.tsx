import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  accent?: 'gold' | 'vermilion' | 'jade' | 'neutral';
  hint?: string;
}

const accentMap = {
  gold: { text: 'text-[#f6ca62]', glow: 'shadow-[0_0_28px_rgba(238,179,55,0.12)]', border: 'border-[#eeb337]/30', icon: 'text-[#eeb337]', iconBg: 'bg-[#eeb337]/10' },
  vermilion: { text: 'text-[#f2a06b]', glow: 'shadow-[0_0_28px_rgba(183,55,32,0.14)]', border: 'border-[#b73720]/35', icon: 'text-[#b73720]', iconBg: 'bg-[#b73720]/10' },
  jade: { text: 'text-[#9bbf8a]', glow: 'shadow-[0_0_28px_rgba(120,160,100,0.12)]', border: 'border-[#6f8a5e]/30', icon: 'text-[#7a9a68]', iconBg: 'bg-[#7a9a68]/10' },
  neutral: { text: 'text-[#c9b493]', glow: '', border: 'border-white/12', icon: 'text-[#8a6a4a]', iconBg: 'bg-white/5' },
};

export function StatCard({ label, value, icon: Icon, accent = 'gold', hint }: StatCardProps) {
  const a = accentMap[accent];
  return (
    <div className={`relative overflow-hidden rounded-xl border ${a.border} bg-gradient-to-b from-[#170b09]/85 to-[#0d0807]/85 p-5 backdrop-blur-sm sm:p-6 ${a.glow} transition-transform duration-300 hover:-translate-y-0.5`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c9b493]/70 sm:text-[13px]">{label}</span>
        {Icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-full border ${a.border} ${a.iconBg} sm:h-10 sm:w-10`}>
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${a.icon}`} />
          </span>
        )}
      </div>
      <p className={`mt-3 font-serif text-3xl font-bold leading-none sm:text-4xl ${a.text} tabular-nums`}>{value}</p>
      {hint && <p className="mt-2 text-xs text-[#8a6a4a]/75 sm:text-[13px]">{hint}</p>}
    </div>
  );
}

interface StatGridProps {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}

export function StatGrid({ children, cols = 4, className = '' }: StatGridProps) {
  const colClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[cols];
  return (
    <div className={`grid ${colClass} gap-4 sm:gap-5 ${className}`}>
      {children}
    </div>
  );
}
