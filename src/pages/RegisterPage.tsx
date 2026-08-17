import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { UserPlus, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ocName, setOcName] = useState('');
  const [gender, setGender] = useState('Nam');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);

  const wordCount = bio.trim() ? bio.trim().split(/\s+/).length : 0;

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('registration_open')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        setRegistrationOpen(data ? data.registration_open : false);
      });
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (wordCount > 100) {
      setError('Trích dẫn vượt quá giới hạn 100 từ!');
      return;
    }

    setLoading(true);
    const { error: signUpError, data } = await signUp(email, password);

    if (signUpError) {
      setError(`Lỗi: ${signUpError}`);
      setLoading(false);
      return;
    }

    if (data?.user) {
      const anonymousName = `Vô Danh #${Math.floor(Math.random() * 9000) + 1000}`;
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: data.user.id,
          email,
          oc_name: ocName,
          gender,
          bio,
          avatar_url: avatarUrl || null,
          hua_tien: 300,
          cong_duc: 30,
          am_duc: 0,
          is_approved: false,
          anonymous_name: anonymousName,
        },
      ]);

      if (profileError) {
        setError(`Lỗi tạo hồ sơ: ${profileError.message}`);
      } else {
        setMessage('Đăng ký thành công! Vui lòng chờ Quản trị viên phê duyệt tài khoản.');
        setTimeout(() => navigate('/login'), 3000);
      }
    }
    setLoading(false);
  };

  const inputClass =
    'w-full rounded-sm border border-[#eeb337]/15 bg-[#0d0807]/60 px-4 py-3 text-sm text-[#f3dca8] placeholder-[#8a6a4a]/50 transition-colors focus:border-[#eeb337]/55 focus:outline-none focus:ring-1 focus:ring-[#eeb337]/30';
  const labelClass = 'mb-1.5 block text-xs uppercase tracking-[0.18em] text-[#d7a96d]/70';

  if (registrationOpen === null) {
    return <div className="mx-auto max-w-lg pt-16 text-center text-[#8a6a4a]">Đang tải…</div>;
  }

  return (
    <div className="relative mx-auto max-w-lg pt-8">
      <div className="pointer-events-none absolute -inset-x-10 -top-4 -bottom-4 -z-10 rounded-[2rem] bg-gradient-to-b from-[#3d130e]/40 via-transparent to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-sm border border-[#eeb337]/25 bg-gradient-to-b from-[#24100c]/90 to-[#170b09]/95 p-8 shadow-[0_30px_80px_rgba(13,8,7,0.45)]">
        <div className="pointer-events-none absolute -top-px left-1/2 h-px w-40 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#eeb337]/70 to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#eeb337]/10 blur-3xl" />

        <div className="relative mb-8 text-center">
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#eeb337]/50 bg-gradient-to-br from-[#b73720] to-[#5c160f] shadow-[0_0_28px_rgba(238,179,55,0.18)]">
            <UserPlus className="h-7 w-7 text-[#fff1cf]" />
          </div>
          <h2 className="font-serif text-2xl font-bold tracking-wide text-[#fff1cf]">Đăng Ký Nhập Vụ</h2>
          <p className="mt-2 text-xs uppercase tracking-[0.28em] text-[#d7a96d]/60">Trùng Hoan Tái — Nơi linh hồn bị giam cầm</p>
        </div>

        {!registrationOpen ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#b73720]/40 bg-[#b73720]/15">
              <Lock className="h-6 w-6 text-[#f2a06b]" />
            </div>
            <p className="font-serif text-lg font-bold text-[#fff1cf]">Cổng Đăng Ký Đã Khóa</p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#c9b493]/70">
              Hiện tại hệ thống chưa mở cổng đăng ký. Vui lòng chờ Quản trị viên mở lại để có thể gửi hồ sơ nhập vụ.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" name="email" autoComplete="email" spellCheck={false} placeholder="email@example.com…" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Mật khẩu</label>
              <input type="password" name="password" autoComplete="new-password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Danh tính OC</label>
              <input type="text" name="oc-name" autoComplete="off" placeholder="Tên nhân vật của bạn…" value={ocName} onChange={e => setOcName(e.target.value)} required className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Giới tính</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className={`${inputClass} appearance-none`}>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className={labelClass}>Trích dẫn</label>
                <span className={`text-xs ${wordCount > 100 ? 'text-[#f2a06b]' : 'text-[#8a6a4a]/70'}`}>
                  {wordCount}/100 từ
                </span>
              </div>
              <textarea placeholder="Câu nói tiêu biểu của nhân vật (tối đa 100 từ)…" value={bio} onChange={e => setBio(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
            </div>

            <div>
              <label className={labelClass}>Link ảnh đại diện</label>
              <input type="text" name="avatar-url" autoComplete="url" placeholder="https://…" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className={inputClass} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-sm border border-[#eeb337]/45 bg-gradient-to-r from-[#8f2418] to-[#b73720] py-3.5 font-bold uppercase tracking-[0.18em] text-[#fff1cf] shadow-[0_12px_30px_rgba(92,22,15,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(238,179,55,0.18)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Đang gửi hồ sơ…' : 'Gửi Hồ Sơ Phê Duyệt'}
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-[#b73720]/40 bg-[#b73720]/15 p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-[#f2a06b]" />
            <p className="text-xs text-[#f2a06b]">{error}</p>
          </div>
        )}

        {message && (
          <div className="mt-4 flex items-center gap-2 rounded-sm border border-[#eeb337]/35 bg-[#eeb337]/10 p-3">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#f6ca62]" />
            <p className="text-xs text-[#f6ca62]">{message}</p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-[#8a6a4a]">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-[#f6ca62] transition-colors hover:text-[#fff1cf]">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
