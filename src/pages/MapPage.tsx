import { useState } from 'react';
import {
  Anchor, Castle, ChevronDown, Compass, Crown, Flame, MapPinned,
  Mountain, ScrollText, Shield, Sparkles, Waves
} from 'lucide-react';

type Place = {
  name: string;
  region: string;
  description: string;
  icon: typeof Castle;
  position: string;
  tone: string;
};

const places: Place[] = [
  {
    name: 'Thiên Kinh',
    region: 'Trung tâm',
    description: 'Kinh đô phồn hoa, nơi đặt Hoàng thành và trung tâm quyền lực của Trùng Hoan.',
    icon: Crown,
    position: 'left-[42%] top-[40%]',
    tone: 'border-amber-300/50 bg-amber-300/15 text-amber-200',
  },
  {
    name: 'Thanh Châu',
    region: 'Đông Bắc',
    description: 'Đồng bằng rộng lớn, kho lương của thiên hạ, nơi sông ngòi chằng chịt.',
    icon: Waves,
    position: 'left-[72%] top-[28%]',
    tone: 'border-sky-300/40 bg-sky-300/10 text-sky-200',
  },
  {
    name: 'Vân Châu',
    region: 'Phía Bắc',
    description: 'Miền núi lạnh quanh năm, rừng già và thảo nguyên thưa dân.',
    icon: Mountain,
    position: 'left-[58%] top-[14%]',
    tone: 'border-slate-300/40 bg-slate-300/10 text-slate-200',
  },
  {
    name: 'Huyền Châu',
    region: 'Tây Bắc',
    description: 'Chiến trường cổ, nơi nhiều dị sự và âm khí lưu lại sau những trận chiến.',
    icon: Flame,
    position: 'left-[20%] top-[28%]',
    tone: 'border-red-300/50 bg-red-300/15 text-red-200',
  },
  {
    name: 'Minh Châu',
    region: 'Phía Đông',
    description: 'Giáp biển, là trung tâm hàng hải và những thương cảng sầm uất.',
    icon: Anchor,
    position: 'left-[82%] top-[48%]',
    tone: 'border-cyan-300/40 bg-cyan-300/10 text-cyan-200',
  },
  {
    name: 'Giang Châu',
    region: 'Phía Nam',
    description: 'Sông lớn đan xen, giao thương đường thủy phát triển mạnh.',
    icon: Waves,
    position: 'left-[54%] top-[72%]',
    tone: 'border-emerald-300/40 bg-emerald-300/10 text-emerald-200',
  },
  {
    name: 'Linh Châu',
    region: 'Tây Nam',
    description: 'Rừng rậm, đầm lầy và khí hậu nóng ẩm, nổi tiếng với dược quý.',
    icon: Sparkles,
    position: 'left-[28%] top-[72%]',
    tone: 'border-lime-300/40 bg-lime-300/10 text-lime-200',
  },
  {
    name: 'Sở Châu',
    region: 'Phía Tây',
    description: 'Núi đá hiểm trở, khoáng sản phong phú và những lò rèn danh tiếng.',
    icon: Shield,
    position: 'left-[12%] top-[48%]',
    tone: 'border-orange-300/40 bg-orange-300/10 text-orange-200',
  },
  {
    name: 'Thiên Môn Sơn',
    region: 'Biên giới Bắc',
    description: 'Dãy núi cao nhất Trùng Hoan, mây mù bao phủ và ít người đặt chân tới.',
    icon: Mountain,
    position: 'left-[35%] top-[10%]',
    tone: 'border-stone-300/40 bg-stone-300/10 text-stone-200',
  },
  {
    name: 'Vô Tận Hải',
    region: 'Ngoài khơi',
    description: 'Vùng biển mù sương, nơi tồn tại những hải vực không thuộc nhân gian.',
    icon: Waves,
    position: 'left-[82%] top-[78%]',
    tone: 'border-blue-300/40 bg-blue-300/10 text-blue-200',
  },
  {
    name: 'Cấm Địa',
    region: 'Khu vực phong ấn',
    description: 'Những vùng bị âm khí nuốt chửng, chỉ xuất hiện sau các sự kiện đặc biệt.',
    icon: ScrollText,
    position: 'left-[65%] top-[60%]',
    tone: 'border-rose-300/50 bg-rose-300/15 text-rose-200',
  },
];

