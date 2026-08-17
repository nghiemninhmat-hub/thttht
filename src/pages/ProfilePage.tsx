import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Transaction, InventoryItem, CURRENCY_LABELS } from '@/lib/supabase';
import { StatCard, StatGrid } from '@/components/StatCard';
import {
  UserCircle, Coins, Sparkles, Skull, Package, History, Edit3,
  CheckCircle2, Clock, AlertCircle, Ghost, Plus, Minus, Send,
  Heart, Sparkle, Brain, ShieldCheck, Camera, X, Loader2, Upload, Link,
  ArrowRight, Shield, Crown, Mail, Eye, EyeOff
} from 'lucide-react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import VisitorProfileCard from '@/components/VisitorProfileCard';

export default function ProfilePage() {
  const { id: visitorId } = useParams<{ id: string }>();
  const { user, profile, refreshProfile, isAdmin } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [editing, setEditing] = useState(false);
  const [ocName, setOcName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [anonName, setAnonName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Self-currency adjustment state
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState('add');
  const [adjustCurrency, setAdjustCurrency] = useState('HUA_TIEN');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState('');

  // Transfer state
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');

  // Avatar quick-change state
  const [avatarEditing, setAvatarEditing] = useState(false);
  const [avatarInput, setAvatarInput] = useState('');
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarPreviewOk, setAvatarPreviewOk] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMode, setAvatarMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [emailVisible, setEmailVisible] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [txRes, invRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('inventories').select('*, shop_items(*)').eq('user_id', user.id).order('acquired_at', { ascending: false }),
    ]);
    if (txRes.error) {
      console.error('Lỗi tải giao dịch:', txRes.error.message);
    } else {
      setTransactions(txRes.data as Transaction[]);
    }
    if (invRes.error) {
      console.error('Lỗi tải kho vật phẩm:', invRes.error.message);
    } else {
      setInventory(invRes.data as InventoryItem[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (profile) {
      setOcName(profile.oc_name);
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || '');
      setAnonName(profile.anonymous_name || '');
    }
  }, [profile]);

  if (visitorId && user && visitorId !== user.id) {
    return <VisitorProfileCard />;
  }

  const handleSave = async () => {
    if (!user || !profile) return;
    const updates: any = { bio };
    if (anonName !== profile.anonymous_name && profile.anonymous_name_changes < 3) {
      updates.anonymous_name = anonName;
      updates.anonymous_name_changes = profile.anonymous_name_changes + 1;
    } else if (anonName !== profile.anonymous_name) {
      setMessage('Bạn đã hết lượt đổi danh tính ẩn danh (tối đa 3 lần)!');
      return;
    }
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) {
      setMessage(`Lỗi: ${error.message}`);
    } else {
      setMessage('Cập nhật hồ sơ thành công!');
      setEditing(false);
      refreshProfile();
    }
    setTimeout(() => setMessage(''), 4000);
  };

  const handleSaveAvatar = async () => {
    if (!user || !profile) return;
    const url = avatarInput.trim();
    if (!url) {
      setAvatarError('Vui lòng nhập liên kết ảnh hoặc chọn tệp từ thiết bị.');
      return;
    }
    try { new URL(url); } catch {
      setAvatarError('Liên kết không hợp lệ. Hãy dán đường dẫn ảnh đầy đủ (bắt đầu bằng http...).');
      return;
    }
    setAvatarSaving(true);
    setAvatarError('');
    const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
    setAvatarSaving(false);
    if (error) {
      setAvatarError(`Lỗi: ${error.message}`);
      return;
    }
    setAvatarUrl(url);
    setAvatarEditing(false);
    setAvatarInput('');
    setAvatarPreviewOk(true);
    setMessage('Đổi ảnh đại diện thành công!');
    refreshProfile();
    setTimeout(() => setMessage(''), 4000);
  };

  const handleFileUpload = async (file: File) => {
    if (!user || !profile) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', ''];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Chỉ chấp nhận ảnh JPG, PNG, WebP hoặc GIF.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Ảnh quá lớn — tối đa 2MB.');
      return;
    }
    setAvatarUploading(true);
    setAvatarError('');
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (uploadError) {
      setAvatarUploading(false);
      setAvatarError(`Lỗi tải lên: ${uploadError.message}`);
      return;
    }
    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);
    setAvatarUploading(false);
    if (updateError) {
      setAvatarError(`Lỗi lưu hồ sơ: ${updateError.message}`);
      return;
    }
    setAvatarUrl(publicUrl);
    setAvatarEditing(false);
    setAvatarInput('');
    setMessage('Đổi ảnh đại diện thành công!');
    refreshProfile();
    setTimeout(() => setMessage(''), 4000);
  };

  const handleAdjustCurrency = async () => {
    if (!user || !profile) return;
    setAdjusting(true);
    setAdjustError('');
    try {
      const rawAmount = parseInt(adjustAmount, 10);
      if (isNaN(rawAmount) || rawAmount <= 0) {
        setAdjustError('Vui lòng nhập số tiền hợp lệ (lớn hơn 0).');
        setAdjusting(false);
        return;
      }
      if (!adjustReason.trim()) {
        setAdjustError('Vui lòng điền lý do giao dịch.');
        setAdjusting(false);
        return;
      }
      const signedAmount = adjustType === 'subtract' ? -rawAmount : rawAmount;
      const { data, error: rpcError } = await supabase.rpc('self_adjust_currency', {
        p_amount: signedAmount,
        p_currency_type: adjustCurrency,
        p_reason: adjustReason.trim(),
      });
      if (rpcError) throw rpcError;
      if (data && data.success) {
        setMessage('Giao dịch thành công! Số dư đã được cập nhật.');
        setAdjustOpen(false);
        setAdjustAmount('');
        setAdjustReason('');
        setAdjustType('add');
        setAdjustCurrency('HUA_TIEN');
        await refreshProfile();
        await fetchData();
      }
    } catch (err: any) {
      setAdjustError(err.message || 'Giao dịch thất bại. Vui lòng thử lại.');
    } finally {
      setAdjusting(false);
    }
  };

  const handleTransfer = async () => {
    if (!user || !profile) return;
    setTransferring(true);
    setTransferError('');
    try {
      const rawAmount = parseInt(transferAmount, 10);
      if (isNaN(rawAmount) || rawAmount <= 0) {
        setTransferError('Số tiền chuyển phải lớn hơn 0.');
        setTransferring(false);
        return;
      }
      if (!transferRecipient.trim()) {
        setTransferError('Vui lòng nhập tên OC của người nhận.');
        setTransferring(false);
        return;
      }
      if (!transferReason.trim()) {
        setTransferError('Vui lòng nhập lý do chuyển khoản.');
        setTransferring(false);
        return;
      }
      const { data, error: rpcError } = await supabase.rpc('transfer_hua_tien', {
        p_recipient_name: transferRecipient.trim(),
        p_amount: rawAmount,
        p_reason: transferReason.trim(),
      });
      if (rpcError) throw rpcError;
      if (data && data.success) {
        setMessage(`Đã chuyển ${rawAmount} Hoa Tiền cho ${data.recipient_name} thành công!`);
        setTransferOpen(false);
        setTransferRecipient('');
        setTransferAmount('');
        setTransferReason('');
        await refreshProfile();
        await fetchData();
      }
    } catch (err: any) {
      setTransferError(err.message || 'Chuyển khoản thất bại. Vui lòng thử lại.');
    } finally {
      setTransferring(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-[#670201]/30 border-t-[#670201] animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Không tìm thấy hồ sơ. Vui lòng đăng nhập lại.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Profile Card */}
      <div className="p-5 sm:p-6 lg:p-8 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          {/* Avatar — larger on mobile, centered; side-by-side on desktop */}
          <div className="flex-shrink-0 flex flex-col items-center gap-3">
            <div className="relative group">
              {/* Outer ornamental glow ring */}
              <div className="absolute -inset-2 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(214,65,46,0.25),rgba(140,17,17,0.1)_50%,transparent_75%)] blur-md" />
              {/* Thin decorative ring */}
              <div className="absolute -inset-1.5 rounded-full border border-[#670201]/30" />
              {/* Avatar frame — circular, blood-moon style */}
              <div className="relative w-28 h-28 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-full overflow-hidden border-[3px] border-[#670201]/50 shadow-xl shadow-black/50 bg-gradient-to-br from-[#670201] to-[#a00404]">
                {/* Inner rim highlight */}
                <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-amber-200/10 pointer-events-none z-10" />
                {avatarEditing ? (
                  avatarMode === 'url' && avatarInput ? (
                    <img src={avatarInput} alt="preview" className="w-full h-full object-cover" onError={() => setAvatarPreviewOk(false)} onLoad={() => setAvatarPreviewOk(true)} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-amber-100/80" />
                    </div>
                  )
                ) : profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.oc_name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserCircle className="w-16 h-16 sm:w-20 sm:h-20 text-amber-100/80" />
                  </div>
                )}
              </div>
              {/* Change avatar button — overlay on image */}
              {!avatarEditing && (
                <button
                  onClick={() => { setAvatarEditing(true); setAvatarInput(profile.avatar_url || ''); setAvatarError(''); setAvatarPreviewOk(true); setAvatarMode('upload'); }}
                  className="absolute bottom-0 right-0 m-1 sm:m-2 p-2 sm:p-2.5 rounded-full bg-[#670201]/90 hover:bg-[#a00404] text-amber-100 shadow-lg transition-all backdrop-blur-sm border border-amber-300/20"
                  title="Đổi ảnh đại diện"
                  aria-label="Đổi ảnh đại diện"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 w-full space-y-3 text-center sm:text-left">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-100/90 break-words">
                  {editing ? ocName : profile.oc_name}
                </h2>
                <div className="flex flex-col gap-2 mt-2 items-center sm:items-start">
                  {profile.danh_vong && profile.danh_vong !== 'Vô Danh' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#670201]/30 to-[#a00404]/20 border border-amber-500/30 text-xs font-bold text-amber-200 tracking-wider">
                      <Crown className="w-3 h-3 text-amber-300" />
                      {profile.danh_vong}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setEmailVisible(v => !v)}
                    className="group inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-amber-200/80"
                    aria-label={emailVisible ? 'Ẩn email' : 'Hiện email'}
                  >
                    <Mail className="h-3.5 w-3.5 text-gray-600 transition-colors group-hover:text-amber-300/70" />
                    <span className="tabular-nums tracking-wide">
                      {emailVisible ? profile.email : '••••••@••••••'}
                    </span>
                    {emailVisible ? (
                      <EyeOff className="h-3.5 w-3.5 text-gray-600 transition-colors group-hover:text-amber-300/70" />
                    ) : (
                      <Eye className="h-3.5 w-3.5 text-gray-600 transition-colors group-hover:text-amber-300/70" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {profile.is_approved ? (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã phê duyệt
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    <Clock className="w-3.5 h-3.5" /> Chờ phê duyệt
                  </span>
                )}
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-amber-100 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Sửa
                  </button>
                )}
                {isAdmin && (
                  <RouterLink
                    to="/admin"
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#670201]/30 hover:bg-[#670201]/50 text-xs text-amber-100 font-bold transition-all border border-[#670201]/40"
                  >
                    <Shield className="w-3.5 h-3.5" /> Bảng Điều Khiển
                  </RouterLink>
                )}
              </div>
            </div>

            {editing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={ocName}
                  readOnly
                  placeholder="Danh tính OC"
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">Danh tính OC do quản trị viên đặt — không thể tự sửa.</p>
                <input
                  type="text"
                  value={anonName}
                  onChange={e => setAnonName(e.target.value)}
                  placeholder="Danh tính ẩn danh"
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all"
                />
                <p className="text-xs text-gray-500">
                  Đổi danh tính ẩn danh còn: {3 - profile.anonymous_name_changes} lần
                </p>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Trích dẫn..."
                  rows={3}
                  className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="px-4 py-2 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-xs font-bold rounded-lg transition-all">
                    Lưu
                  </button>
                  <button onClick={() => setEditing(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold rounded-lg transition-all">
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm">
                  <Ghost className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-400">Ẩn danh:</span>
                  <span className="text-amber-200/80">{profile.anonymous_name || 'Vô Danh'}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm">
                  <span className="text-gray-400">Giới tính:</span>
                  <span className="text-gray-300">{profile.gender}</span>
                </div>
                {profile.bio && (
                  <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                    <p className="text-sm text-gray-400 italic">"{profile.bio}"</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {avatarEditing && (
          <div className="mt-5 p-4 sm:p-5 rounded-xl bg-black/40 border border-[#670201]/30 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-amber-100/90 flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-300/70" />
                Đổi ảnh đại diện
              </h4>
              <button
                onClick={() => { setAvatarEditing(false); setAvatarError(''); setAvatarInput(''); }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Mode toggle */}
            <div className="flex gap-2 p-1 bg-black/30 rounded-lg">
              <button
                onClick={() => setAvatarMode('upload')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-md transition-all ${avatarMode === 'upload' ? 'bg-[#670201] text-amber-100' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <Upload className="w-4 h-4" /> Tải ảnh lên
              </button>
              <button
                onClick={() => setAvatarMode('url')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-md transition-all ${avatarMode === 'url' ? 'bg-[#670201] text-amber-100' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <Link className="w-4 h-4" /> Dán liên kết
              </button>
            </div>
            {/* Upload mode */}
            {avatarMode === 'upload' && (
              <div>
                <label
                  className={`w-full flex flex-col items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-[#670201]/40 hover:border-[#670201] bg-[#670201]/5 hover:bg-[#670201]/15 text-amber-100 text-sm font-bold rounded-xl transition-all min-h-[120px] ${avatarUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
                >
                  {avatarUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-7 h-7" />}
                  <span>{avatarUploading ? 'Đang tải lên...' : 'Chọn ảnh từ thiết bị'}</span>
                  <span className="text-[10px] text-gray-500 font-normal">JPG, PNG, WebP, GIF — tối đa 2MB</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="absolute w-0 h-0 opacity-0 overflow-hidden"
                    tabIndex={-1}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            )}
            {/* URL mode */}
            {avatarMode === 'url' && (
              <div className="space-y-3">
                <input
                  type="url"
                  value={avatarInput}
                  onChange={e => { setAvatarInput(e.target.value); setAvatarError(''); setAvatarPreviewOk(true); }}
                  placeholder="Dán liên kết ảnh (http...)"
                  className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all"
                />
                <button
                  onClick={handleSaveAvatar}
                  disabled={avatarSaving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all disabled:opacity-50"
                >
                  {avatarSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Lưu liên kết
                </button>
                {!avatarPreviewOk && avatarInput && <p className="text-xs text-amber-400">Không tải được ảnh — kiểm tra lại liên kết.</p>}
              </div>
            )}
            {avatarError && <p className="text-xs text-red-400">{avatarError}</p>}
          </div>
        )}
        {message && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs text-emerald-300">{message}</p>
          </div>
        )}
      </div>

      {/* Currencies + counts */}
      <StatGrid cols={4}>
        <StatCard label="Hoa Tiền" value={profile.hua_tien} icon={Coins} accent="gold" />
        <StatCard label="Công Đức" value={profile.cong_duc} icon={Sparkles} accent="gold" />
        <StatCard label="Âm Đức" value={profile.am_duc} icon={Skull} accent="gold" />
        <StatCard label="Vật Phẩm" value={inventory.length} icon={Package} accent="gold" hint="Trong kho" />
      </StatGrid>

      {/* Character Status */}
      <div className="p-4 sm:p-6 rounded-xl bg-black/30 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-amber-300/70" />
          <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/90">Thanh Trạng Thái Nhân Vật</h3>
          <span className="ml-auto text-[10px] text-gray-600 uppercase tracking-wider">Quản trị viên thay đổi</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Physical */}
          <div className={`rounded-lg border p-3 ${profile.status_physical === 'Bình Thường' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/25 bg-red-500/5'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Heart className={`w-4 h-4 ${profile.status_physical === 'Bình Thường' ? 'text-emerald-400' : 'text-red-400'}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Thể Chất</span>
            </div>
            <p className={`text-sm font-bold ${profile.status_physical === 'Bình Thường' ? 'text-emerald-300' : 'text-red-300'}`}>{profile.status_physical}</p>
          </div>
          {/* Spiritual */}
          <div className={`rounded-lg border p-3 ${profile.status_spiritual === 'Bình Thường' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/25 bg-amber-500/5'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkle className={`w-4 h-4 ${profile.status_spiritual === 'Bình Thường' ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Tâm Linh</span>
            </div>
            <p className={`text-sm font-bold ${profile.status_spiritual === 'Bình Thường' ? 'text-emerald-300' : 'text-amber-300'}`}>{profile.status_spiritual}</p>
          </div>
          {/* Mental */}
          <div className={`rounded-lg border p-3 ${profile.status_mental === 'Bình Thường' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-purple-500/25 bg-purple-500/5'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <Brain className={`w-4 h-4 ${profile.status_mental === 'Bình Thường' ? 'text-emerald-400' : 'text-purple-400'}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Tinh Thần</span>
            </div>
            <p className={`text-sm font-bold ${profile.status_mental === 'Bình Thường' ? 'text-emerald-300' : 'text-purple-300'}`}>{profile.status_mental}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-600">Trạng thái phản ánh tổn thương nhân vật gánh chịu trong quá trình sinh tồn. Trạng thái không tự biến mất khi dị sự kết thúc — có thể kéo dài sang sinh hoạt thường ngày.</p>
      </div>

      {/* Self-Currency Adjustment */}
      <div className="p-4 sm:p-6 rounded-xl bg-black/30 border border-white/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-300/70" />
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/90 leading-tight">Tự Điều Chỉnh Tài Sản</h3>
          </div>
          {!adjustOpen && (
            <button
              onClick={() => setAdjustOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#670201]/60 hover:bg-[#670201] text-amber-100 text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo Giao Dịch
            </button>
          )}
        </div>

        {adjustOpen && (
          <div className="space-y-4">
            {/* Type toggle - full width on all screens */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Loại giao dịch</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAdjustType('add')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg border transition-all ${adjustType === 'add' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-black/30 text-gray-500 border-white/10 hover:text-gray-300'}`}
                >
                  <Plus className="w-3.5 h-3.5" /> Cộng
                </button>
                <button
                  onClick={() => setAdjustType('subtract')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-lg border transition-all ${adjustType === 'subtract' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-black/30 text-gray-500 border-white/10 hover:text-gray-300'}`}
                >
                  <Minus className="w-3.5 h-3.5" /> Trừ
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Amount */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Số tiền</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  placeholder="Số tiền..."
                  min="1"
                  className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
                />
              </div>

              {/* Currency Type */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Loại tiền</label>
                <select
                  value={adjustCurrency}
                  onChange={e => setAdjustCurrency(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all"
                >
                  <option value="HUA_TIEN">Hoa Tiền</option>
                  <option value="CONG_DUC">Công Đức</option>
                  <option value="AM_DUC">Âm Đức</option>
                </select>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Lý do</label>
              <textarea
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
                placeholder="Diễn giải rõ lý do cộng/trừ tài sản..."
                rows={3}
                className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all resize-none"
              />
            </div>

            {/* Timestamp info */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Clock className="w-3.5 h-3.5" />
              <span>Thời gian giao dịch sẽ được hệ thống tự động ghi lại.</span>
            </div>

            {adjustError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-300">{adjustError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAdjustCurrency}
                disabled={adjusting}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {adjusting ? 'Đang xử lý...' : 'Xác Nhận Giao Dịch'}
              </button>
              <button
                onClick={() => { setAdjustOpen(false); setAdjustError(''); }}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 text-sm font-bold rounded-lg transition-all"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {!adjustOpen && (
          <p className="text-xs text-gray-500">
            Người chơi có thể tự cộng/trừ tài sản của mình. Mọi giao dịch đều được lưu vào lịch sử và hiển thị trên bảng quản trị.
          </p>
        )}
      </div>

      {/* Transfer Hoa Tiền */}
      <div className="p-4 sm:p-6 rounded-xl bg-black/30 border border-white/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-amber-300/70" />
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/90 leading-tight">Chuyển Khoản Hoa Tiền</h3>
          </div>
          {!transferOpen && (
            <button
              onClick={() => setTransferOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#670201]/60 hover:bg-[#670201] text-amber-100 text-xs font-semibold transition-all"
            >
              <ArrowRight className="w-3.5 h-3.5" /> Chuyển Tiền
            </button>
          )}
        </div>

        {transferOpen && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Recipient name */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Tên OC người nhận</label>
                <input
                  type="text"
                  value={transferRecipient}
                  onChange={e => setTransferRecipient(e.target.value)}
                  placeholder="Nhập chính xác danh tính OC..."
                  className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
                />
              </div>
              {/* Amount */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Số Hoa Tiền</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  placeholder="Số tiền..."
                  min="1"
                  className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Lý do chuyển khoản</label>
              <textarea
                value={transferReason}
                onChange={e => setTransferReason(e.target.value)}
                placeholder="Diễn giải rõ lý do chuyển khoản..."
                rows={3}
                className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all resize-none"
              />
            </div>

            {/* Info */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Clock className="w-3.5 h-3.5" />
              <span>Thời gian giao dịch sẽ được hệ thống tự động ghi lại. Chỉ chuyển được Hoa Tiền.</span>
            </div>

            {transferError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-300">{transferError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleTransfer}
                disabled={transferring}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {transferring ? 'Đang xử lý...' : 'Xác Nhận Chuyển Khoản'}
              </button>
              <button
                onClick={() => { setTransferOpen(false); setTransferError(''); }}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 text-sm font-bold rounded-lg transition-all"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {!transferOpen && (
          <p className="text-xs text-gray-500">
            Chuyển Hoa Tiền cho người chơi khác bằng cách nhập danh tính OC của họ. Giao dịch được ghi vào lịch sử cả hai bên và hiển thị trên bảng quản trị.
          </p>
        )}
      </div>

      {/* Inventory */}
      <div className="p-4 sm:p-6 rounded-xl bg-black/30 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-amber-300/70" />
          <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/90">Kho Vật Phẩm</h3>
        </div>
        {inventory.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Chưa có vật phẩm nào. Hãy ghé thăm thương thành!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inventory.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-black/20 border border-white/5">
                <div className="w-9 h-9 rounded-lg bg-[#670201]/15 flex items-center justify-center">
                  <Package className="w-4 h-4 text-amber-300/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-100/90 truncate">{item.shop_items?.name}</p>
                  <p className="text-xs text-gray-500">{item.shop_items?.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="p-4 sm:p-6 rounded-xl bg-black/30 border border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-amber-300/70" />
          <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/90">Lịch Sử Giao Dịch</h3>
        </div>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Chưa có giao dịch nào.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map(tx => {
              const isItemReward = tx.amount === 0;
              return (
                <div key={tx.id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-black/20 border border-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-300 break-words leading-snug">{tx.reason}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {tx.related_user_name && (
                        <span className="text-amber-300/70">{tx.amount < 0 ? '→ ' : '← '}{tx.related_user_name} · </span>
                      )}
                      {formatDate(tx.created_at)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {isItemReward ? (
                      <span className="text-sm font-bold text-amber-300 whitespace-nowrap">Vật phẩm</span>
                    ) : (
                      <>
                        <span className={`text-sm font-bold whitespace-nowrap ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </span>
                        <p className="text-xs text-gray-500 whitespace-nowrap">{CURRENCY_LABELS[tx.currency_type]}</p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
