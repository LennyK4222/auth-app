# Auth App - Forum Social Modern

Aplicație de tip forum social construită cu Next.js 15, MongoDB și TypeScript. Include autentificare JWT, sesiuni persistente, management de conținut (postări/comentarii), categorii și panou admin.

## ✅ Ce actualizează acest README

- Structura reală a proiectului din `src/`
- Lista actuală de endpoint-uri API și ce fac ele
- Variabile de mediu folosite efectiv în cod
- Rezumatul modelelor de date și al mecanismelor de securitate
- Scripturile NPM și pași de rulare/deploy

## ✨ Funcționalități

- 🔐 Autentificare JWT: înregistrare, login, logout, reset parolă, schimbare email/parolă
- � Profil public și setări cont: avatar/cover, bio, preferințe, sesiuni active
- 📝 Forum: postări, comentarii, like-uri și voturi, sortare „hot”/„new”
- 🏷️ Categorii: listare, filtrare, management din admin
- � Real‑time comments: stream prin Server‑Sent Events (SSE)
- 🧭 Sesiuni persistente în DB cu device/IP și (opțional) geo‑locație
- 🛡️ Securitate: CSRF double‑submit cookie, CSP strict, rate limit pe login
- 🧩 Gamification: XP/level la login zilnic și creare postări
- �️ Panou Admin: utilizatori, categorii, analytics, seed/migrate/cleanup

## 🧱 Structura proiectului (rezumat)

```
auth-app/
├─ middleware.ts                  # CSP, cookie CSRF, blocare acces /uploads
├─ public/                        # Static assets
│  └─ uploads/                    # Public demos (imaginile reale vin via API)
├─ private/uploads/               # Stocare imagini (servite via API, nu direct)
└─ src/
	 ├─ app/
	 │  ├─ (auth)/{login,register,forgot,reset}/
	 │  ├─ admin/                   # UI admin + pagini
	 │  ├─ api/                     # Route handlers (Next.js)
	 │  │  ├─ auth/                 # login/logout/register/me/reset/migrate
	 │  │  ├─ user/                 # profil, sesiuni, upload imagine, email, etc.
	 │  │  ├─ posts/                # listare/creare, detalii, comentarii, like/vote
	 │  │  ├─ categories/           # listare
	 │  │  ├─ admin/                # users, categories, analytics, seed/migrate
	 │  │  ├─ csrf/                 # obținere token CSRF
	 │  │  └─ debug/                # endpoint-uri de test
	 │  ├─ category/[slug]/         # listă postări per categorie
	 │  ├─ profile/[userId]/        # profil public
	 │  └─ thread/[id]/             # pagină discuție
	 ├─ components/                 # UI & feature components (Feed, Comments, etc.)
	 ├─ contexts/                   # ex. CsrfContext
	 ├─ hooks/                      # useAuth, useProfile, useHeartbeat, etc.
	 ├─ lib/                        # auth/jwt, csrf, db, sessions, email, utils
	 └─ models/                     # User, Session, Post, Comment, Category
```

## 🔌 API – rute și funcții principale

Observație: metodele unsafe (POST/PATCH/PUT/DELETE) verifică CSRF prin antet `x-csrf-token` = valoarea cookie‑ului `csrf` (double‑submit). În dezvoltare, unele rute sar verificarea dacă lipsesc ambele token-uri.

- Auth
	- POST `/api/auth/register` – creează cont
	- POST `/api/auth/login` – autentifică, setează cookie `token` (JWT)
	- POST `/api/auth/logout` – invalidează cookie `token`
	- GET  `/api/auth/me` – detalii user autentificat
	- POST `/api/auth/password/reset-request` – inițiază resetare parolă
	- POST `/api/auth/password/reset` – finalizează resetarea
	- POST `/api/auth/migrate-session` – utilitar de migrare sesiune

- User
	- GET  `/api/user/profile` – citește profil (email, name)
	- PATCH `/api/user/profile` – actualizează profilul (ex: name) și reîmprospătează `token`
	- PATCH `/api/user/update` – actualizează câmpuri simple (ex: name)
	- POST `/api/user/change-password` – schimbă parola
	- POST `/api/user/email/change-request` – inițiază schimbarea emailului
	- GET  `/api/user/email/confirm` – confirmă schimbarea emailului
	- GET  `/api/user/recent` – utilizatori recenți
	- GET  `/api/user/sessions` – listează sesiunile active
	- DELETE `/api/user/sessions/[sessionId]` – închide o sesiune
	- DELETE `/api/user/sessions/all` – închide toate sesiunile (în afara curentei)
	- POST `/api/user/sessions/[sessionId]` – doar override formular (`_method=DELETE`)
	- POST `/api/user/upload-image` – încărcare avatar/cover
	- GET  `/api/user/image/[filename]` – servește imaginea încărcată (cu control acces)
	- POST `/api/user/heartbeat` – ping activitate
	- POST `/api/user/delete` – ștergere cont

- Posts
	- GET  `/api/posts` – listare cu paginare, sort `hot|new`, filtrare `category`
	- POST `/api/posts` – creează postare (acordă XP și actualizează categoria)
	- GET  `/api/posts/[id]` – detalii postare
	- DELETE `/api/posts/[id]` – șterge postarea proprie
	- POST `/api/posts/[id]/comment` – adaugă comentariu (și notifică streamul)
	- DELETE `/api/posts/[id]/comment/[commentId]` – șterge comentariu propriu
	- POST `/api/posts/[id]/comment/[commentId]` – override formular pentru DELETE
	- POST `/api/posts/[id]/like` – like
	- POST `/api/posts/[id]/vote` – vote (+1/‑1)
	- GET  `/api/posts/[id]/comments/stream` – SSE pentru comentarii în timp real

