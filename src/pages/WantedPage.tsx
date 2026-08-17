import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, WantedNotice } from '@/lib/supabase';
import {
  AlertTriangle, CalendarDays, CheckCircle2, ChevronDown, CircleDot, Clock3,
  Eye, FileWarning, KeyRound, MapPin, Plus, ShieldAlert, Target, UserRound,
  X, Loader2, Send, Lock, Ghost
} from 'lucide-react';

const defaultWantedImage = '/images/wanted/569353577901495689.jpg';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon: typeof Target }) {
  return (
    <div className="mb-3 flex items-center gap-2.5 border-b border-[#670201]/25 pb-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#670201]/40 bg-[#670201]/15">
        <Icon className="h-3.5 w-3.5 text-amber-300" />
      </div>
      <h3 className="font-serif text-sm font-bold tracking-wide text-amber-100 sm:text-base">{children}</h3>
    </div>
  );
}

function DetailRow({ label, children, accent = false }: { label: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="grid gap-1 border-b border-white/5 py-2.5 last:border-0 sm:grid-cols-[140px_1fr] sm:gap-5">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</dt>
      <dd className={`text-sm leading-6 ${accent ? 'font-semibold text-amber-100' : 'text-gray-300'}`}>{children}</dd>
    </div>
  );
}

