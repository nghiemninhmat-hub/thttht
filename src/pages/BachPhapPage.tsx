import { useState, useEffect, useCallback } from 'react';
import { supabase, WheelSpinResult } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard, StatGrid } from '@/components/StatCard';
import {
  Anchor, Coins, Dices, Frown, Gift, Loader2, Package,
  Sparkles, Skull, Star, X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Rarity = 1 | 2 | 3 | 4 | 5;

type WheelSegment = {
  label: string;
  color: string;
  icon: LucideIcon;
};

const rarityConfig: Record<Rarity, { stars: string; border: string; bg: string }> = {
  5: { stars: 'text-rose-400', border: 'border-rose-500/50', bg: 'bg-rose-500/10' },
  4: { stars: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10' },
  3: { stars: 'text-cyan-400', border: 'border-cyan-500/50', bg: 'bg-cyan-500/10' },
  2: { stars: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10' },
  1: { stars: 'text-gray-400', border: 'border-gray-500/50', bg: 'bg-gray-500/10' },
};

const wheelSegments: WheelSegment[] = [
  { label: 'Hoa Tiền', color: '#9d1b1b', icon: Coins },
  { label: 'Công Đức', color: '#171616', icon: Sparkles },
  { label: 'Âm Đức', color: '#7b1717', icon: Skull },
  { label: 'Vật phẩm\nThương Thành', color: '#202020', icon: Package },
  { label: 'Quà\nĐặc Biệt', color: '#b52b24', icon: Gift },
  { label: 'May mắn\nlần sau', color: '#111111', icon: Frown },
];

const segmentAngle = 360 / wheelSegments.length;
const rivetAngles = Array.from({ length: 12 }, (_, index) => index * 30);

function Stars({ count }: { count: Rarity }) {
  return (
    <span className="flex gap-0.5" aria-label={`${count} sao`}>
      {[1, 2, 3, 4, 5].map(index => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${index <= count ? rarityConfig[count].stars : 'text-gray-700'}`}
          fill={index <= count ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  );
}

function getRewardRarity(group: string): Rarity {
  if (group === 'Quà Đặc Biệt') return 5;
  if (group === 'Âm Đức' || group === 'Vật phẩm Thương Thành') return 3;
  if (group === 'Hoa Tiền' || group === 'Công Đức') return 2;
  return 1;
}

function getSegmentIndex(group: string): number {
  if (group === 'Hoa Tiền') return 0;
  if (group === 'Công Đức') return 1;
  if (group === 'Âm Đức') return 2;
  if (group === 'Vật phẩm Thương Thành') return 3;
  if (group === 'Quà Đặc Biệt') return 4;
  return 5;
}

export default function BachPhapPage() {
  const { profile, refreshProfile } = useAuth();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<WheelSpinResult | null>(null);
  const [error, setError] = useState('');
  const [rotation, setRotation] = useState(0);

  const spinsLeft = profile?.wheel_spins ?? 0;

  const refreshWheelProfile = useCallback(async () => {
    await refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    refreshWheelProfile();
  }, [refreshWheelProfile]);

  const handleSpin = async () => {
    if (spinning || spinsLeft <= 0) return;
    if (!profile) {
      setError('Vui lòng đăng nhập để quay.');
      return;
    }

    setSpinning(true);
    setError('');
    setResult(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('spin_wheel');
      if (rpcError) throw rpcError;

      const spinResult = (data as WheelSpinResult[])[0];
      if (!spinResult) throw new Error('Không nhận được kết quả');

      const targetIndex = getSegmentIndex(spinResult.reward_group);
      const targetCenter = targetIndex * segmentAngle + segmentAngle / 2;
      const currentMod = ((rotation % 360) + 360) % 360;
      const desiredMod = ((360 - targetCenter) % 360 + 360) % 360;
      let delta = desiredMod - currentMod;
      if (delta < 0) delta += 360;
      setRotation(rotation + 360 * 6 + delta);

      await new Promise(resolve => setTimeout(resolve, 4200));
      setResult(spinResult);
      setSpinning(false);
      await refreshWheelProfile();
    } catch (cause) {
      console.error('spin wheel failed', cause);
      setError('Không thể quay lúc này. Vui lòng thử lại.');
      setSpinning(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="relative mb-6 overflow-hidden rounded-3xl border border-[#670201]/30 bg-gradient-to-br from-[#1c0908] via-[#110707] to-[#080405] px-6 py-8 text-center sm:px-12 sm:py-10">
        <div className="absolute left-1/2 top-0 h-48 w-96 -translate-x-1/2 rounded-full bg-[#a00404]/15 blur-3xl" />
        <div className="relative z-10">
          <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">
            <Dices className="h-4 w-4" />
            Bách Pháp Mệnh
          </div>
          <h1 className="font-hero text-4xl font-bold tracking-tight text-amber-100 sm:text-6xl">Vòng Quay May Mắn</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gray-400">Chọn vận mệnh của bạn. Những phần thưởng đang chờ được hé lộ.</p>
        </div>
      </header>

      {/* Stats overview */}
      <StatGrid cols={3} className="mb-6">
        <StatCard label="Lượt Quay Còn Lại" value={spinsLeft} icon={Dices} accent={spinsLeft > 0 ? 'gold' : 'neutral'} hint={spinsLeft > 0 ? 'Sẵn sàng' : 'Hết lượt'} />
        <StatCard label="Quà Đặc Biệt" value={1} icon={Star} accent="vermilion" hint="Một lần / tài khoản" />
        <StatCard label="Tổng Ô Phần Thưởng" value={wheelSegments.length} icon={Coins} accent="gold" />
      </StatGrid>

      <section className="relative overflow-hidden rounded-3xl border border-[#670201]/30 bg-gradient-to-br from-[#160807] via-[#0b0505] to-[#080405] px-4 py-8 shadow-[0_24px_100px_rgba(0,0,0,0.45)] sm:px-10 sm:py-10">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#670201]/8 blur-3xl" />
        <div className="relative z-10 flex flex-col items-center gap-7 sm:gap-8">
          <div className="flex items-center gap-3 rounded-full border border-amber-300/20 bg-gradient-to-r from-black/40 to-[#1a0807]/40 px-5 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm sm:px-6 sm:py-3">
            <Dices className="h-4 w-4 text-amber-300/80 sm:h-5 sm:w-5" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 sm:text-xs">Lượt quay còn lại</span>
            <span className="font-serif text-lg font-bold text-amber-100 sm:text-xl">{spinsLeft}</span>
          </div>

          <div className="relative aspect-square w-[min(72vw,340px)] sm:w-[min(46vh,400px)]">
            {/* Outer subtle blood-moon halo */}
            <div className="pointer-events-none absolute -inset-[5%] rounded-full bg-[radial-gradient(circle_at50%50%,rgba(140,17,17,0.12),transparent_68%)]" />
            {/* Thin outer rim */}
            <div className="absolute -inset-[3.5%] rounded-full border border-white/15 bg-gradient-to-br from-white/10 via-transparent to-black/50 shadow-[0_12px_36px_rgba(0,0,0,0.55)]" />
            {/* Dark metal frame */}
            <div className="absolute -inset-[2.5%] rounded-full border-[3px] border-[#a9a9a9]/60 bg-[#171717] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35),inset_0_-3px_6px_rgba(0,0,0,0.8)] sm:border-[4px]" />
            {/* Blood moon ring — thin, elegant */}
            <div className="absolute -inset-[1.5%] rounded-full border-[2px] border-[#8c1111] bg-gradient-to-br from-[#d33b2f]/80 via-[#8c1010] to-[#360606] shadow-[inset_0_1px_3px_rgba(255,255,255,0.25),0_0_24px_rgba(140,17,17,0.2)] sm:border-[3px]" />
            {/* Inner rim highlight */}
            <div className="absolute -inset-[0.5%] rounded-full border border-white/40 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.7)]" />
            {rivetAngles.map(angle => (
              <div key={angle} className="absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
                <span className="absolute left-1/2 top-[5%] h-1.5 w-1.5 -translate-x-1/2 rounded-full border border-white/60 bg-gradient-to-br from-white via-gray-300 to-gray-600 shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:h-2 sm:w-2" />
              </div>
            ))}
            <div className="absolute left-1/2 top-[-3%] z-30 -translate-x-1/2">
              <div className="h-0 w-0 border-x-[10px] border-x-transparent border-b-[18px] border-b-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] sm:border-x-[13px] sm:border-b-[24px]" />
              <div className="mx-auto h-1.5 w-1.5 rounded-full bg-amber-100 shadow-[0_0_10px_rgba(253,230,138,0.95)] sm:h-2 sm:w-2" />
            </div>
            <div
              className="relative h-full w-full rounded-full border-[3px] border-[#d3d3d3]/80 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.85),inset_0_0_22px_rgba(0,0,0,0.75),0_12px_30px_rgba(0,0,0,0.6)] sm:border-[4px]"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                background: `conic-gradient(from 0deg, ${wheelSegments.map((segment, index) => `${segment.color} ${index * segmentAngle}deg ${(index + 1) * segmentAngle}deg`).join(', ')})`,
              }}
            >
              {wheelSegments.map((segment, index) => {
                const Icon = segment.icon;
                const angle = index * segmentAngle + segmentAngle / 2;
                return (
                  <div key={segment.label} className="absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
                    <div className="absolute left-1/2 top-[21%] -translate-x-1/2 -translate-y-1/2" style={{ transform: `translate(-50%, -50%) rotate(${-angle}deg)` }}>
                      <div className="flex w-16 flex-col items-center text-center sm:w-24">
                        <Icon className="mx-auto mb-1 h-4 w-4 text-amber-100/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] sm:h-5 sm:w-5" />
                        <span className="block whitespace-pre-line font-serif text-[8px] font-bold leading-[1.15] text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] sm:text-[10px]">{segment.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="absolute left-1/2 top-1/2 z-20 flex h-[15%] w-[15%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-[#d8d8d8] bg-gradient-to-br from-[#ef473b] via-[#8c1010] to-[#250303] shadow-[inset_0_0_0_2px_rgba(0,0,0,0.75),0_3px_10px_rgba(0,0,0,0.7)] sm:border-[4px]">
              <div className="flex h-[60%] w-[60%] items-center justify-center rounded-full border-2 border-red-200/60 bg-gradient-to-br from-[#d8322b] to-[#540707] shadow-[inset_0_1px_4px_rgba(255,255,255,0.25),0_0_0_2px_rgba(0,0,0,0.6)]">
                <span className="font-serif text-base font-bold text-amber-100 drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)] sm:text-xl">重</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            {error && <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>}
            {profile ? (
              <>
                <button
                  onClick={handleSpin}
                  disabled={spinning || spinsLeft <= 0}
                  className={`flex min-w-44 items-center justify-center gap-3 rounded-xl px-7 py-3.5 text-sm font-bold tracking-wide transition-all sm:min-w-52 sm:px-10 sm:py-4 sm:text-base ${spinning || spinsLeft <= 0 ? 'cursor-not-allowed bg-gray-700/50 text-gray-500' : 'bg-gradient-to-r from-[#670201] to-[#a00404] text-amber-100 shadow-lg shadow-[#670201]/30 hover:scale-105 hover:shadow-[#670201]/50'}`}
                >
                  {spinning ? <Loader2 className="h-5 w-5 animate-spin" /> : <Dices className="h-5 w-5" />}
                  {spinning ? 'Đang quay...' : 'QUAY NGAY'}
                </button>
                {spinsLeft <= 0 && !spinning && <p className="text-xs italic text-gray-500">Lượt quay được cấp bởi Ban Điều Hành.</p>}
              </>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-3">Đăng nhập để thử vận may tại Vòng Quay May Mắn.</p>
                <a href="/login" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#670201] to-[#a00404] px-6 py-3 text-sm font-bold text-amber-100 shadow-lg shadow-[#670201]/30 hover:scale-105 transition-all">
                  Đăng Nhập
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => setResult(null)}>
          <div className={`relative w-full max-w-sm rounded-2xl border-2 p-8 text-center shadow-2xl ${rarityConfig[getRewardRarity(result.reward_group)].border} ${rarityConfig[getRewardRarity(result.reward_group)].bg}`} onClick={event => event.stopPropagation()}>
            <button onClick={() => setResult(null)} className="absolute right-3 top-3 text-gray-500 transition-colors hover:text-gray-200" aria-label="Đóng"><X className="h-5 w-5" /></button>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10">
              {result.is_special ? <Gift className="h-8 w-8 text-rose-300" /> : result.reward_group === 'MISS' ? <Frown className="h-8 w-8 text-gray-400" /> : <Sparkles className="h-8 w-8 text-amber-300" />}
            </div>
            <div className="mb-3 flex justify-center"><Stars count={getRewardRarity(result.reward_group)} /></div>
            <h2 className="font-serif text-xl font-bold text-amber-100">{result.reward_group === 'MISS' ? 'Tiếc quá!' : 'Chúc mừng!'}</h2>
            <p className="mt-2 text-lg font-semibold text-gray-200">{result.reward_label}</p>
            {result.is_special && <p className="mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">Quà Đặc Biệt chỉ được nhận một lần cho mỗi tài khoản.</p>}
            <button onClick={() => setResult(null)} className="mt-6 w-full rounded-lg bg-gradient-to-r from-[#670201] to-[#a00404] py-3 text-sm font-bold text-amber-100 transition-opacity hover:opacity-90">Đã nhận</button>
          </div>
        </div>
      )}
    </div>
  );
}
