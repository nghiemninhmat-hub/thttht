import { useState, useEffect, useCallback } from 'react';
import { supabase, BachQuyAm } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard, StatGrid } from '@/components/StatCard';
import {
  Ghost, Lock, Unlock, BookOpen, Skull, Search, ChevronDown,
  Eye, EyeOff, AlertTriangle, Flame, Sparkles
} from 'lucide-react';

const DANGER_COLORS: Record<string, string> = {
  'Du Hồn': 'text-blue-300/80',
  'Oán Hồn': 'text-cyan-300/80',
  'Lệ Quỷ': 'text-amber-300/80',
  'Hung Sát': 'text-orange-300/80',
  'Quỷ Tướng': 'text-red-300/80',
  'Quỷ Vương': 'text-rose-400/90',
};

function getDangerColor(level: string): string {
  for (const [key, color] of Object.entries(DANGER_COLORS)) {
    if (level.includes(key)) return color;
  }
  return 'text-amber-300/80';
}

export default function BachQuyAmPage() {
  const { isAdmin } = useAuth();
  const [ghosts, setGhosts] = useState<BachQuyAm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const fetchGhosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('bach_quy_am')
      .select('*')
      .order('display_order', { ascending: true });
    if (error) {
      console.error('Lỗi tải Bách Quỷ Âm:', error.message);
    } else if (data) {
      setGhosts(data as BachQuyAm[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGhosts();
  }, [fetchGhosts]);

  const handleToggleUnlock = async (ghost: BachQuyAm) => {
    if (!isAdmin) return;
    setUnlockingId(ghost.id);
    const newUnlocked = !ghost.is_unlocked;
    const { error } = await supabase
      .from('bach_quy_am')
      .update({
        is_unlocked: newUnlocked,
        unlocked_at: newUnlocked ? new Date().toISOString() : null,
      })
      .eq('id', ghost.id);
    if (error) {
      console.error('Lỗi cập nhật khóa:', error.message);
    } else {
      setGhosts(prev =>
        prev.map(g =>
          g.id === ghost.id
            ? { ...g, is_unlocked: newUnlocked, unlocked_at: newUnlocked ? new Date().toISOString() : null }
            : g
        )
      );
    }
    setUnlockingId(null);
  };

  const filteredGhosts = ghosts.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.classification.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.brief_description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unlockedCount = ghosts.filter(g => g.is_unlocked).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-[#670201]/30 border-t-[#670201] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center relative py-2">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-40 h-px bg-gradient-to-r from-transparent via-[#670201]/40 to-transparent" />
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#670201]/20 border border-[#670201]/30 mb-4 mt-4">
          <Ghost className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-200/80 tracking-widest uppercase font-serif">Sổ Quỷ Tập</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif font-bold text-amber-100/90">Bách Quỷ Âm</h2>
        <p className="text-sm text-gray-500 mt-2 italic">
          Sách do Hệ Thống trao cho người chơi khi bắt đầu. Mỗi mục chỉ hiển thị thông tin sơ lược —
          chi tiết đầy đủ chỉ mở khóa khi tiêu diệt thành công loài quỷ đó.
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Skull className="w-3.5 h-3.5" />
            <span>{ghosts.length} loài quỷ</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-emerald-300/70">
            <Unlock className="w-3.5 h-3.5" />
            <span>{unlockedCount} đã mở khóa</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Lock className="w-3.5 h-3.5" />
            <span>{ghosts.length - unlockedCount} đã khóa</span>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-40 h-px bg-gradient-to-r from-transparent via-[#670201]/40 to-transparent" />
      </div>

      {/* Stats overview */}
      <StatGrid cols={4}>
        <StatCard label="Tổng Số Quỷ" value={ghosts.length} icon={Ghost} accent="gold" />
        <StatCard label="Đã Mở Khóa" value={unlockedCount} icon={Unlock} accent="jade" />
        <StatCard label="Còn Khóa" value={ghosts.length - unlockedCount} icon={Lock} accent="vermilion" />
        <StatCard label="Kết Quả" value={filteredGhosts.length} icon={Search} accent={filteredGhosts.length < ghosts.length ? 'gold' : 'neutral'} hint={filteredGhosts.length < ghosts.length ? 'Đang lọc' : 'Tất cả'} />
      </StatGrid>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, nguồn gốc, hoặc miêu tả..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
        />
      </div>

      {/* Danger progression legend */}
      <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black/20 border border-white/5">
        <span className="text-xs text-gray-600 uppercase tracking-wider">Mức độ nguy hiểm:</span>
        {['Du Hồn', 'Oán Hồn', 'Lệ Quỷ', 'Hung Sát', 'Quỷ Tướng', 'Quỷ Vương'].map((level, i) => (
          <div key={level} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-700 text-xs">→</span>}
            <span className={`text-xs font-semibold ${getDangerColor(level)}`}>{level}</span>
          </div>
        ))}
      </div>

      {/* Ghost entries */}
      <div className="space-y-4">
        {filteredGhosts.map(ghost => {
          const isExpanded = expandedId === ghost.id;
          const isUnlocked = ghost.is_unlocked;
          const showFullDetails = isUnlocked || isAdmin;

          return (
            <article
              key={ghost.id}
              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                isUnlocked
                  ? 'border-[#670201]/30 bg-gradient-to-b from-[#0d0606] to-[#0a0404] shadow-lg shadow-black/10'
                  : 'border-white/10 bg-gradient-to-b from-[#0a0808] to-[#070505]'
              }`}
            >
              {/* Lock badge */}
              <div className="absolute top-0 right-0 m-3 z-10">
                {isUnlocked ? (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-medium">
                    <Unlock className="w-3 h-3" /> Đã mở khóa
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-500 font-medium">
                    <Lock className="w-3 h-3" /> Đã khóa
                  </span>
                )}
              </div>

              {/* Admin unlock toggle */}
              {isAdmin && (
                <button
                  onClick={() => handleToggleUnlock(ghost)}
                  disabled={unlockingId === ghost.id}
                  className={`absolute top-0 right-0 m-3 mt-12 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all disabled:opacity-50 ${
                    isUnlocked
                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20'
                      : 'bg-[#670201]/20 border border-[#670201]/30 text-amber-200 hover:bg-[#670201]/30'
                  }`}
                >
                  {unlockingId === ghost.id ? (
                    <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                  ) : isUnlocked ? (
                    <>
                      <Lock className="w-3 h-3" /> Khóa lại
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3" /> Mở khóa
                    </>
                  )}
                </button>
              )}

              {/* Always-visible header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : ghost.id)}
                className="w-full p-4 sm:p-6 text-left transition-colors hover:bg-[#670201]/[0.04]"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${
                    isUnlocked
                      ? 'bg-[#670201]/20 border border-[#670201]/30'
                      : 'bg-black/30 border border-white/10'
                  }`}>
                    <Ghost className={`w-5 h-5 ${isUnlocked ? 'text-amber-300/80' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-600 font-mono flex-shrink-0">
                        {String(ghost.display_order).padStart(2, '0')}
                      </span>
                      <h3 className="text-base sm:text-xl font-serif font-bold text-amber-100/90 leading-tight">
                        {ghost.name}
                      </h3>
                    </div>
                    <div className="text-xs mb-2">
                      <span className="text-gray-600">Phân loại: </span>
                      <span className="text-gray-400 break-words">{ghost.classification}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pr-8">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/30 border border-white/5 text-xs font-medium ${getDangerColor(ghost.danger_level)}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {ghost.danger_level}
                      </span>
                      {ghost.event_level && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/30 border border-white/5 text-xs text-gray-500">
                          <Flame className="w-3 h-3" />
                          Dị sự: {ghost.event_level}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-10 sm:h-11">
                    <ChevronDown className={`w-5 h-5 text-amber-300/50 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-5 pb-6 sm:px-6 border-t border-[#670201]/15 pt-5">
                  {/* Brief description — always visible */}
                  <div className="mb-4 p-4 rounded-xl bg-black/20 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-amber-300/60" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-300/60">Miêu tả sơ lược</span>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed">{ghost.brief_description}</p>
                  </div>

                  {/* Locked fields */}
                  {showFullDetails ? (
                    <div className="space-y-3">
                      {ghost.weakness && (
                        <DetailField icon={Sparkles} label="Điểm yếu" value={ghost.weakness} accent="text-cyan-300/70" />
                      )}
                      {ghost.appearance && (
                        <DetailField icon={Eye} label="Điều kiện xuất hiện" value={ghost.appearance} />
                      )}
                      {ghost.behavior && (
                        <DetailField icon={Ghost} label="Quy luật hoạt động" value={ghost.behavior} />
                      )}
                      {ghost.destruction && (
                        <DetailField icon={Flame} label="Phương pháp tiêu diệt" value={ghost.destruction} accent="text-red-300/70" />
                      )}
                      {ghost.sealing && (
                        <DetailField icon={Skull} label="Phong ấn" value={ghost.sealing} accent="text-amber-300/70" />
                      )}
                      {isUnlocked && ghost.unlocked_at && (
                        <div className="flex items-center gap-2 pt-2 text-xs text-gray-600">
                          <Unlock className="w-3 h-3" />
                          <span>Mở khóa lúc {new Date(ghost.unlocked_at).toLocaleString('vi-VN')}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl bg-black/30 border border-white/5">
                      <div className="relative">
                        <Lock className="w-10 h-10 text-gray-700" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <EyeOff className="w-4 h-4 text-gray-800" />
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-gray-600 text-center">
                        Thông tin chi tiết đã bị khóa
                      </p>
                      <p className="mt-1 text-xs text-gray-700 text-center">
                        Hoàn thành dị sự và tiêu diệt loài quỷ này để mở khóa đầy đủ thông tin
                      </p>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {filteredGhosts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Ghost className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Không tìm thấy loài quỷ nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailField({
  icon: Icon,
  label,
  value,
  accent = 'text-gray-300',
}: {
  icon: typeof Ghost;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 p-3 rounded-lg bg-black/20 border border-white/5">
      <div className="flex items-center gap-2 sm:min-w-[180px] flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-amber-300/50" />
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-300/50">{label}</span>
      </div>
      <p className={`text-sm leading-relaxed ${accent}`}>{value}</p>
    </div>
  );
}
