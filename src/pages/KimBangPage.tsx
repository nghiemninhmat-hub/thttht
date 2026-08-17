import { useState, useEffect, useCallback } from 'react';
import { supabase, KimBangEntry } from '@/lib/supabase';
import { Crown, ScrollText, Sparkles, Coins, Trophy, Ghost } from 'lucide-react';

import avatarRank1 from '@/assets/images/kim-bang/tai_xuong_(25).jpg';
import avatarRank2 from '@/assets/images/kim-bang/tai_xuong_(26).jpg';
import avatarRank3 from '@/assets/images/kim-bang/934708097666581116.jpg';
import avatarRank4 from '@/assets/images/kim-bang/585538389087460272.jpg';

const defaultAvatars: Record<number, string> = {
  1: avatarRank1,
  2: avatarRank2,
  3: avatarRank3,
  4: avatarRank4,
};

const rankLabels: Record<number, string> = {
  1: 'Đệ Nhất',
  2: 'Đệ Nhị',
  3: 'Đệ Tam',
  4: 'Đệ Tứ',
  5: 'Đệ Ngũ',
  6: 'Đệ Lục',
};

function getRankTheme(rank: number) {
  switch (rank) {
    case 1:
      return {
        border: 'border-amber-300/40',
        glow: 'shadow-[0_0_50px_rgba(238,179,55,0.15)]',
        badge: 'from-amber-300 to-amber-500',
        badgeText: 'text-[#1a0a05]',
        ring: 'ring-amber-300/30',
        accent: 'text-amber-300',
        grad: 'from-amber-300/12 via-amber-200/4 to-transparent',
      };
    case 2:
      return {
        border: 'border-gray-300/30',
        glow: 'shadow-[0_0_35px_rgba(201,180,147,0.10)]',
        badge: 'from-gray-200 to-gray-400',
        badgeText: 'text-[#1a0a05]',
        ring: 'ring-gray-300/25',
        accent: 'text-gray-300',
        grad: 'from-gray-300/8 via-transparent to-transparent',
      };
    case 3:
      return {
        border: 'border-orange-700/30',
        glow: 'shadow-[0_0_35px_rgba(180,100,40,0.10)]',
        badge: 'from-orange-500 to-orange-700',
        badgeText: 'text-white',
        ring: 'ring-orange-600/25',
        accent: 'text-orange-400',
        grad: 'from-orange-700/8 via-transparent to-transparent',
      };
    default:
      return {
        border: 'border-[#670201]/25',
        glow: '',
        badge: 'from-[#5c160f] to-[#8f2418]',
        badgeText: 'text-amber-100',
        ring: 'ring-[#670201]/20',
        accent: 'text-[#d7a96d]',
        grad: 'from-[#1a0807]/40 to-transparent',
        icon: ScrollText,
      };
  }
}

function getAvatar(entry: KimBangEntry): string {
  if (entry.avatar_url) return entry.avatar_url.trim();
  return defaultAvatars[entry.rank] || '';
}

