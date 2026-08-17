import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Notification } from '@/lib/supabase';
import { Bell, CheckCheck, Trash2, UserPlus, UserCheck, Mail, UserCircle, FileText } from 'lucide-react';

const iconForType = (type: string) => {
  switch (type) {
    case 'friend_request': return UserPlus;
    case 'friend_accepted': return UserCheck;
    case 'message': return Mail;
    case 'admin_registration': return UserCircle;
    case 'admin_post': return FileText;
    default: return Bell;
  }
};

const colorForType = (type: string) => {
  switch (type) {
    case 'friend_request':
    case 'friend_accepted':
      return 'text-emerald-400';
    case 'message':
      return 'text-blue-400';
    case 'admin_registration':
      return 'text-amber-400';
    case 'admin_post':
      return 'text-purple-400';
    default:
      return 'text-gray-400';
  }
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'vừa xong';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

export default function NotificationBell() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(30);
    if (!error && data) {
      setNotifications(data as Notification[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-channel')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => { fetchNotifications(); }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications' },
        () => { fetchNotifications(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.is_read) markRead(n.id);
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  if (!user) return null;

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-amber-100 hover:bg-white/5 transition-colors"
        title="Thông báo"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-[#670201] to-[#a00404] text-amber-100 text-[10px] font-bold px-1 shadow-md shadow-[#670201]/50 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] max-w-96 sm:w-96 max-h-[70vh] rounded-xl border border-[#670201]/30 bg-[#120707] shadow-2xl backdrop-blur-xl overflow-hidden z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-amber-100/90">Thông Báo</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#670201]/30 text-amber-200 text-[10px] font-semibold">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-amber-300 transition-colors"
                title="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đã đọc
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 rounded-full border-2 border-[#670201]/30 border-t-[#670201] animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Chưa có thông báo nào.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map(n => {
                  const Icon = iconForType(n.type);
                  const color = colorForType(n.type);
                  return (
                    <div
                      key={n.id}
                      className={`group flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-white/5 ${
                        !n.is_read ? 'bg-[#670201]/5' : ''
                      }`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className={`mt-0.5 flex-shrink-0 ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold truncate ${n.is_read ? 'text-gray-400' : 'text-amber-100/90'}`}>
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#a00404] flex-shrink-0" />
                          )}
                        </div>
                        {n.body && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                        )}
                        <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                        className="flex-shrink-0 p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        title="Xóa thông báo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin hint */}
          {isAdmin && (
            <div className="px-4 py-2 border-t border-white/10 bg-black/30">
              <p className="text-[10px] text-gray-500 text-center">
                Bạn đang nhận thông báo toàn hệ thống (đăng ký, bài viết mới)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
