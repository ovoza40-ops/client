# AI-Powered Book Translator & Marketplace (Loyiha Spetsifikatsiyasi)

## 1. Loyiha Maqsadi
Foydalanuvchilarga turli formatdagi elektron kitoblarni o'zlari xohlagan tilga tarjima qilish imkonini beruvchi, shuningdek foydalanuvchilar o'zlari tarjima qilgan kitoblaridan daromad topishi mumkin bo'lgan aqlli platforma (Marketplace & Library).

---

## 2. Asosiy Funksiyalar (Features)
*   **Fayllarni qabul qilish:** PDF, EPUB, MOBI/AZW3 formatlarini qo'llab-quvvatlash.
*   **AI orqali analiz va tarjima:**
    *   Tizim kitobni qabul qilgach, uning asl tilini o'zi aniqlaydi.
    *   Foydalanuvchidan so'raydi: *"Bu kitob inglizcha ekan, qaysi tilga tarjima qilmoqchisiz?"*
*   **Dizaynni saqlab qolish (PDF -> EPUB -> PDF):** Matn va rasmlarni yo'qotmaslik uchun murakkab formatlarni tahrirlanuvchi (EPUB) oraliq formatga o'tkazish, tarjimadan so'ng yana asl dizaynga yaqinlashtirib qaytarish.
*   **Audio kitob (Chapter by Chapter):** Butun kitob emas, har bir bob (chapter) alohida audioga o'giriladi. Bu serverni qiynamaydi va o'qish/eshitish uchun juda qulay.
*   **Qidiruv tizimi (Search):** Kitob nomi, asl tili, tarjima qilingan tili, va yuklagan odam bo'yicha aqlli qidiruv.
*   **Reyting va Izohlar:** Foydalanuvchilar o'qigan kitoblariga 1 dan 5 gacha yulduzcha (Rating) qo'yishlari va izoh yozishlari mumkin.

---

## 3. Biznes Model va Foydalanuvchi Rollari
Loyiha 2 turdagi foydalanuvchi profiliga asoslangan:

### A) Freemium (Bepul, cheklangan foydalanuvchi)
*   Kitob yuklashi va tarjima qilishi mumkin.
*   **Audio format:** Freemium foydalanuvchi audioni eshita olmaydi (premium so'raladi).
*   **Library (Kutubxona):** Tarjima qilingan kitobi **avtomatik ravishda** barchaga ko'rinadigan ommaviy kutubxonaga tekinga qo'yiladi.
*   **Ruxsat:** Kutubxonadagi faqat *bepul* kitoblarni o'qiy oladi. Pullik kitoblarni o'qish uchun uni alohida sotib olishi kerak.

### B) Premium (Obunachi)
*   Kitob yuklaydi, tarjima qiladi va barcha boblarni **audio formatda** eshita oladi.
*   **Eksklyuzivlik:** Tarjima qilgan kitobini umumiy kutubxonaga qo'yish yoki o'zida saqlab qolish o'zining ixtiyorida (avtomatik ommaviy bo'lib ketmaydi).
*   **Barcha kitoblarga kirish:** Kutubxonadagi barcha kitoblarni ruxsatsiz va cheklovlarsiz o'qishi mumkin.
*   🔥 **Marketplace (Daromad ulushi):** Agar Premium foydalanuvchi kitobni umumiy kutubxonaga **pullik qilib** sotsa, boshqa Freemium foydalanuvchilar uni sotib olganida, *kitobni tarjima qilib yuklagan Premium foydalanuvchiga ma'lum foiz (ulush) tushadi.*

---

## 4. To'lov Tizimlari
*   **Integratsiyalar:** Click, Payme orqali pullik kitoblarni bittalab (Pay-per-item) sotib olish va obuna bo'lish imkoniyati.
*   **Invoice / Balans tizimi:** Ichki hamyon (Wallet) tizimi. Foydalanuvchi o'zi yuklagan kitobi sotilganida ichki hamyoniga pul yig'ilib boradi va kerak bo'lsa pulni yechib olish so'rovini yuborishi mumkin.

---

## 5. Huquqiy Va Xavfsizlik Masalalari (Copyright)
*   **Terms of Service (ToS):** Ro'yxatdan o'tish jarayonida *"Yuklangan va tarjima qilingan kitoblarning mualliflik huquqi bo'yicha to'liq javobgarlikni yuklovchi foydalanuvchi o'z bo'yniga oladi"* degan shartga majburiy tarzda rozi bo'lishi kerak.
*   **DMCA / Admin Takedown:** Admin panelda maxsus tugma bo'lib, haqiqiy muallifdan shikoyat kelgan taqdirda muammoli kitobni darhol platformadan o'chirib yuborish imkoniyati.

---

## 6. Texnologik Stack (Tech Stack)
Tez ishlashi, zamonaviy ko'rinishi va kengaytirish oson bo'lishi uchun:
*   **Frontend & Backend:** Next.js (App Router, TypeScript).
*   **Database & Auth & Storage:** Supabase (PostgreSQL, Realtime, oson va xavfsiz avtorizatsiya).
*   **Dizayn & UI:** TailwindCSS, Shadcn UI, Framer Motion (Premium, glassmorphism effektlar).
*   **Sun'iy Intellekt (AI):** OpenAI (ChatGPT) - tarjima, tilni aniqlash va Audio yaratish (TTS) uchun.
*   **Payment Gateways:** Payme / Click API (Kelajakda ulanadi, MVP da Mock-Invoice).
