import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Post, PostComment } from '@/lib/supabase';
import { StatCard, StatGrid } from '@/components/StatCard';
import {
  MessageSquare, Send, Trash2, Ghost, Clock, CornerDownRight, Loader2,
  ChevronDown, ChevronUp, Reply, MessageCircle
} from 'lucide-react';

const CATEGORIES = ['Thảo luận', 'Roleplay', 'Hỏi đáp', 'Dị sự', 'Tâm sự'];

function displayName(comment: PostComment, isAdmin: boolean, currentUserId?: string): string {
  if (isAdmin) return comment.profiles?.oc_name || 'Vô Danh';
  if (currentUserId && comment.author_id === currentUserId) {
    return `${comment.profiles?.anonymous_name || 'Vô Danh'} (bạn)`;
  }
  return comment.profiles?.anonymous_name || 'Vô Danh';
}

export default function ForumPage() {
  const { user, profile, isAdmin } = useAuth();
  const [posts, setPosts] = useState<(Post & { post_comments?: PostComment[] })[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Thảo luận');
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');

  // Comment state per post
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(anonymous_name, oc_name), post_comments(*, profiles(anonymous_name, oc_name))')
      .order('created_at', { ascending: false });
    if (!error && data) {
      const mapped = (data as any[]).map(p => {
        const flat: PostComment[] = (p.post_comments || []).sort(
          (a: PostComment, b: PostComment) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const topLevel: PostComment[] = flat.filter(c => !c.parent_comment_id).map(c => ({
          ...c,
          replies: flat.filter(r => r.parent_comment_id === c.id),
        }));
        return { ...p, post_comments: topLevel };
      });
      setPosts(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!profile.is_approved) {
      alert('Tài khoản của bạn chưa được phê duyệt!');
      return;
    }
    const { error } = await supabase.from('posts').insert([
      { author_id: user.id, title: newTitle, content: newContent, category: newCategory },
    ]);
    if (error) {
      alert(`Lỗi: ${error.message}`);
      return;
    }
    setNewTitle('');
    setNewContent('');
    setNewCategory('Thảo luận');
    fetchPosts();
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Xóa bài viết này? Tất cả bình luận cũng sẽ bị xóa.')) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) fetchPosts();
  };

  const handleAddComment = async (postId: string) => {
    if (!user) return;
    const content = (commentDrafts[postId] || '').trim();
    if (!content) return;
    setSubmittingComment(postId);
    const { error } = await supabase.from('post_comments').insert([
      { post_id: postId, author_id: user.id, content },
    ]);
    setSubmittingComment(null);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
    setExpandedComments(prev => new Set(prev).add(postId));
    fetchPosts();
  };

  const handleAddReply = async (postId: string, parentId: string) => {
    if (!user) return;
    const content = (replyDrafts[parentId] || '').trim();
    if (!content) return;
    setSubmittingComment(parentId);
    const { error } = await supabase.from('post_comments').insert([
      { post_id: postId, author_id: user.id, parent_comment_id: parentId, content },
    ]);
    setSubmittingComment(null);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    setReplyDrafts(prev => ({ ...prev, [parentId]: '' }));
    setReplyingTo(null);
    setExpandedComments(prev => new Set(prev).add(postId));
    fetchPosts();
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Xóa bình luận này? Các trả lời cũng sẽ bị xóa.')) return;
    const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
    if (error) { alert(`Lỗi: ${error.message}`); return; }
    fetchPosts();
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Vừa xong';
    if (hours < 24) return `${hours} giờ trước`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredPosts = filterCategory === 'all' ? posts : posts.filter(p => p.category === filterCategory);

  const canDeleteComment = (c: PostComment) =>
    !!user && (c.author_id === user.id || isAdmin);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#670201]/20 border border-[#670201]/30 mb-4">
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-200/80 tracking-widest uppercase font-serif">Diễn Đàn Ẩn Danh</span>
        </div>
        <h2 className="text-3xl font-serif font-bold text-amber-100/90">Diễn Đàn Trùng Hoan</h2>
        <p className="text-sm text-gray-500 mt-2">Thảo luận với danh tính ẩn danh — mọi bài đăng đều để lại dấu tích</p>
      </div>

      {/* Stats overview */}
      <StatGrid cols={4}>
        <StatCard label="Tổng Bài Viết" value={posts.length} icon={MessageSquare} accent="gold" />
        <StatCard label="Bình Luận" value={posts.reduce((sum, p) => sum + (p.post_comments?.reduce((s, c) => s + 1 + (c.replies?.length || 0), 0) || 0), 0)} icon={MessageCircle} accent="gold" />
        <StatCard label="Thể Loại" value={CATEGORIES.length} icon={Ghost} accent="vermilion" />
        <StatCard label="Đang Xem" value={filterCategory === 'all' ? 'Tất cả' : filterCategory} icon={Clock} accent={filterCategory === 'all' ? 'neutral' : 'gold'} hint={filterCategory === 'all' ? 'Không lọc' : 'Đang lọc'} />
      </StatGrid>

      {/* New Post Form */}
      {profile?.is_approved ? (
        <form onSubmit={handleCreatePost} className="p-5 rounded-xl bg-black/30 border border-white/10 backdrop-blur-sm space-y-3">
          <h3 className="text-sm font-bold text-amber-100/80 mb-2">Đăng bài mới</h3>
          <input
            type="text"
            placeholder="Tiêu đề bài viết..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            required
            className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
          />
          <div className="flex gap-3">
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="px-3 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Nội dung thảo luận roleplay..."
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all resize-none"
          />
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#670201] hover:bg-[#a00404] text-amber-100 text-sm font-bold rounded-lg transition-all hover:scale-105"
          >
            <Send className="w-4 h-4" />
            Đăng Bài
          </button>
        </form>
      ) : (
        <div className="p-5 rounded-xl bg-black/30 border border-white/10 backdrop-blur-sm text-center">
          <p className="text-sm text-gray-400">
            {user ? 'Tài khoản của bạn chưa được phê duyệt để đăng bài.' : (
              <>
                <Link to="/login" className="text-amber-300 hover:text-amber-100 underline">Đăng nhập</Link> để tham gia thảo luận.
              </>
            )}
          </p>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterCategory === 'all' ? 'bg-[#670201]/30 text-amber-100' : 'text-gray-400 hover:text-amber-100 hover:bg-white/5'
          }`}
        >
          Tất cả
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterCategory === cat ? 'bg-[#670201]/30 text-amber-100' : 'text-gray-400 hover:text-amber-100 hover:bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map(post => {
          const commentCount = (post.post_comments || []).reduce(
            (sum, c) => sum + 1 + (c.replies?.length || 0), 0
          );
          const isExpanded = expandedComments.has(post.id);
          return (
            <div
              key={post.id}
              className="group p-5 rounded-xl bg-black/30 border border-white/5 backdrop-blur-sm hover:border-[#670201]/20 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-[#670201]/20 text-amber-300/80">{post.category}</span>
                </div>
                {user && (post.author_id === user.id || isAdmin) && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <h4 className="text-lg font-bold text-amber-100/90 mb-2">{post.title}</h4>
              <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Ghost className="w-3.5 h-3.5" />
                  <span>{isAdmin ? (post.profiles?.oc_name || 'Vô Danh') : (post.profiles?.anonymous_name || 'Vô Danh')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>

              {/* Comment toggle + count */}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-300 transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{commentCount} bình luận</span>
                </button>
              </div>

              {/* Comments section */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                  {/* Comment input */}
                  {profile?.is_approved ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Viết bình luận..."
                        value={commentDrafts[post.id] || ''}
                        onChange={e => setCommentDrafts(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddComment(post.id); }}
                        className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={submittingComment === post.id || !(commentDrafts[post.id] || '').trim()}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#670201]/80 hover:bg-[#670201] text-amber-100 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingComment === post.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600">Đăng nhập và được phê duyệt để bình luận.</p>
                  )}

                  {/* Comments list */}
                  {(post.post_comments || []).map(comment => (
                    <div key={comment.id} className="space-y-3">
                      {/* Top-level comment */}
                      <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Ghost className="w-3 h-3 text-gray-500" />
                              <span className="text-xs font-semibold text-amber-200/80">
                                {displayName(comment, !!isAdmin, user?.id)}
                              </span>
                              <span className="text-[10px] text-gray-600">{formatDate(comment.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                          </div>
                          {canDeleteComment(comment) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all flex-shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {profile?.is_approved && (
                          <div className="mt-2">
                            {replyingTo === comment.id ? (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder={`Trả lời ${displayName(comment, !!isAdmin, user?.id)}...`}
                                  value={replyDrafts[comment.id] || ''}
                                  onChange={e => setReplyDrafts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                  onKeyDown={e => { if (e.key === 'Enter') handleAddReply(post.id, comment.id); }}
                                  autoFocus
                                  className="flex-1 px-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
                                />
                                <button
                                  onClick={() => handleAddReply(post.id, comment.id)}
                                  disabled={submittingComment === comment.id || !(replyDrafts[comment.id] || '').trim()}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#670201]/80 hover:bg-[#670201] text-amber-100 text-xs font-semibold rounded-lg transition-all disabled:opacity-50"
                                >
                                  {submittingComment === comment.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                </button>
                                <button
                                  onClick={() => { setReplyingTo(null); setReplyDrafts(prev => ({ ...prev, [comment.id]: '' })); }}
                                  className="px-2 py-1.5 text-gray-500 hover:text-gray-300 text-xs rounded-lg transition-all"
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setReplyingTo(comment.id)}
                                className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-amber-300 transition-colors"
                              >
                                <Reply className="w-3 h-3" /> Trả lời
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Replies */}
                      {(comment.replies || []).length > 0 && (
                        <div className="ml-6 space-y-2">
                          {(comment.replies || []).map(reply => (
                            <div key={reply.id} className="p-3 rounded-lg bg-black/10 border border-white/5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CornerDownRight className="w-3 h-3 text-gray-600" />
                                    <Ghost className="w-3 h-3 text-gray-500" />
                                    <span className="text-xs font-semibold text-amber-200/70">
                                      {displayName(reply, !!isAdmin, user?.id)}
                                    </span>
                                    <span className="text-[10px] text-gray-600">{formatDate(reply.created_at)}</span>
                                  </div>
                                  <p className="text-sm text-gray-400 whitespace-pre-wrap">{reply.content}</p>
                                </div>
                                {canDeleteComment(reply) && (
                                  <button
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="p-1 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all flex-shrink-0"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {(post.post_comments || []).length === 0 && (
                    <p className="text-xs text-gray-600 text-center py-2">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredPosts.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có bài viết nào trong mục này.</p>
        </div>
      )}
    </div>
  );
}
