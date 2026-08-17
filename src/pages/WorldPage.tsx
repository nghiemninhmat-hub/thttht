import { useState, useEffect, useCallback } from 'react';
import { supabase, SitePage } from '@/lib/supabase';
import { StatCard, StatGrid } from '@/components/StatCard';
import { ContentRenderer } from '@/components/ContentRenderer';
import {
  BookOpen, FileText, Search, Scroll, Ghost, Globe2,
  Users, Shield, Flame, Bookmark, ChevronDown
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  'Thế Giới Quan': Globe2,
  'Nhân Vật': Users,
  'Dị Sự': Ghost,
  'Cộng Đồng': Shield,
};

const CATEGORY_TEXT: Record<string, string> = {
  'Thế Giới Quan': 'text-amber-300/70',
  'Nhân Vật': 'text-amber-300/70',
  'Dị Sự': 'text-amber-300/70',
  'Cộng Đồng': 'text-amber-300/70',
};

export default function WorldPage() {
  const [pages, setPages] = useState<SitePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

  const fetchPages = useCallback(async () => {
    const { data, error } = await supabase.from('site_pages').select('*').order('page_number', { ascending: true });
    if (!error && data) {
      setPages(data as SitePage[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const categories = ['all', ...Array.from(new Set(pages.map(p => p.category)))];
  const visiblePages = pages.filter(page => !page.title.toLowerCase().includes('bách quỷ âm'));
  const filteredPages = visiblePages.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedPages = filteredPages.reduce((acc, page) => {
    if (!acc[page.category]) acc[page.category] = [];
    acc[page.category].push(page);
    return acc;
  }, {} as Record<string, SitePage[]>);

  const categoryOrder = ['Thế Giới Quan', 'Nhân Vật', 'Dị Sự', 'Cộng Đồng'];

  const togglePage = (pageId: string) => {
    setExpandedPages(current => {
      const next = new Set(current);
      if (next.has(pageId)) next.delete(pageId);
      else next.add(pageId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-2 border-[#670201]/30 border-t-[#670201] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center relative py-2">
        <div className="absolute left-1/2 -translate-x-1/2 top-0 w-40 h-px bg-gradient-to-r from-transparent via-[#670201]/40 to-transparent" />
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#670201]/20 border border-[#670201]/30 mb-4 mt-4">
          <Scroll className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-200/80 tracking-widest uppercase font-serif">Cổ Văn Giản</span>
        </div>
        <h2 className="text-3xl font-serif font-bold text-amber-100/90">Bách Khoa Toàn Thư</h2>
        <p className="text-sm text-gray-500 mt-2 italic">Thế giới, quy tắc, dị sự, bách quỷ — mọi bí ẩn của Trùng Hoan</p>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-40 h-px bg-gradient-to-r from-transparent via-[#670201]/40 to-transparent" />
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm trong bách khoa..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#670201]/50 transition-all"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:outline-none focus:border-[#670201]/50 transition-all"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat === 'all' ? 'Tất cả thể loại' : cat}</option>
          ))}
        </select>
      </div>

      {/* Stats overview */}
      <StatGrid cols={4}>
        <StatCard label="Tổng Trang" value={pages.length} icon={BookOpen} accent="gold" />
        <StatCard label="Thể Loại" value={categories.length - 1} icon={Globe2} accent="gold" />
        <StatCard label="Dị Sự" value={pages.filter(p => p.category === 'Dị Sự').length} icon={Ghost} accent="vermilion" />
        <StatCard label="Kết Quả Lọc" value={filteredPages.length} icon={Search} accent={filteredPages.length < pages.length ? 'gold' : 'neutral'} hint={filteredPages.length < pages.length ? 'Đang lọc' : 'Tất cả'} />
      </StatGrid>

      <div className="space-y-8">
        {categoryOrder.map(category => {
          const catPages = groupedPages[category];
          if (!catPages?.length) return null;
          const CatIcon = CATEGORY_ICONS[category] || FileText;
          const textClass = CATEGORY_TEXT[category] || "text-amber-300/70";

          return (
            <section key={category} className="space-y-3">
              <div className="sticky top-20 z-10 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#170707]/95 border border-[#670201]/30 backdrop-blur-md">
                <CatIcon className={`w-4 h-4 ${textClass}`} />
                <h3 className={`text-sm font-serif font-bold tracking-wide uppercase ${textClass}`}>{category}</h3>
                <span className="ml-auto text-xs text-gray-600">{catPages.length} trang</span>
              </div>

              <div className="space-y-5">
                {catPages.map(page => {
                  const isExpanded = expandedPages.has(page.id);
                  return (
                    <article key={page.id} className="relative rounded-2xl bg-gradient-to-b from-[#0d0606] to-[#0a0404] border border-[#670201]/20 shadow-lg shadow-black/10 overflow-hidden">
                      <div className="absolute top-0 left-0 w-12 h-12 pointer-events-none opacity-20">
                        <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#670201]/60 rounded-tl-md" />
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePage(page.id)}
                        aria-expanded={isExpanded}
                        className="w-full p-5 sm:p-7 text-left transition-colors hover:bg-[#670201]/[0.06]"
                      >
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-[#670201]/15 border border-[#670201]/25 text-amber-300/70 font-medium">{page.category}</span>
                          <span className="text-xs text-gray-600 flex items-center gap-1"><Bookmark className="w-3 h-3" /> Trang {page.page_number}</span>
                          <ChevronDown className={`ml-auto w-5 h-5 text-amber-300/60 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                        <h4 className="text-xl sm:text-2xl font-serif font-bold text-amber-100/90 leading-tight">{page.title}</h4>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-px w-14 bg-gradient-to-r from-[#670201] to-transparent" />
                          <Flame className="w-3 h-3 text-[#670201]/40" />
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-5 pb-6 sm:px-7 sm:pb-8 prose prose-invert max-w-none border-t border-[#670201]/15 pt-5">
                          <ContentRenderer content={page.content} />
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