export default function MapPage() {
  const [selectedPlace, setSelectedPlace] = useState<Place>(places[0]);
  const [showPlaces, setShowPlaces] = useState(false);

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 sm:space-y-6 lg:space-y-8">
      <header className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#670201]/30 bg-gradient-to-br from-[#1c0908] via-[#110707] to-[#080405] px-4 py-6 text-center sm:px-8 sm:py-10 lg:px-12">
        <div className="absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 rounded-full bg-[#a00404]/10 blur-3xl" />
        <div className="relative z-10">
          <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">
            <Compass className="h-4 w-4" />
            Địa Đồ Cổ Văn
          </div>
          <h1 className="font-hero text-4xl font-bold tracking-wide text-amber-100 sm:text-6xl lg:text-7xl">Địa Lý Trùng Hoan</h1>
          <p className="mx-auto mt-3 max-w-2xl text-xs leading-6 text-gray-400 sm:mt-4 sm:text-base sm:leading-7">Bản đồ các vùng đất, kinh đô, sơn mạch và hải vực nơi những linh hồn tìm đường trở về hiện thực.</p>
          <div className="mx-auto mt-4 flex items-center justify-center gap-2 text-[9px] normal-case tracking-[0.2em] text-[#c68b62]/80 sm:mt-6 sm:gap-3 sm:text-[10px] sm:tracking-[0.3em]">
            <span className="h-px w-8 bg-[#670201]/60 sm:w-12" />
            <span>Trùng Hoan Tái</span>
            <span className="h-px w-12 bg-[#670201]/60" />
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#670201]/25 bg-[#0a0505] p-1.5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] sm:p-3 lg:p-4">
          <div className="relative aspect-[179/100] overflow-hidden rounded-xl sm:rounded-2xl border border-[#c68b62]/20 bg-[#1a0c0a]">
            <img src="/trung-hoan-map.webp" alt="Địa đồ minh họa các vùng đất Trùng Hoan" className="absolute inset-0 h-full w-full object-contain object-center opacity-100" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_52%,rgba(8,3,4,0.38)_100%)] pointer-events-none" />

            {places.map(place => {
              const active = selectedPlace.name === place.name;
              const Icon = place.icon;
              return (
                <button key={place.name} aria-label={`Chọn ${place.name}`} onClick={() => setSelectedPlace(place)} className={`group absolute z-30 -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 ${place.position} ${active ? 'scale-105' : 'hover:scale-105'}`}>
                  <span className={`flex items-center gap-0.5 rounded-full border px-1 py-0.5 text-[5px] font-semibold whitespace-nowrap shadow-md backdrop-blur-md transition-colors sm:gap-1 sm:px-2 sm:py-1 sm:text-[9px] lg:text-[10px] ${active ? 'border-amber-200/70 bg-[#670201]/85 text-amber-100 shadow-[#670201]/40' : 'border-white/25 bg-black/65 text-gray-200 group-hover:border-amber-300/60 group-hover:text-amber-100'}`}>
                    <Icon className="hidden sm:block sm:h-3 sm:w-3" />
                    {place.name}
                  </span>
                  <span className={`mx-auto mt-0.5 block h-1 w-1 rounded-full border border-amber-100/70 bg-[#a00404] shadow-[0_0_8px_rgba(160,4,4,0.85)] sm:h-2 sm:w-2 ${active ? 'animate-pulse' : ''}`} />
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[10px] text-gray-500 sm:mt-3 sm:text-xs">
            <span>Chạm vào tên địa danh để xem ghi chép</span>
            <span className="hidden items-center gap-1 sm:flex"><MapPinned className="h-3.5 w-3.5" /> {places.length} địa danh</span>
          </div>
        </div>

        <aside className="flex flex-col rounded-2xl sm:rounded-3xl border border-[#670201]/25 bg-gradient-to-b from-[#160908] to-[#0b0505] p-4 sm:p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/20 bg-amber-300/10"><MapPinned className="h-5 w-5 text-amber-200" /></div>
            <div><p className="text-xs uppercase tracking-[0.18em] text-amber-300/60">Đang tra cứu</p><h2 className="font-serif text-xl font-bold text-amber-100">{selectedPlace.name}</h2></div>
          </div>
          <div className="mb-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className={`mb-3 flex w-fit items-center gap-2 rounded-full border px-2.5 py-1 text-xs ${selectedPlace.tone}`}><selectedPlace.icon className="h-3.5 w-3.5" />{selectedPlace.region}</div>
            <p className="text-sm leading-7 text-gray-400">{selectedPlace.description}</p>
          </div>
          <button onClick={() => setShowPlaces(!showPlaces)} className="flex items-center justify-between rounded-xl border border-[#670201]/25 bg-[#670201]/10 px-4 py-3 text-sm font-semibold text-amber-200 transition-colors hover:bg-[#670201]/20">
            <span>Danh mục địa danh</span><ChevronDown className={`h-4 w-4 transition-transform ${showPlaces ? 'rotate-180' : ''}`} />
          </button>
          {showPlaces && <div className="mt-2 max-h-64 space-y-1 overflow-y-auto pr-1">{places.map(place => <button key={place.name} onClick={() => { setSelectedPlace(place); setShowPlaces(false); }} className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${selectedPlace.name === place.name ? 'bg-[#670201]/25 text-amber-100' : 'text-gray-400 hover:bg-white/5 hover:text-amber-100'}`}>{place.name}<span className="ml-2 text-xs text-gray-600">{place.region}</span></button>)}</div>}
          <div className="mt-auto hidden pt-8 sm:block"><div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gray-600"><span className="h-px flex-1 bg-white/10" /><Sparkles className="h-3.5 w-3.5" /><span className="h-px flex-1 bg-white/10" /></div><p className="mt-3 text-center text-xs italic leading-6 text-gray-600">Mỗi vùng đất đều lưu giữ một dấu tích. Mỗi dấu tích đều có giá của nó.</p></div>
        </aside>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        {[
          ['Trung tâm vương triều', 'Thiên Kinh', Crown],
          ['Sơn mạch cổ xưa', 'Thiên Môn Sơn', Mountain],
          ['Cửa ngõ hàng hải', 'Minh Châu', Anchor],
          ['Ranh giới cấm kỵ', 'Cấm Địa', ScrollText],
        ].map(([label, value, Icon]) => <div key={value as string} className="rounded-2xl border border-white/10 bg-black/20 p-4"><Icon className="mb-3 h-4 w-4 text-amber-300/70" /><p className="text-xs uppercase tracking-wider text-gray-600">{label as string}</p><p className="mt-1 font-serif font-bold text-amber-100/90">{value as string}</p></div>)}
      </section>
    </div>
  );
}
