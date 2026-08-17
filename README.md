# Trùng Hoan Tái

Ứng dụng web role-play thế giới Trùng Hoan Tái, xây dựng bằng React + Vite + Supabase.

## Yêu cầu

- Node.js 18+
- npm

## Cài đặt và chạy local

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
```

Kết quả build nằm trong thư mục `dist/`.

## Deploy

### Netlify

File `netlify.toml` đã cấu hình sẵn:
- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirects: tất cả đường dẫn chuyển về `index.html`

### Vercel

File `vercel.json` đã cấu hình sẵn SPA rewrite.

### Biến môi trường

Cần thiết lập 2 biến sau (xem `.env.example`):

- `VITE_SUPABASE_URL` — URL dự án Supabase
- `VITE_SUPABASE_ANON_KEY` — anon key của Supabase

Trên Netlify/Vercel, thêm 2 biến này vào mục Environment Variables của dự án.
