# Birinchi 1000 ta obunachi uchun xarajatlar hisob-kitobi (Taxminiy)

Bu hisob-kitob tizim to'liq ishga tushib, 1000 nafar **aktiv** (har oy kitob o'qiydigan/tarjima qiladigan) foydalanuvchisi bor deb faraz qilingan holat uchun tuzilgan.

## Asosiy o'zgaruvchilar (Taxmin)
*   **Aktiv foydalanuvchilar:** 1000 nafar (Masalan: 800 ta Freemium, 200 ta Premium).
*   **Kitob hajmi:** O'rtacha 300 sahifa (tahminan 500,000 belgi / 150,000 token).
*   **Oylik faollik:** 1000 kishi oyiga 1 tadan yangi kitob tarjima qiladi yoki audiosini eshitadi.

---

## 1. Doimiy oylik xarajatlar (Infrastruktura)

| Xizmat / Server | Tavsifi | Taxminiy narx (Oyiga) |
| :--- | :--- | :--- |
| **Vercel Pro (Next.js)** | Veb saytning uzluksiz, qotmasdan va tez ishlashi uchun. | **$20** |
| **Supabase Pro** | Foydalanuvchilar bazasi, kitoblar (PDF/EPUB) va mp3 fayllarni saqlash (Storage). 1000 user uchun bitta Pro plan yetadi. | **$25 - $45** |
| **Domen (.com yoki .uz)** | Yillik narxi o'rtacha $15-$20, oyiga bo'lganda. | **~$1.5** |
| **Jami doimiy** | Platformani "tirik" ushlab turish uchun | **~$50 / oy** |

---

## 2. API Xarajatlari (Har bir qilingan ish uchun to'lanadi)

OpenAI API narxlari sarflangan so'zlarga (token/belgi) qarab belgilanadi. 

### A) Tarjima Xarajatlari (GPT-4o-mini moduli)
GPT-4o-mini hozirda ham arzon, ham juda kuchli tarjima qila oladi.
*   1 ta kitobni to'liq tarjima qilish o'rtacha **$0.10 - $0.15** (10-15 sent) aylanadi.
*   Agar oyiga 1000 ta MUTLAQO YANGI kitob tarjima qilinsa: `1000 x $0.15` = **$150 / oy**.
*   *Eslatma: Agar bitta kitob bir marta tarjima qilinsa va u Admin tomonidan "Library"ga qo'shilsa, keyingi minglab odamlar uchun u tayyor holda ochiladi va **umuman tarjima puli (API xarajati) ketmaydi.** Bu juda katta yutug'ingiz bo'ladi.*

### B) Audio / Text-to-Speech (Eng katta xarajat)
OpenAI TTS narxi 1 million belgi uchun $15. 
*   1 ta kitob (500,000 belgi) to'liq audiosini API orqali generatsiya qilish = o'rtacha **$7.5** tushadi.
*   Agar 200 ta Premium user + audio sotib olgan Freemiumlar jami 300 ta to'liq kitobni audyoga o'girsa: `300 x $7.5` = **$2,250 / oy**.

**🔥 Audioni tejang (Tejamkor arxitektura):**
Shu sababli, audioni saqlab qolish tizimi (Caching) qilinadi. Birov 1-bobni eshitsa, API ishlaydi (pul ketadi) va mp3 audioni **Supabase Storage**'ga saqlab qo'yadi. Keyingi yuz ming odam shu bobni eshitsa, shunchaki tekinga saqlangan audioni tinglaydi! Natijada audio xarajati ham keskin tushib, maksimal **$300-$500** oralig'ida bo'lishi mumkin.

---

## XULOSA (1000 obunachi uchun umumiy hisob)

1.  **Infrastruktura (Server, Baza):** ~$50
2.  **Kitoblarni AI orqali tarjima qilish:** ~$150
3.  **AI Audio generatsiyasi (Aqlli tejash bilan):** ~$400

**Oylik taxminiy xarajat:** **~$600** ($400 - $800 atrofida o'zgarishi mumkin).

### Foyda qismiga nazar (Mantiqiy hisob-kitob):
Agar 200 nafar Premium obunachi oyiga $10 dan obuna to'lasa = **$2,000**.
Qolgan 800 ta Freemium user o'rtacha $2 lik 1 tadan kitob/audio sotib olsa = **$1,600**.
Oylik aylanma tushum = **$3,600**.
Xarajatlarni ayirsak, **sof foyda va Premium foydalanuvchilar bilan bo'lishish (cashback)** uchun anchagina yetarli daromad qoladi.
