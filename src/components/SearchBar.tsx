import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, SearchProfile, Friendship } from '@/lib/supabase';
import { Search, UserPlus, Check, Loader2, User, X } from 'lucide-react';

type PendingState = Record<string, 'sending' | 'sent' | 'error'>;

export default function SearchBar() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProfile[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingState>({});
  const [outgoingIds, setOutgoingIds] = useState<Set<string>>(new Set());
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchRelations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id, status')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
    if (!data) return;
    const outgoing = new Set<string>();
    const friends = new Set<string>();
    (data as Friendship[]).forEach(f => {
      const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
      if (f.status === 'accepted') friends.add(otherId);
      if (f.status === 'pending' && f.requester_id === user.id) outgoing.add(otherId);
    });
    setOutgoingIds(outgoing);
    setFriendIds(friends);
  }, [user]);

  useEffect(() => {
    fetchRelations();
  }, [fetchRelations]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const term = query.trim();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, oc_name, anonymous_name, avatar_url, gender, bio, is_approved')
        .neq('id', user?.id ?? '')
        .or(`oc_name.ilike.%${term}%,anonymous_name.ilike.%${term}%,email.ilike.%${term}%`)
        .eq('is_approved', true)
        .limit(8);
      if (!error && data) {
        setResults(data as SearchProfile[]);
      } else {
        setResults([]);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sendFriendRequest = async (targetId: string) => {
    if (!user) return;
    setPending(prev => ({ ...prev, [targetId]: 'sending' }));
    const { error } = await supabase.from('friendships').insert([
      { requester_id: user.id, addressee_id: targetId, status: 'pending' },
    ]);
    if (error) {
      if (error.code === '23505') {
        setPending(prev => ({ ...prev, [targetId]: 'sent' }));
        setOutgoingIds(prev => new Set(prev).add(targetId));
      } else {
        console.error('friend request failed', error);
        setPending(prev => ({ ...prev, [targetId]: 'error' }));
      }
    } else {
      setPending(prev => ({ ...prev, [targetId]: 'sent' }));
      setOutgoingIds(prev => new Set(prev).add(targetId));
    }
  };

  const handleResultClick = (id: string) => {
    setOpen(false);
    setQuery('');
    navigate(`/profile/${id}`);
  };

  return (
    <div ref={containerRef} className="relative w-full md:w-48 lg:w-56">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/30 border border-white/10 transition-all focus-within:border-[#670201]/50 w-full">
        <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <input
          type="text"
          placeholder="Tìm người chơi..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 focus:outline-none min-w-0"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); }}
            className="text-gray-500 hover:text-gray-300 flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-[#670201]/30 bg-[#120707] shadow-2xl backdrop-blur-xl overflow-hidden z-50">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-amber-400/60 animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-500">Không tìm thấy người chơi nào.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.map(person => {
                const isFriend = friendIds.has(person.id);
                const isOutgoing = outgoingIds.has(person.id);
                const state = pending[person.id];
                return (
                  <div
                    key={person.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 border-b border-white/5 last:border-0"
                  >
                    <button
                      onClick={() => handleResultClick(person.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-[#670201]/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {person.avatar_url ? (
                          <img src={person.avatar_url} alt={person.oc_name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-amber-300/70" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-amber-100/90 truncate">{person.oc_name}</p>
                        <p className="text-xs text-gray-500 truncate">{isAdmin ? (person.anonymous_name ?? '—') : 'Danh tính ẩn'}</p>
                      </div>
                    </button>
                    <div className="flex-shrink-0">
                      {isFriend ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                          <Check className="w-3.5 h-3.5" /> Bạn bè
                        </span>
                      ) : isOutgoing || state === 'sent' ? (
                        <span className="flex items-center gap-1 text-xs text-amber-400/70 font-semibold">
                          <Check className="w-3.5 h-3.5" /> Đã gửi
                        </span>
                      ) : state === 'sending' ? (
                        <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      ) : (
                        <button
                          onClick={() => sendFriendRequest(person.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#670201]/40 hover:bg-[#670201] text-amber-100 text-xs font-semibold transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Kết bạn
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