function WantedCard({ notice }: { notice: WantedNotice }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = notice.status === 'active';
  const isCompleted = notice.status === 'completed';

  return (
    <article className="overflow-hidden rounded-2xl border border-[#670201]/30 bg-gradient-to-b from-[#0f0606] to-[#080405] shadow-[0_8px_40px_rgba(0,0,0,0.25)] transition-all duration-300 hover:border-[#670201]/50">
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 p-4 text-left sm:p-5"
        aria-expanded={expanded}
      >
        {/* Avatar thumbnail */}
        <div className="relative flex-shrink-0">
          <div className="h-16 w-16 overflow-hidden rounded-xl border-2 border-[#670201]/40 bg-gradient-to-br from-[#670201] to-[#a00404] sm:h-20 sm:w-20">
            {notice.avatar_url ? (
              <img src={notice.avatar_url} alt={notice.target_name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserRound className="h-8 w-8 text-amber-100/60" />
              </div>
            )}
          </div>
          {isActive && (
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0f0606] bg-emerald-500">
              <CircleDot className="h-2.5 w-2.5 text-white" />
            </div>
          )}
          {isCompleted && (
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0f0606] bg-gray-500">
              <CheckCircle2 className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Name + code */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-serif text-lg font-bold text-amber-100 sm:text-xl">{notice.target_name}</h2>
            {isActive && (
              <span className="hidden flex-shrink-0 items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 sm:inline-flex">
                <CircleDot className="h-2.5 w-2.5 animate-pulse" /> Đang truy nã
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {notice.code && (
              <span className="font-mono text-xs font-bold tracking-widest text-amber-300/80">{notice.code}</span>
            )}
            {notice.occupation && (
              <span className="text-xs text-gray-500">{notice.occupation}</span>
            )}
          </div>
          {notice.reward_amount && (
            <p className="mt-1 truncate text-xs text-amber-200/70">
              <span className="text-gray-600">Thưởng: </span>{notice.reward_amount}
            </p>
          )}
        </div>

        {/* Expand chevron */}
        <div className={`flex-shrink-0 rounded-lg bg-white/5 p-2 text-gray-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
          <ChevronDown className="h-5 w-5" />
        </div>
      </button>

      {/* Expanded detail */}
      <div className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="border-t border-[#670201]/25 px-4 pb-5 pt-4 sm:px-5">
            <section className="mb-6">
              <SectionTitle icon={UserRound}>Thông Tin Nhận Dạng</SectionTitle>
              <dl>
                <DetailRow label="Giới tính / Tuổi">{notice.gender || 'Không rõ'}{notice.age ? ` · ${notice.age}` : ''}</DetailRow>
                {notice.occupation && <DetailRow label="Nghề nghiệp">{notice.occupation}</DetailRow>}
                {notice.organization && <DetailRow label="Tổ chức">{notice.organization}</DetailRow>}
                {notice.identifying_features && <DetailRow label="Đặc điểm nhận dạng">{notice.identifying_features}</DetailRow>}
              </dl>
            </section>

            <section className="mb-6">
              <SectionTitle icon={AlertTriangle}>Lý Do & Nhiệm Vụ</SectionTitle>
              <dl>
                <DetailRow label="Lý do truy nã">{notice.reason}</DetailRow>
                {notice.task_requirement && <DetailRow label="Yêu cầu nhiệm vụ">{notice.task_requirement}</DetailRow>}
                {notice.completion_condition && <DetailRow label="Điều kiện hoàn thành">{notice.completion_condition}</DetailRow>}
              </dl>
            </section>

            {(notice.reward_amount || notice.reward_method) && (
              <section className="mb-6 rounded-xl border border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-transparent p-4">
                <SectionTitle icon={KeyRound}>Phần Thưởng</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  {notice.reward_amount && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500">Mức thưởng</p>
                      <p className="mt-1 font-serif text-lg font-bold text-amber-200">{notice.reward_amount}</p>
                    </div>
                  )}
                  {notice.reward_method && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500">Hình thức nhận</p>
                      <p className="mt-1 text-sm font-semibold text-gray-200">{notice.reward_method}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Status footer */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className={`rounded-lg border p-3 ${isActive ? 'border-emerald-400/20 bg-emerald-400/5' : 'border-gray-500/20 bg-gray-500/5'}`}>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Trạng thái</p>
                <p className={`mt-1 flex items-center gap-1.5 text-sm font-bold ${isActive ? 'text-emerald-300' : 'text-gray-300'}`}>
                  {isActive ? <><CircleDot className="h-3.5 w-3.5 animate-pulse" /> Đang truy nã</> : <><CheckCircle2 className="h-3.5 w-3.5" /> Đã hoàn thành</>}
                </p>
              </div>
              {notice.published_at && (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Ngày phát lệnh</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                    <CalendarDays className="h-3.5 w-3.5 text-amber-300/70" /> {formatDate(notice.published_at)}
                  </p>
                </div>
              )}
              {notice.deadline && (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">Thời hạn</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-200">
                    <Clock3 className="h-3.5 w-3.5 text-amber-300/70" /> {notice.deadline}
                  </p>
                </div>
              )}
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Mã lệnh</p>
                <p className="mt-1 font-mono text-sm font-bold tracking-widest text-amber-100">{notice.code || '—'}</p>
              </div>
            </div>

            <p className="mt-4 text-xs italic leading-6 text-gray-600">
              Lưu ý: Danh tính người phát lệnh được Hệ Thống mã hóa và bảo mật tuyệt đối. Đối tượng truy nã không có quyền truy xuất thông tin này.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function SubmitForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    target_name: '', gender: '', age: '', occupation: '', organization: '',
    identifying_features: '', reason: '', task_requirement: '', completion_condition: '',
    avatar_url: '', reward_amount: '', reward_method: '', deadline: '',
  });

  if (!user) return null;

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.target_name.trim() || !form.reason.trim()) {
      setError('Vui lòng điền ít nhất tên đối tượng và lý do truy nã.');
      return;
    }
    setSubmitting(true);
    setError('');
    const { error: insertError } = await supabase.from('wanted_notices').insert([{ ...form }]);
    setSubmitting(false);
    if (insertError) {
      setError(`Lỗi: ${insertError.message}`);
      return;
    }
    setSuccess(true);
    setForm({
      target_name: '', gender: '', age: '', occupation: '', organization: '',
      identifying_features: '', reason: '', task_requirement: '', completion_condition: '',
      avatar_url: '', reward_amount: '', reward_method: '', deadline: '',
    });
    setTimeout(() => { setSuccess(false); setOpen(false); }, 2500);
    onSubmitted();
  };

  const inputClass = "w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all";
  const labelClass = "text-[10px] font-semibold uppercase tracking-wider text-gray-500";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-[#670201]/40 bg-[#670201]/15 px-4 py-2.5 text-sm font-bold text-amber-100 transition-all hover:bg-[#670201]/30"
      >
        <Plus className="h-4 w-4" /> Phát Lệnh Truy Nã
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-[#670201]/30 bg-gradient-to-b from-[#150807] to-[#0a0404] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#670201]/25 bg-[#150807]/95 px-5 py-4 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <FileWarning className="h-5 w-5 text-red-300" />
                <h2 className="font-serif text-lg font-bold text-amber-100">Phát Lệnh Truy Nã Mới</h2>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg bg-white/5 p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-amber-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {success ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                  <p className="text-sm font-semibold text-emerald-300">Lệnh truy nã đã được gửi. Vui lòng chờ Hệ Thống duyệt.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-2 rounded-lg border border-amber-300/15 bg-amber-300/5 p-3">
                    <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-300/70" />
                    <p className="text-xs leading-5 text-gray-400">Danh tính người phát lệnh được Hệ Thống mã hóa bảo mật. Người khác không thể biết bạn đã phát lệnh này.</p>
                  </div>

                  <section>
                    <SectionTitle icon={UserRound}>Đối Tượng Truy Nã</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className={labelClass}>Tên nhân vật *</label>
                        <input value={form.target_name} onChange={e => update('target_name', e.target.value)} placeholder="Tên đối tượng" className={inputClass} />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClass}>Giới tính</label>
                        <select value={form.gender} onChange={e => update('gender', e.target.value)} className={inputClass}>
                          <option value="">— Chọn —</option>
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClass}>Tuổi</label>
                        <input value={form.age} onChange={e => update('age', e.target.value)} placeholder="VD: 29" className={inputClass} />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClass}>Nghề nghiệp</label>
                        <input value={form.occupation} onChange={e => update('occupation', e.target.value)} placeholder="Nghề nghiệp hiện tại" className={inputClass} />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className={labelClass}>Tổ chức</label>
                        <input value={form.organization} onChange={e => update('organization', e.target.value)} placeholder="Tên tổ chức / Không thuộc tổ chức" className={inputClass} />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className={labelClass}>Đặc điểm nhận dạng</label>
                        <textarea value={form.identifying_features} onChange={e => update('identifying_features', e.target.value)} rows={3} placeholder="Mô tả ngoại hình, đặc điểm dễ nhận biết..." className={`${inputClass} resize-none`} />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className={labelClass}>Ảnh đại diện (liên kết)</label>
                        <input value={form.avatar_url} onChange={e => update('avatar_url', e.target.value)} placeholder="Dán liên kết ảnh (http...)" className={inputClass} />
                      </div>
                    </div>
                  </section>

                  <section>
                    <SectionTitle icon={AlertTriangle}>Lý Do & Nhiệm Vụ</SectionTitle>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className={labelClass}>Lý do truy nã *</label>
                        <textarea value={form.reason} onChange={e => update('reason', e.target.value)} rows={3} placeholder="Lý do và mục đích truy nã..." className={`${inputClass} resize-none`} />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClass}>Yêu cầu nhiệm vụ</label>
                        <textarea value={form.task_requirement} onChange={e => update('task_requirement', e.target.value)} rows={2} placeholder="Hành động cần thực hiện..." className={`${inputClass} resize-none`} />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClass}>Điều kiện hoàn thành</label>
                        <textarea value={form.completion_condition} onChange={e => update('completion_condition', e.target.value)} rows={2} placeholder="Tiêu chí hoàn thành nhiệm vụ..." className={`${inputClass} resize-none`} />
                      </div>
                    </div>
                  </section>

                  <section>
                    <SectionTitle icon={KeyRound}>Phần Thưởng</SectionTitle>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className={labelClass}>Mức thưởng</label>
                        <input value={form.reward_amount} onChange={e => update('reward_amount', e.target.value)} placeholder="VD: 500 Hoa Tiền + 70 Công Đức" className={inputClass} />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClass}>Hình thức nhận thưởng</label>
                        <input value={form.reward_method} onChange={e => update('reward_method', e.target.value)} placeholder="Trao trực tiếp / Hệ Thống trung gian..." className={inputClass} />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <label className={labelClass}>Thời hạn truy nã</label>
                        <input value={form.deadline} onChange={e => update('deadline', e.target.value)} placeholder="Không thời hạn / Đến ngày XX/XX/XXXX" className={inputClass} />
                      </div>
                    </div>
                  </section>

                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
                      <p className="text-xs text-red-300">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3 border-t border-white/10 pt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 rounded-lg bg-[#670201] px-5 py-2.5 text-sm font-bold text-amber-100 transition-all hover:bg-[#a00404] disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {submitting ? 'Đang gửi...' : 'Gửi Lệnh Truy Nã'}
                    </button>
                    <button onClick={() => setOpen(false)} className="rounded-lg bg-white/5 px-4 py-2.5 text-sm font-bold text-gray-400 transition-all hover:bg-white/10">
                      Hủy
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function WantedPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<WantedNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [mySubmissions, setMySubmissions] = useState<WantedNotice[]>([]);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wanted_notices')
      .select('id, target_name, gender, age, occupation, organization, identifying_features, reason, task_requirement, completion_condition, avatar_url, reward_amount, reward_method, deadline, status, code, published_at, created_at')
      .in('status', ['active', 'completed'])
      .order('published_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Lỗi tải lệnh truy nã:', error.message);
    } else {
      setNotices(data as WantedNotice[]);
    }

    if (user) {
      const { data: mine } = await supabase
        .from('wanted_notices')
        .select('id, target_name, gender, age, occupation, organization, identifying_features, reason, task_requirement, completion_condition, avatar_url, reward_amount, reward_method, deadline, status, code, published_at, created_at')
        .eq('submitter_id', user.id)
        .in('status', ['pending', 'rejected'])
        .order('created_at', { ascending: false });
      if (mine) setMySubmissions(mine as WantedNotice[]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const activeCount = notices.filter(n => n.status === 'active').length;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl border border-[#670201]/35 bg-gradient-to-br from-[#1b0807] via-[#100607] to-[#080405] px-5 py-6 sm:px-8 sm:py-7">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#a00404]/15 blur-3xl" />
        <div className="absolute -bottom-28 left-1/3 h-60 w-80 rounded-full bg-amber-900/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300/80">
              <ShieldAlert className="h-4 w-4" />
              Công Báo Của Hệ Thống
            </div>
            <h1 className="font-hero text-4xl font-bold tracking-normal text-amber-100 sm:text-6xl">Bảng Truy Nã</h1>
            <p className="mt-2 max-w-xl text-xs leading-6 text-gray-400 sm:text-sm">Hồ sơ những đối tượng đang bị truy tìm trong Trùng Hoan Tái. Mọi lệnh đều được Hệ Thống xác nhận và ghi vết.</p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <div className="flex w-fit items-center gap-2.5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5 text-emerald-300">
              <CircleDot className="h-4 w-4 animate-pulse" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-300/60">Hồ sơ đang mở</p>
                <p className="text-sm font-bold">{String(activeCount).padStart(2, '0')} Lệnh Truy Nã</p>
              </div>
            </div>
            {user && <SubmitForm onSubmitted={fetchNotices} />}
          </div>
        </div>
      </header>

      {/* My pending submissions */}
      {mySubmissions.length > 0 && (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-amber-300/70" />
            <h3 className="text-sm font-bold text-amber-200/90">Lệnh của bạn đang chờ duyệt</h3>
          </div>
          <div className="space-y-2">
            {mySubmissions.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-black/20 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-amber-100/90">{s.target_name}</p>
                  <p className="truncate text-xs text-gray-500">{s.reason}</p>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${s.status === 'rejected' ? 'bg-red-500/15 text-red-300' : 'bg-amber-500/15 text-amber-300'}`}>
                  {s.status === 'rejected' ? 'Bị từ chối' : 'Chờ duyệt'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notice list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 rounded-full border-2 border-[#670201]/30 border-t-[#670201] animate-spin" />
        </div>
      ) : notices.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-black/20 py-16 text-center">
          <Ghost className="h-10 w-10 text-gray-700" />
          <p className="text-sm text-gray-500">Chưa có lệnh truy nã nào được công bố.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map(notice => (
            <WantedCard key={notice.id} notice={notice} />
          ))}
        </div>
      )}
    </div>
  );
}
