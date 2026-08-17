import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Message, Profile, Friendship } from '@/lib/supabase';
import { Scroll, Send, Clock, User, Inbox, UserPlus, Check, X, Users } from 'lucide-react';

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [selectedContact, setSelectedContact] = useState<Profile | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<{ friendship: Friendship; profile: Profile }[]>([]);
  const [responding, setResponding] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true });
    if (!error && data) setMessages(data as Message[]);
    setLoading(false);
  }, [user]);

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    const { data: friendships } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id, status')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    if (!friendships) {
      setContacts([]);
      return;
    }
    const friendIds = (friendships as Friendship[]).map(f =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    );
    if (friendIds.length === 0) {
      setContacts([]);
      return;
    }
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', friendIds)
      .eq('is_approved', true);
    if (profiles) setContacts(profiles as Profile[]);
  }, [user]);

  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id, status, created_at, responded_at')
      .eq('addressee_id', user.id)
      .eq('status', 'pending');
    if (!data || (data as Friendship[]).length === 0) {
      setPendingRequests([]);
      return;
    }
    const requesterIds = (data as Friendship[]).map(f => f.requester_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', requesterIds);
    if (profiles) {
      const profileMap = new Map((profiles as Profile[]).map(p => [p.id, p]));
      const combined = (data as Friendship[]).map(f => ({
        friendship: f,
        profile: profileMap.get(f.requester_id),
      })).filter(item => item.profile) as { friendship: Friendship; profile: Profile }[];
      setPendingRequests(combined);
    }
  }, [user]);

  useEffect(() => {
    fetchMessages();
    fetchContacts();
    fetchPendingRequests();
  }, [fetchMessages, fetchContacts, fetchPendingRequests]);

  const respondToRequest = async (requesterId: string, accept: boolean) => {
    if (!user) return;
    setResponding(requesterId);
    const { error } = await supabase
      .from('friendships')
      .update({ status: accept ? 'accepted' : 'declined', responded_at: new Date().toISOString() })
      .eq('requester_id', requesterId)
      .eq('addressee_id', user.id)
      .eq('status', 'pending');
    if (!error) {
      setPendingRequests(prev => prev.filter(r => r.friendship.requester_id !== requesterId));
      if (accept) {
        await fetchContacts();
      }
    }
    setResponding(null);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedContact || !content.trim()) return;
    const { error } = await supabase.from('messages').insert([
      { sender_id: user.id, receiver_id: selectedContact.id, content: content.trim() },
    ]);
    if (error) {
      console.error('send message failed', error);
      return;
    }
    setContent('');
    fetchMessages();
  };

  const conversationMessages = selectedContact
    ? messages.filter(
        m =>
          (m.sender_id === user?.id && m.receiver_id === selectedContact.id) ||
          (m.sender_id === selectedContact.id && m.receiver_id === user?.id)
      )
    : [];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  };

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
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#670201]/20 border border-[#670201]/30 mb-4">
          <Scroll className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-200/80 tracking-widest uppercase font-serif">Thư Tín</span>
        </div>
        <h2 className="text-3xl font-serif font-bold text-amber-100/90">Hệ Thống Thư Tín Nội Bộ</h2>
        <p className="text-sm text-gray-500 mt-2">Giao tiếp trực tiếp giữa người chơi — thư tín thuần văn bản</p>
      </div>

      {/* Pending Friend Requests */}
      {pendingRequests.length > 0 && (
        <div className="rounded-xl bg-amber-400/5 border border-amber-400/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-200">Lời mời kết bạn ({pendingRequests.length})</h3>
          </div>
          <div className="space-y-2">
            {pendingRequests.map(req => (
              <div key={req.friendship.requester_id} className="flex items-center gap-3 p-2.5 rounded-lg bg-black/30 border border-white/5">
                <div className="w-9 h-9 rounded-full bg-[#670201]/30 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-amber-300/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-100/90 truncate">{req.profile.oc_name}</p>
                  <p className="text-xs text-gray-500 truncate">{req.profile.anonymous_name}</p>
                </div>
                {responding === req.friendship.requester_id ? (
                  <div className="w-5 h-5 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => respondToRequest(req.friendship.requester_id, true)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-semibold transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Chấp nhận
                    </button>
                    <button
                      onClick={() => respondToRequest(req.friendship.requester_id, false)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-300 text-xs font-semibold transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Từ chối
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[60vh]">
        {/* Contact List */}
        <div className="md:col-span-1 p-4 rounded-xl bg-black/30 border border-white/10 backdrop-blur-sm overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <h3 className="text-xs text-gray-400 uppercase tracking-wider">Danh bạ</h3>
            <span className="ml-auto text-xs text-gray-600">{contacts.length}</span>
          </div>
          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 mx-auto mb-2 text-gray-700" />
              <p className="text-xs text-gray-500">Chưa có bạn bè.</p>
              <p className="text-xs text-gray-600 mt-1">Dùng thanh tìm kiếm ở menu để thêm bạn.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                    selectedContact?.id === contact.id
                      ? 'bg-[#670201]/20 border border-[#670201]/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-[#670201]/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {contact.avatar_url ? (
                      <img src={contact.avatar_url} alt={contact.oc_name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-amber-300/70" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-100/90 truncate">{contact.oc_name}</p>
                    <p className="text-xs text-gray-500 truncate">{contact.anonymous_name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversation */}
        <div className="md:col-span-2 flex flex-col rounded-xl bg-black/30 border border-white/10 backdrop-blur-sm overflow-hidden">
          {!selectedContact ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <Inbox className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Chọn bạn bè để bắt đầu trao đổi thư tín.</p>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#670201]/30 flex items-center justify-center overflow-hidden">
                  {selectedContact.avatar_url ? (
                    <img src={selectedContact.avatar_url} alt={selectedContact.oc_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-amber-300/70" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-100/90">{selectedContact.oc_name}</p>
                  <p className="text-xs text-gray-500">{selectedContact.anonymous_name}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {conversationMessages.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-8">Chưa có thư tín nào. Hãy gửi thư đầu tiên!</p>
                ) : (
                  conversationMessages.map(msg => {
                    const isSent = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] p-3 rounded-lg ${
                          isSent
                            ? 'bg-[#670201]/30 border border-[#670201]/30 rounded-br-sm'
                            : 'bg-black/40 border border-white/10 rounded-bl-sm'
                        }`}>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">{msg.content}</p>
                          <div className="flex items-center gap-1 mt-1.5">
                            <Clock className="w-3 h-3 text-gray-600" />
                            <span className="text-[10px] text-gray-600">{formatDate(msg.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Send Form */}
              <form onSubmit={sendMessage} className="p-3 border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  placeholder="Nội dung thư..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all hover:scale-105"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
