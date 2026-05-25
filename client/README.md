# LinguaBook Pro 📚

AI yordamida kitoblarni istalgan tilga tarjima qilish, o'qish va daromad topish platformasi.

## Texnologiyalar

- **Frontend/Backend:** Next.js 16 (App Router, TypeScript)
- **Database & Auth:** Supabase (PostgreSQL, RLS, Storage)
- **AI:** OpenAI GPT-4o-mini (tarjima, chat) + TTS-1 (audio)
- **Dizayn:** TailwindCSS v4 + Custom CSS
- **Payments:** Mock Payme/Click (MVP)

## Ishga tushirish

### 1. O'rnatish
```bash
cd client
npm install
```

### 2. Environment o'zgaruvchilar
`.env.local.example` faylini `.env.local` ga nusxalab, qiymatlarni to'ldiring:
```bash
cp .env.local.example .env.local
```

### 3. Supabase sozlash
1. [supabase.com](https://supabase.com) da loyiha yarating
2. `supabase-schema.sql` faylini **SQL Editor** ga joylashtiring va ishga tushiring
3. **Storage** da 3 ta bucket yarating: `books`, `audio`, `covers`

### 4. Ishga tushirish
```bash
npm run dev
```

Brauzerda: `http://localhost:3000`

## Sahifalar

| Sahifa | Manzil | Tavsif |
|--------|--------|--------|
| Landing | `/` | Asosiy sahifa |
| Tarjima | `/translate` | AI tarjima workspace |
| Kutubxona | `/library` | Barcha ommaviy kitoblar |
| Marketplace | `/marketplace` | Sotuvdagi kitoblar |
| Kitob | `/book/[id]` | Kitob tafsilotlari, audio, reyting |
| Profil | `/profile` | Foydalanuvchi, hamyon, premium |
| Admin | `/admin` | Admin panel (faqat adminlar) |

## Foydalanuvchi rollari

| Rol | Imkoniyatlar |
|-----|-------------|
| **Freemium** | Tarjima qilish, bepul kitoblarni o'qish |
| **Premium** | Barcha kitoblar, audio, marketplace da sotish, 70% daromad |
| **Admin** | Barcha boshqaruv, DMCA takedown |

## API Endpointlar

- `POST /api/translate` — Server-side tarjima (xavfsiz)
- `POST /api/chat` — AI kitob tahlili
- `POST /api/audio` — TTS audio yaratish
- `GET /auth/callback` — Supabase auth callback

## Biznes Model

- **Premium obuna:** 99,000 so'm/oy
- **Kitob sotish:** 70% sotuvchiga, 30% platforma
- **To'lov:** Payme/Click (hozir Mock rejim)
