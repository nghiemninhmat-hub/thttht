import { Link } from 'react-router-dom';
import { ExternalLink, ArrowDown, ArrowRight, BookOpen, Coins, Flame, Ghost, MessageSquare, Scroll, Shield, Sparkles, Store, UserCircle, Skull, Users } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { CURRENCY_ICONS } from '@/lib/supabase';

const entryPoints = [
  {
    title: 'Thương Thành',
    subtitle: 'Pháp khí & linh dược',
    desc: 'Trao đổi vật phẩm bằng Hoa Tiền, Công Đức và Âm Đức.',
    icon: Store,
    path: '/shop',
  },
  {
    title: 'Thế Giới Quan',
    subtitle: 'Cổ văn & dị sự',
    desc: 'Mở từng trang bách khoa để hiểu luật lệ của cõi này.',
    icon: BookOpen,
    path: '/world',
  },
  {
    title: 'Diễn Đàn Ẩn Danh',
    subtitle: 'Lời người sống',
    desc: 'Để lại dấu tích, nhưng không để lộ danh tính thật.',
    icon: MessageSquare,
    path: '/forum',
  },
  {
    title: 'Thư Tín Nội Bộ',
    subtitle: 'Tin nhắn mật',
    desc: 'Gửi lời nhắn qua màn sương đến những linh hồn khác.',
    icon: Scroll,
    path: '/messages',
  },
];