- Categorii
	- GET  `/api/categories` – listă categorii publice

- Admin
	- GET  `/api/admin/users` – listă utilizatori
	- POST `/api/admin/users` – creează utilizator
	- PATCH `/api/admin/users/bulk` – operații bulk
	- GET  `/api/admin/users/[userId]` – detalii
	- PATCH `/api/admin/users/[userId]` – actualizare
	- PATCH `/api/admin/users/[userId]/role` – schimbă rolul
	- PATCH `/api/admin/users/[userId]/status` – activ/inactiv
	- DELETE `/api/admin/users/[userId]` – șterge utilizator
	- GET  `/api/admin/categories` – listă categorii (admin)
	- POST `/api/admin/categories` – creează categorie
	- PUT  `/api/admin/categories/[id]` – actualizează categorie
	- DELETE `/api/admin/categories/[id]` – șterge categorie
	- GET  `/api/admin/analytics` – statistici sistem
	- GET  `/api/admin/user-analytics` – statistici utilizatori
	- POST `/api/admin/seed/categories` – seed categorii
	- POST `/api/admin/migrate-usernames` – migrare nume utilizator
	- POST `/api/admin/migrate-posts` – migrare postări
	- POST `/api/admin/cleanup-sessions` – curăță sesiuni (token necesar)
	- GET  `/api/admin/cleanup-sessions` – status cleanup (dev)

- Diverse
	- GET  `/api/csrf` – returnează token CSRF (și setează cookie dacă e cazul)
	- GET  `/api/debug/categories|posts` – endpoint-uri de test

## 🔐 Securitate și sesiuni

- CSRF: implementare double‑submit cookie `csrf` + antet `x-csrf-token`; în dev, unele rute pot sări verificarea când lipsesc ambele token‑uri.
- Auth: cookie `token` (JWT HS256) cu issuer/audience configurabile; validare token + (opțional) validare existență sesiune în DB.
- Sesiuni: persistate în colecția `Session` cu device/IP/UA și (opțional) locație pe IP; endpoint‑uri pentru listare/terminare.
- Middleware: setează CSP strict (cu nonce pentru scripturi), blochează accesul direct la `/uploads/*`, emite cookie CSRF dacă lipsește.
- Rate limiting: pe login (și alte puncte sensibile după caz).

## 🧬 Modele de date (pe scurt)

- User: email, passwordHash, name/username, role, verified/active, avatar/cover, bio, privacy, notificări, preferințe colectare date, XP/level, timestamps.
- Session: userId, token, deviceInfo { UA, IP, browser, os, device }, location { city, country, coord }, lastActivity, expiresAt, isActive.
- Post: authorId/email/name, title, body, category (slug), score, votes, commentsCount, timestamps.
- Comment: postId, authorId/email/name, body, timestamps.
- Category: name, slug, description, color, icon, isActive, postCount, timestamps.

## ⚙️ Variabile de mediu

Obligatorii:

```
MONGODB_URI=...                     # conexiune MongoDB
JWT_SECRET=your-32+chars-secret     # cheie HS256 pt. JWT
```

Recomandate/Opționale:

```
# JWT meta
JWT_ISSUER=auth-app
JWT_AUDIENCE=auth-app-user

# Mongo tuning
MONGODB_DB_NAME=next-auth-app
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=0
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
MONGODB_SOCKET_TIMEOUT_MS=45000

# reCAPTCHA (dacă vrei captcha la login)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
RECAPTCHA_SECRET_KEY=...

# Geolocație IP pentru sesiuni (folosește ipinfo dacă există token, altfel ipapi.co)
IPINFO_TOKEN=...

# Criptare fișiere (ex: avatars) – folosit în utilitare
FILE_ENCRYPTION_KEY=your-32-chars-secret

# Servirea imaginilor
IMAGE_PUBLIC_AVATARS=true           # avatars publice
IMAGE_BYPASS_AUTH=false             # bypass auth doar în dev dacă TRUE
IMAGE_CACHE_SECONDS=3600

# Task-uri protejate
CLEANUP_TOKEN=your-admin-token
```

Note:
- Nu se folosește `CSRF_SECRET` – CSRF este double‑submit cu token random din middleware.
- În producție, cookie‑urile se setează `secure=true` automat dacă nu rulezi pe localhost.

## 🧪 Comenzi disponibile

```bash
npm run dev      # server dev (Turbopack)
npm run build    # build producție
npm run start    # start server producție
npm run lint     # ESLint
```

## ▶️ Rulare locală rapidă

1) Creează `.env.local` cu variabilele necesare (minim `MONGODB_URI` și `JWT_SECRET`).
2) Instalează dependențele și pornește serverul:

```bash
npm install
npm run dev
```

## 🚀 Deploy pe Vercel (rezumat)

1) Conectează repo în Vercel și setează variabilele de mediu (vezi secțiunea de mai sus).
2) Deploy automat din dashboard sau din CLI:

```bash
npm i -g vercel
vercel --prod
```

## � Licență

MIT License – vezi `LICENSE`.
