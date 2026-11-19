# UY-JOY PRO

Uy-joy boshqaruv paneli: kompaniya kabinetlari, mijozlar, xonadonlar, shartnomalar, to‘lovlar, xodim ruxsatlari, moliya, hisobotlar va loyiha chizmalarini bitta mahalliy web ilovada boshqaradi.

## Ishga tushirish

1. Kompyuterda Node.js 20 yoki undan yangiroq versiya o‘rnatilgan bo‘lsin.
2. `start.bat` faylini ikki marta bosing yoki loyiha papkasida terminal ochib `npm start` buyrug‘ini kiriting.
3. Brauzerda [http://127.0.0.1:3000](http://127.0.0.1:3000) manzilini oching.

Qo‘shimcha paket o‘rnatish shart emas. Birinchi ishga tushganda `data/database.json` fayli yaratiladi. Shu fayl kompaniya ma’lumotlarini saqlaydi; zaxira nusxa olish uchun serverni to‘xtatib, faylni nusxalang.

## Dastlabki kirish

- Email: `admin@uyjoy.uz`
- Parol: `Admin123!`

Super administrator panelidagi **Kompaniyalar → Kompaniya qo‘shish** orqali firma va uning egasi uchun alohida kabinet yarating. Egasi hisobiga birinchi kirgandan keyin **Sozlamalar** sahifasida parolni almashtirish tavsiya etiladi.

## VS Code’da ochish

1. Visual Studio Code’ni oching.
2. **File → Open Folder…** ni bosing.
3. Loyihaning ochilgan papkasini tanlang.
4. Yuqoridagi **Terminal → New Terminal** menyusini oching.
5. `npm start` yozib Enter bosing.
6. Brauzerda `http://127.0.0.1:3000` manzilini oching.

## Loyiha chizish

**Loyiha chizish** bo‘limida yer bosh rejasi, bino, qavat yoki xonadon loyihasini tanlang. O‘lchamlar metrda kiritiladi; chizmadagi xona, devor, eshik, deraza, yo‘l, yashil hudud va avtoturargoh elementlarini sichqoncha bilan chizib yoki ko‘chiring. 2D/3D ko‘rinishini almashtiring va PNG eksport qiling. PDF tugmasi chizmani chop etish oynasiga tayyorlaydi; brauzerdan **Save as PDF** ni tanlang.

**Xonadon rejasi** uchun binoni tanlagach, saqlangan reja xonadon reyestriga avtomatik bog‘lanadi va o‘lcham hamda xonadon raqami keyin ham birga tahrirlanadi.

## Xavfsizlik va integratsiyalar

- Parollar scrypt yordamida xeshlanadi; brauzer sessiyasi `HttpOnly` va `SameSite=Strict` cookie bilan yuritiladi.
- Har bir firma yozuvida kompaniya identifikatori bor. Kirish, ma’lumot olish va yozish amallari shu identifikator bilan cheklanadi; xodim ko‘rinishi ruxsatlariga qarab filtrlanadi.
- Demo boshqaruv panelidagi to‘lov va grafik muharrir ma’lumotlari lokal serverda saqlanadi. SMS amali xabarni demo navbatiga qo‘shadi, haqiqiy SMS jo‘natmaydi; SMS provayderi ulanmagan.
- Loyihani internetga joylashtirishdan oldin production bazasi, HTTPS, parol siyosati va SMS provayder kalitlarini sozlash kerak. Hozirgi konfiguratsiya localhost’da ko‘rsatish va mahalliy foydalanish uchun.

## Tarkibi

- `server.js` — Node.js HTTP server, login, ruxsatlar, REST API va ma’lumotlar bazasi.
- `public/index.html` — web sahifa.
- `public/app.js` — kabinet ekranlari, forma va 2D/3D chizma muharriri.
- `public/app.css`, `public/detail.css` — premium dizayn va responsiv uslublar.
- `package.json`, `start.bat` — ishga tushirish sozlamalari.
- `data/database.json` — birinchi ishga tushishda hosil bo‘ladigan mahalliy ma’lumotlar fayli.