export default function HomePage() {
  const { profile, isAdmin } = useAuth();

  return (
    <div className="space-y-14 pb-8">
      <section className="relative isolate -mx-4 -mt-8 min-h-[calc(100vh-4rem)] overflow-hidden bg-[#170b09] px-4 pb-20 pt-10 sm:-mx-6 sm:px-6 lg:pt-16">
        {/* Blood moon — offset upper-right, prominent and ornamental */}
        <div className="pointer-events-none absolute right-[6%] top-[3%] z-0 h-[min(52vw,20rem)] w-[min(52vw,20rem)] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(214,65,46,0.14),rgba(140,17,17,0.07)_40%,transparent_70%)] sm:right-[8%] sm:h-[min(32vw,18rem)] sm:w-[min(32vw,18rem)]" />
        <div className="pointer-events-none absolute right-[10%] top-[6%] z-0 h-[min(38vw,15rem)] w-[min(38vw,15rem)] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(180,40,30,0.1),transparent_65%)] sm:h-[min(24vw,14rem)] sm:w-[min(24vw,14rem)]" />
        {/* Blood moon disc — full, detailed */}
        <svg className="pointer-events-none absolute right-[8%] top-[5%] z-0 h-[min(34vw,13rem)] w-[min(34vw,13rem)] sm:right-[10%] sm:h-[min(22vw,12rem)] sm:w-[min(22vw,12rem)]" viewBox="0 0 200 200" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="bloodMoonBody" cx="0.4" cy="0.35" r="0.7">
              <stop offset="0%" stopColor="#e8553e" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#c23420" stopOpacity="0.7" />
              <stop offset="75%" stopColor="#8c1111" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#360606" stopOpacity="0.25" />
            </radialGradient>
            <radialGradient id="bloodMoonHalo" cx="0.5" cy="0.5" r="0.5">
              <stop offset="70%" stopColor="rgba(214,65,46,0)" />
              <stop offset="85%" stopColor="rgba(214,65,46,0.08)" />
              <stop offset="100%" stopColor="rgba(214,65,46,0)" />
            </radialGradient>
          </defs>
          {/* Outer halo ring */}
          <circle cx="100" cy="100" r="98" fill="url(#bloodMoonHalo)" />
          {/* Thin ornamental rings */}
          <circle cx="100" cy="100" r="92" stroke="rgba(180,40,30,0.2)" strokeWidth="0.4" />
          <circle cx="100" cy="100" r="86" stroke="rgba(140,17,17,0.15)" strokeWidth="0.3" strokeDasharray="1 2" />
          {/* Moon body */}
          <circle cx="100" cy="100" r="80" fill="url(#bloodMoonBody)" />
          {/* Surface craters — subtle texture */}
          <circle cx="78" cy="72" r="8" fill="rgba(92,22,15,0.2)" />
          <circle cx="125" cy="85" r="5" fill="rgba(92,22,15,0.15)" />
          <circle cx="95" cy="120" r="10" fill="rgba(92,22,15,0.18)" />
          <circle cx="135" cy="130" r="6" fill="rgba(92,22,15,0.12)" />
          <circle cx="70" cy="110" r="4" fill="rgba(92,22,15,0.1)" />
          {/* Inner rim highlight */}
          <circle cx="100" cy="100" r="80" stroke="rgba(232,85,62,0.3)" strokeWidth="0.8" />
          <circle cx="100" cy="100" r="77" stroke="rgba(255,200,180,0.12)" strokeWidth="0.3" />
        </svg>
        {/* Faint stars scattered — ornamental */}
        <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g fill="rgba(246,202,98,0.2)">
            <circle cx="180" cy="120" r="1" />
            <circle cx="320" cy="80" r="0.7" />
            <circle cx="500" cy="180" r="0.6" />
            <circle cx="1100" cy="100" r="0.8" />
            <circle cx="1350" cy="200" r="0.6" />
            <circle cx="1480" cy="140" r="0.7" />
            <circle cx="80" cy="260" r="0.5" />
            <circle cx="1250" cy="60" r="0.6" />
            <circle cx="250" cy="350" r="0.5" />
            <circle cx="1400" cy="340" r="0.6" />
          </g>
        </svg>

        <div className="absolute inset-x-0 bottom-0 z-0 h-2/5 bg-gradient-to-t from-[#0d0807] via-[#3d130e]/30 to-transparent" />

        {/* Paper grain overlay */}
        <div className="hero-grain pointer-events-none absolute inset-0 z-[1] opacity-[0.35] sm:opacity-[0.25]" />

        {/* Ink mountains — layered, irregular silhouettes like the reference */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-[50%] overflow-hidden sm:h-[58%]">
          <svg className="absolute bottom-0 left-1/2 h-full w-[140%] -translate-x-1/2" viewBox="0 0 1600 360" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 360V220c48-18 71-37 111-31 34 5 45-32 77-37 36-6 47 33 78 27 36-7 52-58 88-58 42 0 45 48 77 48 34 0 46-36 79-39 40-4 57 43 91 42 36-1 45-57 82-58 38-1 51 44 88 45 33 1 48-29 83-31 43-2 56 35 91 34 41-1 53-50 90-52 42-2 56 39 92 38 34-1 53-34 85-35 39-2 61 34 96 32 38-2 49-42 87-47 44-5 59 31 101 29 35-2 56-27 89-35v171Z" fill="#5c2820" opacity="0.55" />
            <path d="M0 360V255c54-18 83-12 118-25 38-14 48-48 82-50 38-2 52 31 86 28 38-4 48-47 84-49 42-3 53 35 88 36 37 1 49-32 83-35 41-3 58 34 93 35 36 1 51-42 86-45 43-3 56 39 94 40 36 1 50-27 82-31 40-5 62 30 97 29 38-1 51-37 85-40 43-4 57 33 94 35 37 2 52-26 85-31 44-7 63 22 99 24 39 2 57-21 97-34v156Z" fill="#2e1410" opacity="0.85" />
            <path d="M0 360V330c160-13 237-5 352-16 134-13 225-5 354-14 137-10 235-3 362-11 137-9 251-2 532-16v87Z" fill="#0d0807" opacity="0.65" />
          </svg>
        </div>

        {/* Silk ribbon — broad translucent brush-like band across the foot */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[28%] overflow-hidden sm:h-[35%]">
          <svg className="animate-silk-wave absolute bottom-[-10%] left-1/2 h-full w-[180%] -translate-x-1/2 sm:w-[155%]" viewBox="0 0 1600 180" preserveAspectRatio="none" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="silkGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7c241c" stopOpacity="0.3" />
                <stop offset="20%" stopColor="#d77e58" stopOpacity="0.55" />
                <stop offset="48%" stopColor="#8f3d2f" stopOpacity="0.4" />
                <stop offset="72%" stopColor="#d77e58" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#7c241c" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path d="M-40 120C130 38 245 156 390 94S635 68 775 119s205 16 307-32c119-56 213 28 346-19l213-64v84c-137 56-211-18-337 31-106 41-189 25-302 70-123 49-209 38-334-8-138-51-254 54-409-16-90-41-160-15-201 12Z" fill="url(#silkGrad)" />
            <path d="M-30 129C125 56 242 167 385 105S630 83 770 128s209 19 312-29c117-54 211 28 340-18" stroke="#e4a079" strokeOpacity="0.3" strokeWidth="13" />
          </svg>
        </div>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col items-center justify-center text-center">
          <div className="mb-7 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.42em] text-[#f6ca62]/75 sm:text-xs">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#eeb337]/70 sm:w-16" />
            <span>Hệ Thống Trùng Hoan</span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#eeb337]/70 sm:w-16" />
          </div>

          {/* Logo with rotating seal-mark ring */}
          <div className="relative z-10 mb-7 flex h-28 w-28 items-center justify-center sm:h-40 sm:w-40">
            <div className="animate-seal-rotate pointer-events-none absolute inset-[-8px] rounded-full border border-dashed border-[#f6ca62]/40" />
            <div className="flex h-full w-full items-center justify-center rounded-full border border-[#f6ca62]/60 bg-gradient-to-br from-[#c84a24] via-[#8f2418] to-[#4a120d] shadow-[0_0_0_6px_rgba(238,179,55,0.06),0_0_45px_rgba(183,55,32,0.45)]">
              <div className="absolute inset-3 rounded-full border border-[#f6ca62]/25" />
              <div className="relative flex flex-col items-center text-[#fff1cf]">
                <span className="relative inline-block font-han text-5xl font-normal leading-none tracking-[0.08em] text-[#fff8df] drop-shadow-[0_2px_8px_rgba(246,202,98,0.55)] sm:text-6xl">重</span>
                <span className="mt-2 text-[6px] font-semibold uppercase tracking-[0.1em] text-[#f6ca62] sm:text-[9px] sm:tracking-[0.35em]">trùng hoan</span>
              </div>
            </div>
          </div>

          <h1 className="max-w-4xl text-balance font-sans text-[clamp(1.5rem,8vw,4.5rem)] font-bold uppercase leading-[1.1] tracking-[0.04em] text-[#fff1cf] drop-shadow-[0_3px_20px_rgba(238,179,55,0.2)] sm:tracking-[0.1em]">
            TRÙNG HOAN TÁI
          </h1>
          <p className="mt-6 max-w-xl font-serif text-base italic leading-relaxed text-[#f3dca8]/75 sm:text-lg">
            Nơi linh hồn bị giam giữ, sinh tử song hành.
            <br />
            <span className="text-[#f6ca62]">Mười lăm dị sự — một con đường trở về.</span>
          </p>

          <div className="relative z-20 mt-9 flex w-full max-w-sm flex-col items-center gap-4 px-2 sm:max-w-none sm:flex-row sm:justify-center sm:px-0">
            {!profile ? (
              <>
                <Link to="/register" className="group inline-flex items-center gap-3 rounded-sm border border-[#f6ca62]/80 bg-[#8f2418]/80 px-7 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#fff1cf] shadow-[0_10px_30px_rgba(92,22,15,0.35)] transition-all hover:-translate-y-1 hover:bg-[#b73720] hover:shadow-[0_12px_34px_rgba(238,179,55,0.18)]">
                  Nhập Vụ Trùng Hoan
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 rounded-sm border border-[#f3dca8]/30 px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#f3dca8]/80 transition-colors hover:border-[#f6ca62]/70 hover:bg-[#f6ca62]/10 hover:text-[#fff1cf]">
                  Đăng Nhập
                </Link>
              </>
            ) : (
              <Link to="/world" className="group inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-sm border border-[#f6ca62]/45 bg-[#170b09]/90 px-5 py-2 text-sm font-semibold uppercase leading-5 tracking-[0.2em] text-[#f6ca62] shadow-[0_8px_24px_rgba(13,8,7,0.35)] backdrop-blur-sm transition-colors hover:border-[#f6ca62]/75 hover:text-[#fff1cf]">
                Tiếp tục hành trình <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>

          {/* Bouncing arrow */}
          <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-[#f3dca8]/45">
            <span className="relative z-10 translate-y-1 bg-[#170b09] px-2 py-0.5 leading-4">Khám phá</span>
            <ArrowDown className="h-4 w-4 animate-bounce text-[#eeb337]/70" />
          </div>
        </div>
      </section>

      {profile && (
        <section className="mx-auto grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#b73720]/25 bg-[#b73720]/20 shadow-[0_20px_50px_rgba(13,8,7,0.3)] md:grid-cols-4">
          <div className="bg-[#170b09]/85 p-5 backdrop-blur-sm md:p-6">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#c9b493]/60"><UserCircle className="h-3.5 w-3.5" /> Danh tính</div>
            <p className="truncate font-serif text-lg font-bold text-[#fff1cf]">{profile.oc_name}</p>
            <p className="mt-1 text-xs text-[#d77e41]">{profile.is_approved ? 'Đã phê duyệt' : 'Chờ phê duyệt'}</p>
          </div>
          <div className="bg-[#170b09]/85 p-5 backdrop-blur-sm md:p-6"><div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#c9b493]/60"><Coins className="h-3.5 w-3.5" /> Hoa Tiền</div><p className="text-2xl font-bold text-[#f6ca62]">{CURRENCY_ICONS.HUA_TIEN} {profile.hua_tien}</p></div>
          <div className="bg-[#170b09]/85 p-5 backdrop-blur-sm md:p-6"><div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#c9b493]/60"><Sparkles className="h-3.5 w-3.5" /> Công Đức</div><p className="text-2xl font-bold text-[#f6ca62]">{CURRENCY_ICONS.CONG_DUC} {profile.cong_duc}</p></div>
          <div className="bg-[#170b09]/85 p-5 backdrop-blur-sm md:p-6"><div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#c9b493]/60"><Skull className="h-3.5 w-3.5" /> Âm Đức</div><p className="text-2xl font-bold text-[#f6ca62]">{CURRENCY_ICONS.AM_DUC} {profile.am_duc}</p></div>
        </section>
      )}

      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#eeb337]/70">Lối vào</p><h2 className="font-hero text-3xl font-bold text-[#fff1cf] sm:text-4xl">Đèn canh ba ai châm mà sáng?</h2></div>
          <Ghost className="hidden h-10 w-10 text-[#b73720]/50 sm:block" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {entryPoints.map(({ title, subtitle, desc, icon: Icon, path }) => (
            <Link key={path} to={path} className="group relative min-h-56 overflow-hidden rounded-sm border border-[#b73720]/25 bg-gradient-to-br from-[#3d130e]/60 to-[#170b09]/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#eeb337]/55 hover:shadow-[0_18px_35px_rgba(13,8,7,0.4)]">
              <div className="absolute -right-5 -top-6 text-[#eeb337]/[0.06] transition-colors group-hover:text-[#eeb337]/[0.12]"><Icon className="h-32 w-32" /></div>
              <div className="relative flex h-full flex-col">
                <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-full border border-[#eeb337]/35 bg-[#8f2418]/25 text-[#f6ca62]"><Icon className="h-4 w-4" /></div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#d77e41]">{subtitle}</p>
                <h3 className="mt-2 font-serif text-xl font-bold text-[#fff1cf]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#c9b493]/70">{desc}</p>
                <span className="mt-auto flex items-center gap-2 pt-5 text-xs font-semibold uppercase tracking-[0.15em] text-[#f6ca62]">Mở lối <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
              </div>
            </Link>
          ))}
          {isAdmin && <Link to="/admin" className="group relative min-h-56 overflow-hidden rounded-sm border border-[#b73720]/25 bg-gradient-to-br from-[#5c160f]/60 to-[#170b09]/80 p-6 transition-all hover:-translate-y-1 hover:border-[#eeb337]/55"><Shield className="mb-8 h-9 w-9 text-[#f6ca62]" /><p className="text-[10px] uppercase tracking-[0.24em] text-[#d77e41]">Người giữ cửa</p><h3 className="mt-2 font-serif text-xl font-bold text-[#fff1cf]">Bảng Điều Khiển</h3><p className="mt-2 text-sm leading-relaxed text-[#c9b493]/70">Quản trị tài khoản, tài sản và những dấu tích trong hệ thống.</p></Link>}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl overflow-hidden rounded-sm border border-[#eeb337]/25 bg-[#24100c]/80 p-7 shadow-[0_20px_60px_rgba(13,8,7,0.35)] sm:p-10">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#eeb337]/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#f6ca62]"><Flame className="h-4 w-4" /> Lời dẫn nhập</div><h2 className="max-w-2xl font-serif text-2xl font-bold leading-tight text-[#fff1cf] sm:text-3xl">Mỗi lựa chọn đều để lại một dấu tích trong lịch sử.</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-[#c9b493]/75">Bạn là một linh hồn bị giam giữ nơi sinh tử song hành. Hoàn thành 15 dị sự, giữ lấy danh tính của mình và tìm con đường duy nhất trở về hiện thực.</p></div>
          <Link to="/world" className="inline-flex items-center justify-center gap-2 border border-[#eeb337]/45 px-5 py-3 text-sm font-semibold text-[#f6ca62] transition-colors hover:bg-[#eeb337]/10 hover:text-[#fff1cf]">Đọc cổ văn <BookOpen className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl border-t border-[#b73720]/20 pt-8">
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#d77e41]">Ban Điều Hành</p>
          <h2 className="mt-2 font-hero text-2xl font-bold text-[#fff1cf]">Kết nối cùng Trùng Hoan</h2>
          <p className="mt-2 text-sm text-[#c9b493]/60">Liên hệ các quản lý hoặc tham gia cộng đồng để đồng hành trong thế giới sinh tử song hành.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: 'Vịnh Quyển Trà', url: 'https://www.facebook.com/profile.php?id=61592344791540' },
            { name: 'Biện Thừa Chí', url: 'https://www.facebook.com/profile.php?id=61590919357024' },
            { name: 'Ngôn Cảnh Tắc', url: 'https://www.facebook.com/ngon.canhtac' },
            { name: 'Kinh Trung', url: 'https://www.facebook.com/k.nihtrung' },
            { name: 'Đức Diểu Quỳnh', url: 'https://www.facebook.com/profile.php?id=61590717492629' },
          ].map(({ name, url }) => (
            <a key={name} href={url} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-3 rounded-sm border border-[#b73720]/25 bg-[#170b09]/60 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-[#eeb337]/50 hover:bg-[#24100c]/80">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eeb337]/30 bg-[#8f2418]/20 text-[#f6ca62]"><UserCircle className="h-4 w-4" /></div>
                <span className="font-serif text-sm font-semibold text-[#fff1cf]">{name}</span>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-[#d77e41] transition-colors group-hover:text-[#f6ca62]" />
            </a>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a href="https://www.facebook.com/groups/1385121653516597" target="_blank" rel="noreferrer" className="group flex flex-1 items-center justify-between gap-3 rounded-sm border border-[#eeb337]/30 bg-[#24100c]/80 px-4 py-3 transition-all hover:border-[#eeb337]/60">
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eeb337]/35 bg-[#8f2418]/25 text-[#f6ca62]"><Users className="h-4 w-4" /></div><div><p className="text-[10px] uppercase tracking-wider text-[#d77e41]">Cộng đồng</p><span className="font-serif text-sm font-semibold text-[#fff1cf]">Group Trùng Hoan</span></div></div>
            <ExternalLink className="h-3.5 w-3.5 text-[#d77e41] transition-colors group-hover:text-[#f6ca62]" />
          </a>
          <a href="https://www.facebook.com/profile.php?id=61591857702519" target="_blank" rel="noreferrer" className="group flex flex-1 items-center justify-between gap-3 rounded-sm border border-[#eeb337]/30 bg-[#24100c]/80 px-4 py-3 transition-all hover:border-[#eeb337]/60">
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eeb337]/35 bg-[#8f2418]/25 text-[#f6ca62]"><Ghost className="h-4 w-4" /></div><div><p className="text-[10px] uppercase tracking-wider text-[#d77e41]">Fanpage</p><span className="font-serif text-sm font-semibold text-[#fff1cf]">Trùng Hoan Tái</span></div></div>
            <ExternalLink className="h-3.5 w-3.5 text-[#d77e41] transition-colors group-hover:text-[#f6ca62]" />
          </a>
        </div>
      </section>
    </div>
  );
}
