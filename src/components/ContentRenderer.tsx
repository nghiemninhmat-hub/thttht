import { useMemo } from 'react';
import { Flame, AlertTriangle, Gift, Shield, Skull, Coins, Sparkles, Star } from 'lucide-react';

// Highlight key terms inline
function renderInlineEmphasis(text: string, keyIdx: number): React.ReactNode {
  const phrases: Array<[string, string]> = [
    ['Cổng Âm Tào', 'font-semibold text-amber-400/90'],
    ['Trùng Hoan Tái', 'font-semibold text-amber-400/90'],
    ['Bách Quỷ Âm', 'font-semibold text-amber-400/90'],
    ['Dị Sự Bảng', 'font-semibold text-amber-400/90'],
    ['Kim Bảng Đề Danh', 'font-semibold text-amber-400/90'],
    ['Kim Bảng', 'font-semibold text-amber-400/90'],
    ['Âm Đức', 'font-semibold text-amber-300/90'],
    ['Viên Mãn Hoàn Thành', 'font-bold text-red-400/90'],
    ['Không có hồi sinh', 'font-bold text-red-400/90'],
    ['Không có tài khoản mới', 'font-bold text-red-400/90'],
    ['Không có cơ hội thứ hai', 'font-bold text-red-400/90'],
  ];

  const words: Array<[string, string]> = [
    ['Du Hồn', 'font-bold text-red-400/90'],
    ['Oán Hồn', 'font-bold text-red-400/90'],
    ['Lệ Quỷ', 'font-bold text-red-400/90'],
    ['Hung Sát', 'font-bold text-red-400/90'],
    ['Quỷ Tướng', 'font-bold text-red-400/90'],
    ['Quỷ Vương', 'font-bold text-red-400/90'],
    ['Hoa Tiền', 'font-semibold text-amber-300/90'],
    ['Công Đức', 'font-semibold text-amber-300/90'],
    ['Hệ Thống', 'font-semibold text-amber-300/80'],
    ['Cấm Địa', 'font-semibold text-amber-300/80'],
  ];

  let result: React.ReactNode[] = [text];
  let uniqueKey = keyIdx * 100000;

  const applyHighlight = (terms: Array<[string, string]>, useBoundary: boolean) => {
    const newResult: React.ReactNode[] = [];
    for (const node of result) {
      if (typeof node !== 'string') { newResult.push(node); continue; }
      let parts: (string | React.ReactNode)[] = [node];
      for (const [term, className] of terms) {
        const newParts: (string | React.ReactNode)[] = [];
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = useBoundary ? `\\b${escaped}\\b` : escaped;
        const regex = new RegExp(pattern, 'g');
        for (const part of parts) {
          if (typeof part !== 'string') { newParts.push(part); continue; }
          let lastIdx = 0;
          let match;
          while ((match = regex.exec(part)) !== null) {
            if (match.index > lastIdx) newParts.push(part.substring(lastIdx, match.index));
            newParts.push(<span key={uniqueKey++} className={className}>{match[0]}</span>);
            lastIdx = match.index + match[0].length;
          }
          if (lastIdx < part.length) newParts.push(part.substring(lastIdx));
        }
        parts = newParts;
      }
      newResult.push(...parts);
    }
    result = newResult;
  };

  applyHighlight(phrases, false);
  applyHighlight(words, true);
  return <>{result.map((n, i) => typeof n === 'string' ? <span key={i}>{n}</span> : n)}</>;
}

function isAllCapsHeader(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 100) return false;
  if (trimmed.startsWith('—') || trimmed.startsWith('@@')) return false;
  const cleaned = trimmed.replace(/^(I{1,3}|IV|V|VI{0,3}|IX|X{0,3})[.]\s+/, '');
  if (cleaned.length < 3) return false;
  const upperCount = (cleaned.match(/[A-ZÀ-Ý]/g) || []).length;
  const lowerCount = (cleaned.match(/[a-zà-ÿ]/g) || []).length;
  return upperCount >= 2 && lowerCount === 0;
}

function isNumberedHeader(line: string): boolean {
  return /^\d+\.\s+[A-ZÀ-Ý]/.test(line.trim());
}

function isKeyValue(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('@@')) return false;
  const colonIdx = trimmed.indexOf(':');
  if (colonIdx < 3 || colonIdx > 45) return false;
  const key = trimmed.substring(0, colonIdx).trim();
  if (key.length < 2 || key.length > 40) return false;
  if (/^(Thứ nhất|Thứ hai|Thứ ba|Thứ tư|Thứ năm|Thứ sáu|Thứ bảy|Thứ tám|Thứ chín|Thứ mười)/.test(key)) return false;
  return /^[A-ZÀ-Ýa-zà-ÿ0-9\s/.()-]+$/.test(key);
}

