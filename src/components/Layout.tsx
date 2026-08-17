import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { CURRENCY_ICONS } from '@/lib/supabase';
import SearchBar from '@/components/SearchBar';
import NotificationBell from '@/components/NotificationBell';
import MusicPlayer from '@/components/MusicPlayer';
import PageTransition from '@/components/PageTransition';
import {
  Home, Store, MessageSquare, Users, Shield, Moon, Sun, LogOut, LogIn,
  BookOpen, Scroll, Menu, X, UserCircle, MapPinned, Dices, ShieldAlert, Ghost, Crown
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Trang Chủ', icon: Home },
  { path: '/shop', label: 'Thương Thành', icon: Store },
  { path: '/forum', label: 'Diễn Đàn', icon: MessageSquare },
  { path: '/messages', label: 'Thư Tín', icon: Scroll },
  { path: '/world', label: 'Bách Khoa Toàn Thư', icon: BookOpen },
  { path: '/map', label: 'Địa Đồ', icon: MapPinned },
  { path: '/bach-phap', label: 'Bách Pháp Mệnh', icon: Dices },
  { path: '/wanted', label: 'Truy Nã', icon: ShieldAlert },
  { path: '/kim-bang', label: 'Kim Bảng', icon: Crown },
  { path: '/bach-quy-am', label: 'Bách Quỷ Âm', icon: Ghost },
  { path: '/profile', label: 'Hồ Sơ', icon: UserCircle },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const allNavItems = [...navItems];
  if (isAdmin) {
    allNavItems.push({ path: '/admin', label: 'Quản Trị', icon: Shield });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#170b09] via-[#24100c] to-[#0d0807] text-[#f3dca8] transition-colors duration-500">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#b73720]/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#eeb337]/10 rounded-full blur-[120px] animate-pulse-slow" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#170b09]/80 border-b border-[#b73720]/30">
        <div className="mx-auto w-full max-w-[1500px] px-3 sm:px-6">
          <div className="flex min-h-14 items-center justify-between gap-2 py-1 sm:min-h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="relative flex h-8 w-8 items-center justify-center overflow-visible rounded-full border border-[#f6ca62]/70 bg-gradient-to-br from-[#c84a24] via-[#8f2418] to-[#4a120d] shadow-[0_0_0_3px_rgba(238,179,55,0.07),0_0_18px_rgba(183,55,32,0.38)] transition-all group-hover:shadow-[0_0_0_3px_rgba(238,179,55,0.14),0_0_26px_rgba(238,179,55,0.3)] before:pointer-events-none before:absolute before:inset-[3px] before:rounded-full before:border before:border-[#f6ca62]/25 before:content-[''] after:pointer-events-none after:absolute after:-inset-1 after:rounded-full after:border after:border-[#f6ca62]/20 after:rotate-[23deg] after:content-[''] sm:h-9 sm:w-9">
                <span className="font-han text-base font-normal leading-none tracking-[0.08em] text-[#fff1cf]">重</span>
              </div>
              <div className="hidden sm:block leading-tight min-w-[128px]">
                <h1 className="font-sans text-sm font-bold uppercase tracking-[0.1em] text-[#fff1cf] lg:text-base whitespace-nowrap">TRÙNG HOAN TÁI</h1>
                <p className="hidden 2xl:block text-[9px] uppercase tracking-[0.28em] text-[#d7a96d]/60">Linh Hồn Bị Giam Cầm</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden 2xl:flex min-w-0 flex-1 flex-wrap items-center justify-center gap-0.5 px-2 py-1">
              {allNavItems.map(item => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={item.label}
                    className={`flex flex-shrink-0 items-center justify-center gap-1 rounded-sm border-b px-2 py-2 text-[10px] font-medium whitespace-nowrap transition-colors duration-300 2xl:px-2.5 2xl:text-xs ${
                      active
                        ? 'border-[#eeb337]/70 bg-[#8f2418]/25 text-[#fff1cf] shadow-inner' 
                        : 'border-transparent text-[#c9b493]/70 hover:border-[#eeb337]/35 hover:bg-[#eeb337]/10 hover:text-[#fff1cf]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                    <span className="inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Search Bar */}
            {profile && <div className="hidden 2xl:block 2xl:max-w-40"><SearchBar /></div>}

            {/* Right side */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {profile && (
                <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-sm bg-[#0d0807]/50 border border-[#eeb337]/15">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span>{CURRENCY_ICONS.HUA_TIEN}</span>
                    <span className="font-semibold text-[#f6ca62]">{profile.hua_tien}</span>
                  </div>
                  <div className="w-px h-4 bg-[#eeb337]/15" />
                  <div className="flex items-center gap-1.5 text-xs">
                    <span>{CURRENCY_ICONS.CONG_DUC}</span>
                    <span className="text-[#f6ca62] font-semibold">{profile.cong_duc}</span>
                  </div>
                  {profile.am_duc > 0 && (
                    <>
                      <div className="w-px h-4 bg-[#eeb337]/15" />
                      <div className="flex items-center gap-1.5 text-xs">
                        <span>{CURRENCY_ICONS.AM_DUC}</span>
                        <span className="text-[#f6ca62] font-semibold">{profile.am_duc}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              <MusicPlayer />

              {profile && <NotificationBell />}

              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-sm text-[#c9b493] hover:text-[#fff1cf] hover:bg-[#eeb337]/10 transition-colors"
                title="Chuyển giao diện"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              {profile && (
                <button
                  onClick={signOut}
                  className="p-2 rounded-lg text-[#c9b493] hover:text-[#f2a06b] hover:bg-[#b73720]/15 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}

              {!profile && (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-semibold text-[#fff1cf] bg-[#8f2418]/80 hover:bg-[#b73720] border border-[#eeb337]/30 transition-all"
                  title="Đăng nhập"
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Đăng Nhập</span>
                </Link>
              )}

              {!profile && (
                <Link
                  to="/register"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-semibold text-[#f6ca62] border border-[#eeb337]/35 hover:bg-[#eeb337]/10 transition-all"
                  title="Đăng ký"
                >
                  Đăng Ký
                </Link>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'}
                className="2xl:hidden flex items-center gap-1.5 p-1.5 rounded-sm text-[#c9b493] hover:text-[#fff1cf] hover:bg-[#eeb337]/10 transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                <span className="hidden sm:inline text-xs font-medium">Menu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="2xl:hidden border-t border-[#eeb337]/15 bg-[#170b09]/95 backdrop-blur-xl">
            {profile && <div className="px-4 pt-3 pb-2 mb-1 border-b border-[#eeb337]/15"><SearchBar /></div>}
            <div className="px-4 py-3 space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto">
              {allNavItems.map(item => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-all ${
                      active
                        ? 'bg-[#8f2418]/30 text-[#fff1cf] border-l-2 border-[#eeb337]/60'
                        : 'text-[#c9b493]/70 hover:text-[#fff1cf] hover:bg-[#eeb337]/10'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                    <span className="inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="relative z-10 mx-auto max-w-[1500px] px-4 sm:px-6 py-8 min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Page transition overlay — talisman falls, burns zigzag, ash sweeps */}
      <PageTransition />

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#eeb337]/15 bg-[#0d0807]/70 backdrop-blur-sm">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 py-6 text-center">
          <p className="font-script text-xs text-[#d7a96d]/60">
            Trùng Hoan Tái — Nơi linh hồn sinh tử song hành
          </p>
          <p className="mt-1 text-[10px] text-[#8a6a4a]/50">
            Mọi giao dịch đều được ghi vết. Mọi danh tính đều có dấu tích.
          </p>
        </div>
      </footer>
    </div>
  );
}