/* ── Podium card for top 3 ── */
function PodiumCard({ entry }: { entry: KimBangEntry }) {
  const theme = getRankTheme(entry.rank);
  const avatar = getAvatar(entry);
  const isEmpty = !entry.identity_name;
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = avatar && !isEmpty && !imgFailed;

  return (
    <article
      className={`group relative flex h-full flex-col items-center overflow-hidden rounded-2xl border ${theme.border} bg-gradient-to-b ${theme.grad} from-[#0f0606] to-[#080405] ${theme.glow} transition-all duration-500 hover:scale-[1.02]`}
    >
      {/* Rank badge */}
      <div className="absolute right-3 top-3 z-10">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${theme.badge} ${theme.badgeText} shadow-lg`}>
          <span className="font-serif text-sm font-bold">{String(entry.rank).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Decorative corner */}
      <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-[#eeb337]/5 blur-2xl" />

      <div className="flex w-full flex-1 flex-col items-center px-5 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-7">
        {/* Avatar */}
        <div className="relative mb-5">
          <div className={`h-20 w-20 overflow-hidden rounded-full border-2 ${theme.border} bg-gradient-to-br from-[#5c160f]/30 to-[#0d0807] ring-4 ${theme.ring} sm:h-24 sm:w-24`}>
            {showImg ? (
              <img
                src={avatar}
                alt={entry.identity_name}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Ghost className="h-10 w-10 text-gray-700" />
              </div>
            )}
          </div>
          {/* Rank label under avatar */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#eeb337]/20 bg-[#0d0807] px-3 py-0.5">
            <span className="font-serif text-xs font-bold text-amber-300">{rankLabels[entry.rank]}</span>
          </div>
        </div>

        {/* Info */}
        {isEmpty ? (
          <p className="py-4 text-sm italic text-gray-600">— Vị trí trống —</p>
        ) : (
          <div className="flex flex-1 flex-col text-center">
            <h3 className="font-serif text-lg font-bold text-amber-100 sm:text-xl">{entry.identity_name}</h3>
            {entry.honor_title && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#eeb337]/20 bg-[#eeb337]/8 px-3 py-1">
                <Sparkles className="h-3 w-3 text-amber-300" />
                <span className="text-xs font-semibold text-amber-200">{entry.honor_title}</span>
              </div>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {entry.wealth && (
                <div className="flex items-center gap-1.5 rounded-lg border border-[#eeb337]/15 bg-black/30 px-3 py-1.5">
                  <Coins className="h-3.5 w-3.5 text-amber-300/80" />
                  <span className="text-xs font-semibold text-amber-200">{entry.wealth}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 rounded-lg border border-[#eeb337]/15 bg-black/30 px-3 py-1.5">
                <Trophy className="h-3.5 w-3.5 text-amber-300/80" />
                <span className="text-xs font-semibold text-amber-200">{entry.quests_completed} Dị Sự</span>
              </div>
            </div>
            {entry.epithet && (
              <p className="mt-3 font-script text-sm italic leading-6 text-[#d7a96d]/70">"{entry.epithet}"</p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/* ── Horizontal card for ranks 4-6 ── */
function ListCard({ entry }: { entry: KimBangEntry }) {
  const theme = getRankTheme(entry.rank);
  const avatar = getAvatar(entry);
  const isEmpty = !entry.identity_name;
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = avatar && !isEmpty && !imgFailed;

  return (
    <article className={`group relative overflow-hidden rounded-xl border ${theme.border} bg-gradient-to-r ${theme.grad} from-[#0f0606] to-[#080405] transition-all duration-500 hover:scale-[1.01]`}>
      <div className="flex items-center gap-4 p-4 sm:p-5">
        {/* Rank number */}
        <div className="flex-shrink-0">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${theme.badge} ${theme.badgeText} font-bold text-sm shadow-lg`}>
            {String(entry.rank).padStart(2, '0')}
          </div>
        </div>

        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${theme.border} bg-gradient-to-br from-[#5c160f]/30 to-[#0d0807]`}>
            {showImg ? (
              <img
                src={avatar}
                alt={entry.identity_name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Ghost className="h-6 w-6 text-gray-700" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          {isEmpty ? (
            <p className="py-2 text-sm italic text-gray-600">— Vị trí trống —</p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h3 className="truncate font-serif text-base font-bold text-amber-100 sm:text-lg">{entry.identity_name}</h3>
                <span className="hidden whitespace-nowrap font-serif text-xs text-amber-300/60 sm:inline">· {rankLabels[entry.rank]}</span>
              </div>
              {entry.honor_title && (
                <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-[#eeb337]/15 bg-[#eeb337]/6 px-2 py-0.5">
                  <Sparkles className="h-2.5 w-2.5 text-amber-300/80" />
                  <span className="text-[11px] font-medium text-amber-200/90">{entry.honor_title}</span>
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {entry.wealth && (
                  <div className="flex items-center gap-1 rounded-md border border-[#eeb337]/12 bg-black/25 px-2 py-1">
                    <Coins className="h-3 w-3 text-amber-300/70" />
                    <span className="text-[11px] font-semibold text-amber-200/90">{entry.wealth}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 rounded-md border border-[#eeb337]/12 bg-black/25 px-2 py-1">
                  <Trophy className="h-3 w-3 text-amber-300/70" />
                  <span className="text-[11px] font-semibold text-amber-200/90">{entry.quests_completed} Dị Sự</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Epithet - desktop only */}
        {entry.epithet && !isEmpty && (
          <div className="hidden max-w-[200px] flex-shrink-0 lg:block">
            <p className="font-script text-sm italic leading-5 text-[#d7a96d]/60 text-right">"{entry.epithet}"</p>
          </div>
        )}
      </div>

      {/* Epithet - mobile */}
      {entry.epithet && !isEmpty && (
        <div className="px-4 pb-3 lg:hidden">
          <p className="font-script text-xs italic leading-5 text-[#d7a96d]/60">"{entry.epithet}"</p>
        </div>
      )}
    </article>
  );
}

export default function KimBangPage() {
  const [entries, setEntries] = useState<KimBangEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('kim_bang')
      .select('id, rank, identity_name, wealth, quests_completed, honor_title, avatar_url, epithet, updated_at')
      .order('rank', { ascending: true });

    if (error) {
      console.error('Lỗi tải Kim Bảng:', error.message);
    } else {
      setEntries(data as KimBangEntry[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const top3 = entries.filter(e => e.rank <= 3);
  const rest = entries.filter(e => e.rank >= 4);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* ── Header ── */}
      <header className="relative overflow-hidden rounded-2xl border border-[#eeb337]/25 bg-gradient-to-br from-[#1b0807] via-[#100607] to-[#080405] px-5 py-7 sm:px-8 sm:py-9">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#eeb337]/10 blur-3xl" />
        <div className="absolute -bottom-28 left-1/4 h-60 w-80 rounded-full bg-[#b73720]/10 blur-3xl" />
        {/* Decorative top line */}
        <div className="absolute left-1/2 top-0 h-px w-32 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#eeb337]/40 to-transparent" />
        <div className="relative z-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300/80">
            <Crown className="h-4 w-4" />
            Hệ Thống Ghi Nhận
          </div>
          <h1 className="font-hero text-4xl font-bold tracking-normal text-amber-100 sm:text-6xl">Kim Bảng Đề Danh</h1>
          <div className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-[#eeb337]/30 to-transparent" />
          <p className="mt-3 max-w-xl mx-auto text-xs leading-6 text-gray-400 sm:text-sm">
            Bảng ghi nhận những người chơi có thành tích nổi bật tại Trùng Hoan.
            Bảng được Quản Trị Viên cập nhật thủ công dựa trên thành tích của người chơi.
          </p>
        </div>
        {/* Decorative bottom line */}
        <div className="absolute bottom-0 left-1/2 h-px w-32 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#eeb337]/30 to-transparent" />
      </header>

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 rounded-full border-2 border-[#eeb337]/30 border-t-[#eeb337] animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Top 3 Podium ── */}
          {top3.length > 0 && (
            <section className="pt-2">
              {/* Desktop: 2-1-3 podium layout */}
              <div className="hidden grid-cols-3 items-stretch gap-3 sm:grid">
                {/* Đệ Nhị (left) */}
                {top3.find(e => e.rank === 2) && (
                  <PodiumCard entry={top3.find(e => e.rank === 2)!} />
                )}
                {/* Đệ Nhất (center) */}
                {top3.find(e => e.rank === 1) && (
                  <PodiumCard entry={top3.find(e => e.rank === 1)!} />
                )}
                {/* Đệ Tam (right) */}
                {top3.find(e => e.rank === 3) && (
                  <PodiumCard entry={top3.find(e => e.rank === 3)!} />
                )}
              </div>

              {/* Mobile: stacked 1-2-3 */}
              <div className="space-y-3 sm:hidden">
                {top3.sort((a, b) => a.rank - b.rank).map(entry => (
                  <PodiumCard key={entry.id} entry={entry} />
                ))}
              </div>
            </section>
          )}

          {/* ── Ranks 4-6 ── */}
          {rest.length > 0 && (
            <section className="space-y-3">
              {rest.map(entry => (
                <ListCard key={entry.id} entry={entry} />
              ))}
            </section>
          )}

          {/* ── Summary Table ── */}
          <section className="overflow-hidden rounded-2xl border border-[#eeb337]/15 bg-gradient-to-b from-[#150807] to-[#0a0404]">
            <div className="border-b border-[#eeb337]/15 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#eeb337]/30 bg-[#eeb337]/10">
                  <ScrollText className="h-4 w-4 text-amber-300" />
                </div>
                <h2 className="font-serif text-lg font-bold text-amber-100 sm:text-xl">Xếp Hạng Tổng Hợp</h2>
              </div>
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#eeb337]/10 text-[11px] uppercase tracking-wider text-amber-300/60">
                    <th className="px-6 py-3 text-left font-semibold">Hạng</th>
                    <th className="px-6 py-3 text-left font-semibold">Danh tính</th>
                    <th className="px-6 py-3 text-left font-semibold">Tài phú</th>
                    <th className="px-6 py-3 text-left font-semibold">Dị sự</th>
                    <th className="px-6 py-3 text-left font-semibold">Danh hiệu</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => (
                    <tr key={entry.id} className="border-b border-white/5 transition-colors hover:bg-[#eeb337]/4 last:border-0">
                      <td className="px-6 py-3.5">
                        <span className={`font-serif font-bold ${entry.rank === 1 ? 'text-amber-300' : entry.rank === 2 ? 'text-gray-300' : entry.rank === 3 ? 'text-orange-400' : 'text-[#d7a96d]/80'}`}>
                          {String(entry.rank).padStart(2, '0')}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm font-medium text-amber-100/90">{entry.identity_name || '—'}</td>
                      <td className="px-6 py-3.5 text-sm text-amber-200/80">{entry.wealth || '—'}</td>
                      <td className="px-6 py-3.5 text-sm text-amber-200/80">{entry.quests_completed || '—'}</td>
                      <td className="px-6 py-3.5 text-sm text-amber-200/70">{entry.honor_title || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="divide-y divide-white/5 sm:hidden">
              {entries.map(entry => (
                <div key={entry.id} className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className={`font-serif text-lg font-bold ${entry.rank === 1 ? 'text-amber-300' : entry.rank === 2 ? 'text-gray-300' : entry.rank === 3 ? 'text-orange-400' : 'text-[#d7a96d]/80'}`}>
                      {String(entry.rank).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-amber-100/90">{entry.identity_name || '—'}</p>
                      <p className="text-xs text-gray-500">
                        {entry.wealth || '—'} · {entry.quests_completed} Dị Sự
                        {entry.honor_title && ` · ${entry.honor_title}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Rules ── */}
          <section className="rounded-2xl border border-[#eeb337]/15 bg-gradient-to-b from-[#150807] to-[#0a0404] p-6 sm:p-8">
            <div className="mb-5 flex items-center gap-2.5 border-b border-[#eeb337]/15 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#eeb337]/30 bg-[#eeb337]/10">
                <ScrollText className="h-4 w-4 text-amber-300" />
              </div>
              <h2 className="font-serif text-lg font-bold text-amber-100 sm:text-xl">Quy Tắc Kim Bảng</h2>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-gray-400">
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-300/60" />
                <span>Kim Bảng chỉ ghi nhận 06 vị trí cao nhất.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-300/60" />
                <span>Thứ hạng được xác định dựa trên thành tích Dị Sự và tài phú hiện có của người chơi.</span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-300/60" />
                <span>Kim Bảng có thể được thay đổi sau mỗi lần cập nhật thành tích. Khi thứ hạng thay đổi, thông tin trên bảng sẽ được Quản Trị Viên điều chỉnh tương ứng.</span>
              </li>
            </ul>
            <div className="mt-6 border-t border-[#eeb337]/10 pt-5 text-center">
              <p className="font-script text-base italic text-[#d7a96d]/70">Kim bảng lưu danh, thiên hạ chứng kiến.</p>
              <p className="mt-1 font-script text-base italic text-[#d7a96d]/70">Một bước đề danh, vạn người biết tiếng.</p>
            </div>
          </section>

          {/* ── Closing ── */}
          <div className="rounded-xl border border-[#eeb337]/10 bg-black/20 px-5 py-4 text-center">
            <p className="font-script text-sm italic text-gray-500">
              Kim Bảng không xét danh môn xuất thân. Chỉ xét những gì đã làm được giữa Trùng Hoan.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