function isBullet(line: string): boolean {
  return line.trim().startsWith('-') || line.trim().startsWith('•');
}

function isSeparator(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === '' || /^[—–-]{3,}$/.test(trimmed);
}

// Block markers: @@card, @@table, @@callout
function isBlockStart(line: string): string | null {
  const trimmed = line.trim();
  if (trimmed.startsWith('@@card ')) return 'card';
  if (trimmed.startsWith('@@callout ')) return 'callout';
  if (trimmed.startsWith('@@table')) return 'table';
  if (trimmed === '@@end') return 'end';
  return null;
}

const CALLOUT_ICONS: Record<string, typeof Flame> = {
  warning: AlertTriangle,
  reward: Gift,
  danger: Skull,
  info: Shield,
  currency: Coins,
  rank: Star,
};

export function ContentRenderer({ content }: { content: string }) {
  const lines = useMemo(() => content.split('\n'), [content]);

  const elements: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];
  let listKey = 0;
  let i = 0;

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="space-y-1 my-2 ml-1">
          {listBuffer}
        </ul>
      );
      listBuffer = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const blockType = isBlockStart(line);

    // Handle block markers
    if (blockType === 'end') { i++; continue; }

    if (blockType === 'card') {
      flushList();
      const title = trimmed.replace(/^@@card\s+/, '');
      const cardLines: string[] = [];
      i++;
      while (i < lines.length && !isBlockStart(lines[i])) {
        cardLines.push(lines[i]);
        i++;
      }
      elements.push(
        <div key={`card-${i}`} className="my-3 rounded-xl border border-[#670201]/30 bg-gradient-to-br from-[#1a0a08]/80 to-[#0d0606]/80 p-4 sm:p-5 shadow-lg shadow-black/20">
          {title && (
            <div className="mb-3 flex items-center gap-2 border-b border-[#670201]/20 pb-2">
              <Flame className="h-4 w-4 text-[#b73720]/70" />
              <h5 className="text-sm font-serif font-bold text-amber-200/90">{title}</h5>
            </div>
          )}
          <div className="space-y-1">
            <ContentRenderer content={cardLines.join('\n')} />
          </div>
        </div>
      );
      continue;
    }

    if (blockType === 'callout') {
      flushList();
      const rest = trimmed.replace(/^@@callout\s+/, '');
      const [calloutType, ...titleParts] = rest.split(' ');
      const title = titleParts.join(' ');
      const calloutLines: string[] = [];
      i++;
      while (i < lines.length && !isBlockStart(lines[i])) {
        calloutLines.push(lines[i]);
        i++;
      }
      const Icon = CALLOUT_ICONS[calloutType] || Shield;
      const colorMap: Record<string, string> = {
        warning: 'border-amber-400/30 bg-amber-400/5',
        reward: 'border-[#b73720]/30 bg-[#b73720]/5',
        danger: 'border-red-500/30 bg-red-500/5',
        info: 'border-[#eeb337]/20 bg-[#eeb337]/5',
        currency: 'border-[#f6ca62]/25 bg-[#f6ca62]/5',
        rank: 'border-[#eeb337]/30 bg-[#eeb337]/5',
      };
      const iconColorMap: Record<string, string> = {
        warning: 'text-amber-400',
        reward: 'text-[#b73720]',
        danger: 'text-red-400',
        info: 'text-[#eeb337]',
        currency: 'text-[#f6ca62]',
        rank: 'text-[#eeb337]',
      };
      elements.push(
        <div key={`callout-${i}`} className={`my-3 rounded-xl border p-4 sm:p-5 ${colorMap[calloutType] || colorMap.info}`}>
          <div className="mb-2 flex items-center gap-2">
            <Icon className={`h-4 w-4 ${iconColorMap[calloutType] || iconColorMap.info}`} />
            {title && <h5 className={`text-sm font-serif font-bold ${iconColorMap[calloutType] || iconColorMap.info}`}>{title}</h5>}
          </div>
          <div className="space-y-1">
            <ContentRenderer content={calloutLines.join('\n')} />
          </div>
        </div>
      );
      continue;
    }

    if (blockType === 'table') {
      flushList();
      i++;
      const tableLines: string[] = [];
      while (i < lines.length && !isBlockStart(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      // Parse table: first line = header, subsequent lines = rows, cells separated by |
      const rows = tableLines.filter(l => l.trim()).map(l => l.split('|').map(c => c.trim()));
      if (rows.length > 0) {
        const header = rows[0];
        const bodyRows = rows.slice(1);
        elements.push(
          <div key={`table-${i}`} className="my-4 overflow-hidden rounded-xl border border-[#670201]/25 bg-[#0b0505]/60">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-separate border-spacing-0 text-xs leading-relaxed sm:text-sm">
                <thead>
                  <tr className="bg-[#670201]/10">
                    {header.map((cell, ci) => (
                      <th key={ci} className="px-3 py-2.5 text-left font-semibold tracking-wide text-amber-300/80 whitespace-normal break-words align-top border-b border-[#670201]/30">
                        {renderInlineEmphasis(cell, i + ci)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, ri) => (
                    <tr key={ri} className="bg-[#670201]/5 border-b border-white/5 last:border-0 hover:bg-[#670201]/[0.08] transition-colors">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2.5 font-semibold text-amber-300/80 whitespace-normal break-words align-top min-w-[100px]">
                          {renderInlineEmphasis(cell, i + ri * 100 + ci)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
      continue;
    }

    if (isSeparator(line)) {
      flushList();
      if (/^[—–-]{3,}$/.test(trimmed)) {
        elements.push(
          <div key={`sep-${i}`} className="flex items-center justify-center my-4">
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#670201]/30" />
            <div className="w-1 h-1 mx-2 rounded-full bg-[#670201]/40" />
            <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#670201]/30" />
          </div>
        );
      }
      i++;
      continue;
    }

    if (isAllCapsHeader(trimmed)) {
      flushList();
      const romanMatch = trimmed.match(/^(I{1,3}|IV|V|VI{0,3}|IX|X{0,3})[.]\s+(.*)/);
      if (romanMatch) {
        elements.push(
          <div key={`rh-${i}`} className="mt-5 mb-2 first:mt-0">
            <div className="flex items-center gap-2.5">
              <span className="flex-shrink-0 text-xs font-bold text-[#a00404]/80 font-serif">{romanMatch[1]}.</span>
              <div className="w-0.5 h-4 rounded-full bg-[#670201]/60" />
              <h4 className="text-sm font-serif font-bold tracking-wide text-amber-200/90 uppercase">{romanMatch[2]}</h4>
            </div>
          </div>
        );
      } else {
        elements.push(
          <div key={`h-${i}`} className="mt-5 mb-2 first:mt-0">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#670201] to-[#a00404]" />
              <h4 className="text-sm font-serif font-bold tracking-wide text-amber-200/90 uppercase">{trimmed}</h4>
            </div>
          </div>
        );
      }
      i++;
      continue;
    }

    if (isNumberedHeader(trimmed)) {
      flushList();
      const match = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (match) {
        elements.push(
          <div key={`nh-${i}`} className="mt-5 mb-2 first:mt-0">
            <div className="flex items-start gap-2.5">
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-[#670201]/30 to-[#a00404]/20 border border-[#670201]/25 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-200/90">{match[1]}</span>
              </div>
              <h4 className="text-base font-serif font-bold text-amber-100/90 pt-0.5">{renderInlineEmphasis(match[2], i)}</h4>
            </div>
          </div>
        );
      }
      i++;
      continue;
    }

    if (isBullet(trimmed)) {
      const bulletContent = trimmed.replace(/^[-•]\s*/, '');
      listBuffer.push(
        <li key={`b-${i}`} className="flex items-start gap-2 text-sm text-gray-400 leading-relaxed">
          <span className="mt-1.5 w-1 h-1 rounded-full bg-[#670201]/50 flex-shrink-0" />
          <span>{renderInlineEmphasis(bulletContent, i)}</span>
        </li>
      );
      i++;
      continue;
    }

    if (isKeyValue(trimmed)) {
      flushList();
      const colonIdx = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIdx).trim();
      const value = trimmed.substring(colonIdx + 1).trim();
      elements.push(
        <div key={`kv-${i}`} className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-3 my-1">
          <span className="text-sm font-semibold text-amber-300/60 sm:min-w-[130px] flex-shrink-0">{key}:</span>
          <span className="text-sm text-gray-400 leading-relaxed flex-1">{renderInlineEmphasis(value, i)}</span>
        </div>
      );
      i++;
      continue;
    }

    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-sm text-gray-400 leading-relaxed my-1.5">
        {renderInlineEmphasis(trimmed, i)}
      </p>
    );
    i++;
  }

  flushList();
  return <>{elements}</>;
}
