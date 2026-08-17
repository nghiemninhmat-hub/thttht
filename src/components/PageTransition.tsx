import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

type Phase = 'idle' | 'burning' | 'sweeping' | 'done';

const EMBER_COUNT = 8;

export default function PageTransition() {
  const location = useLocation();
  const [phase, setPhase] = useState<Phase>('idle');
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;

    window.scrollTo(0, 0);

    setPhase('burning');
    const t1 = setTimeout(() => setPhase('sweeping'), 850);
    const t2 = setTimeout(() => setPhase('done'), 1300);
    const t3 = setTimeout(() => setPhase('idle'), 1350);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [location.pathname]);

  if (phase === 'idle' || phase === 'done') return null;

  return (
    <div className="fixed inset-0 z-[90] pointer-events-none overflow-hidden">
      {/* === Falling talisman — slim, elegant === */}
      {phase === 'burning' && (
        <div className="talisman-fall absolute left-1/2 top-0 -translate-x-1/2">
          <div className="relative w-10 h-36 rounded-[1px]" style={{
            background: 'linear-gradient(180deg, #f0d878 0%, #e4c458 50%, #c8a030 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 12px rgba(238,179,55,0.2)',
          }}>
            {/* Faint paper grain */}
            <div className="absolute inset-0 opacity-15 rounded-[1px]" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(120,60,20,0.4) 3px, rgba(120,60,20,0.4) 4px)',
            }} />
            {/* Red ink seal */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-han text-xl font-bold text-[#8a1208]">禁</span>
            </div>
            {/* Delicate red border */}
            <div className="absolute inset-1 border border-[#8a1208]/30 rounded-[1px]" />
          </div>
        </div>
      )}

      {/* === Slim burn line — elegant vertical trace === */}
      {phase === 'burning' && (
        <div className="talisman-burn-line absolute left-1/2 top-0 h-full w-px -translate-x-1/2" style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,248,223,0.9) 15%, rgba(238,179,55,0.8) 40%, rgba(200,74,36,0.6) 70%, transparent 100%)',
          boxShadow: '0 0 8px rgba(255,180,60,0.5), 0 0 16px rgba(200,74,36,0.3)',
        }} />
      )}

      {/* === Soft warm glow === */}
      {phase === 'burning' && (
        <div className="talisman-glow absolute inset-0" />
      )}

      {/* === A few delicate embers === */}
      {phase === 'burning' && (
        <div className="absolute inset-0">
          {Array.from({ length: EMBER_COUNT }).map((_, i) => (
            <span
              key={i}
              className="talisman-ember absolute rounded-full"
              style={{
                left: `${46 + (i % 4) * 2.5}%`,
                top: `${10 + (i % 4) * 22}%`,
                width: '2px',
                height: '2px',
                background: 'rgba(255,200,80,0.85)',
                boxShadow: '0 0 4px rgba(255,180,60,0.6)',
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* === Gentle sweep veil — soft, not dramatic === */}
      {phase === 'sweeping' && (
        <div className="talisman-sweep-veil absolute inset-0" />
      )}
    </div>
  );
}
