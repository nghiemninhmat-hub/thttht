import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Friendship } from '@/lib/supabase';
import {
  UserCircle, Crown, Ghost, Mail, Eye, EyeOff, UserPlus, Check, Loader2,
  MessageCircle, ArrowLeft, AlertCircle,
} from 'lucide-react';

type RelationState = 'none' | 'outgoing' | 'incoming' | 'friends';

export default function VisitorProfileCard() {
  const { id: targetId } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [anonName, setAnonName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [danhVong, setDanhVong] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [relation, setRelation] = useState<RelationState>('none');
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!targetId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, oc_name, anonymous_name, avatar_url, gender, bio, danh_vong, is_approved, created_at')
      .eq('id', targetId)
      .eq('is_approved', true)
      .maybeSingle();
    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setName(data.oc_name || '');
    setAnonName(data.anonymous_name || '');
    setAvatarUrl(data.avatar_url || '');
    setGender(data.gender || '');
    setBio(data.bio || '');
    setDanhVong(data.danh_vong || '');
    setCreatedAt(data.created_at || '');
    setLoading(false);
  }, [targetId]);

  const fetchRelation = useCallback(async () => {
    if (!user || !targetId || user.id === targetId) return;
    const { data } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .or(`requester_id.eq.${targetId},addressee_id.eq.${targetId}`);
    if (!data) return;
    const rel = (data as Friendship[]).find(
      f =>
        (f.requester_id === user.id && f.addressee_id === targetId) ||
        (f.requester_id === targetId && f.addressee_id === user.id)
    );
    if (!rel) {
      setRelation('none');
    } else if (rel.status === 'accepted') {
      setRelation('friends');
    } else if (rel.status === 'pending') {
      setRelation(rel.requester_id === user.id ? 'outgoing' : 'incoming');
    } else {
      setRelation('none');
    }
  }, [user, targetId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchRelation();
  }, [fetchRelation]);

  const sendFriendRequest = async () => {
    if (!user || !targetId) return;
    setActionPending(true);
    setActionError('');
    const { error } = await supabase.from('friendships').insert([
      { requester_id: user.id, addressee_id: targetId, status: 'pending' },
    ]);
    setActionPending(false);
    if (error) {
      if (error.code === '23505') {
        setRelation('outgoing');
      } else {
        setActionError(error.message || 'Không gửi được lời mời kết bạn.');
      }
      return;
    }
    setRelation('outgoing');
  };

  const acceptFriendRequest = async () => {
    if (!user || !targetId) return;
    setActionPending(true);
    setActionError('');
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('requester_id', targetId)
      .eq('addressee_id', user.id)
      .eq('status', 'pending');
    setActionPending(false);
    if (error) {
      setActionError(error.message || 'Không thể chấp nhận lời mời.');
      return;
    }
    setRelation('friends');
  };

  const declineFriendRequest = async () => {
    if (!user || !targetId) return;
    setActionPending(true);
    setActionError('');
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('requester_id', targetId)
      .eq('addressee_id', user.id)
      .eq('status', 'pending');
    setActionPending(false);
    if (error) {
      setActionError(error.message || 'Không thể từ chối lời mời.');
      return;
    }
    setRelation('none');
  };

  const cancelFriendRequest = async () => {
    if (!user || !targetId) return;
    setActionPending(true);
    setActionError('');
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('requester_id', user.id)
      .eq('addressee_id', targetId)
      .eq('status', 'pending');
    setActionPending(false);
    if (error) {
      setActionError(error.message || 'Không thể huỷ lời mời.');
      return;
    }
    setRelation('none');
  };

  const removeFriend = async () => {
    if (!user || !targetId) return;
    setActionPending(true);
    setActionError('');
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('requester_id', user.id)
      .eq('addressee_id', targetId)
      .eq('status', 'accepted');
    if (error) {
      // try the other direction
      const { error: err2 } = await supabase
        .from('friendships')
        .delete()
        .eq('requester_id', targetId)
        .eq('addressee_id', user.id)
        .eq('status', 'accepted');
      if (err2) {
        setActionPending(false);
        setActionError(err2.message || 'Không thể huỷ kết bạn.');
        return;
      }
    }
    setActionPending(false);
    setRelation('none');
  };

  const startMessage = async () => {
    if (!user || !targetId) return;
    const { error } = await supabase.from('messages').insert([
      { sender_id: user.id, receiver_id: targetId, content: '👋' },
    ]);
    if (error) {
      setActionError(error.message || 'Không thể bắt đầu trò chuyện.');
      return;
    }
    navigate('/messages');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-[#670201]/30 border-t-[#670201] animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle className="w-14 h-14 mx-auto mb-4 text-amber-300/40" />
        <h2 className="text-xl font-serif font-bold text-amber-100/80 mb-2">Không tìm thấy người chơi</h2>
        <p className="text-sm text-gray-500 mb-6">Người chơi này không tồn tại hoặc chưa được phê duyệt.</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-amber-200/80 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      <div className="p-5 sm:p-6 lg:p-8 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="flex-shrink-0">
            <div className="relative group">
              <div className="absolute -inset-2 rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(214,65,46,0.25),rgba(140,17,17,0.1)_50%,transparent_75%)] blur-md" />
              <div className="absolute -inset-1.5 rounded-full border border-[#670201]/30" />
              <div className="relative w-28 h-28 sm:w-40 sm:h-40 rounded-full overflow-hidden border-[3px] border-[#670201]/50 shadow-xl shadow-black/50 bg-gradient-to-br from-[#670201] to-[#a00404]">
                <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-amber-200/10 pointer-events-none z-10" />
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserCircle className="w-16 h-16 sm:w-20 sm:h-20 text-amber-100/80" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 w-full space-y-3 text-center sm:text-left">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-amber-100/90 break-words">{name}</h2>
                <div className="flex flex-col gap-2 mt-2 items-center sm:items-start">
                  {danhVong && danhVong !== 'Vô Danh' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#670201]/30 to-[#a00404]/20 border border-amber-500/30 text-xs font-bold text-amber-200 tracking-wider">
                      <Crown className="w-3 h-3 text-amber-300" />
                      {danhVong}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm">
              <Ghost className="w-4 h-4 text-gray-500" />
              <span className="text-gray-400">Ẩn danh:</span>
              <span className="text-amber-200/80">{isAdmin ? (anonName || 'Vô Danh') : '— —'}</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm">
              <span className="text-gray-400">Giới tính:</span>
              <span className="text-gray-300">{gender || '—'}</span>
            </div>
            {createdAt && (
              <div className="flex items-center justify-center sm:justify-start gap-2 text-sm">
                <span className="text-gray-400">Gia nhập:</span>
                <span className="text-gray-500">{new Date(createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
            {bio && (
              <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                <p className="text-sm text-gray-400 italic">"{bio}"</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1 text-[10px] text-gray-600 uppercase tracking-wider">
              <Mail className="h-3 w-3" />
              <span>Thông tin liên hệ riêng tư</span>
            </div>
          </div>
        </div>

        {actionError && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-300">{actionError}</p>
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 rounded-xl bg-black/30 border border-white/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-300/70" />
            <h3 className="text-base sm:text-lg font-serif font-bold text-amber-100/90">Mối Quan Hệ</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {relation === 'friends' ? (
              <>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-semibold">
                  <Check className="w-3.5 h-3.5" /> Bạn bè
                </span>
                <button
                  onClick={startMessage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#670201]/60 hover:bg-[#670201] text-amber-100 text-xs font-semibold transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Nhắn tin
                </button>
                <button
                  onClick={removeFriend}
                  disabled={actionPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {actionPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  Huỷ kết bạn
                </button>
              </>
            ) : relation === 'outgoing' ? (
              <>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/80 font-semibold">
                  <Check className="w-3.5 h-3.5" /> Đã gửi lời mời
                </span>
                <button
                  onClick={cancelFriendRequest}
                  disabled={actionPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {actionPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                  Huỷ lời mời
                </button>
              </>
            ) : relation === 'incoming' ? (
              <>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300/80 font-semibold">
                  <Mail className="w-3.5 h-3.5" /> Đã nhận lời mời
                </span>
                <button
                  onClick={acceptFriendRequest}
                  disabled={actionPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {actionPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Chấp nhận
                </button>
                <button
                  onClick={declineFriendRequest}
                  disabled={actionPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {actionPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                  Từ chối
                </button>
              </>
            ) : (
              <button
                onClick={sendFriendRequest}
                disabled={actionPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#670201] hover:bg-[#a00404] text-amber-100 text-xs font-bold transition-all disabled:opacity-50"
              >
                {actionPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                Kết bạn
              </button>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-600">
          Hồ sơ khách — bạn chỉ thấy những thông tin công khai. Tài sản, vật phẩm và lịch sử giao dịch của người chơi này được giữ riêng tư.
        </p>
      </div>
    </div>
  );
}
