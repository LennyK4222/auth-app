# Auth App - Forum Social Modern

O aplicație forum modernă construită cu Next.js 15, MongoDB și TypeScript, cu funcționalități avansate de autentificare și management de conținut.

## ✨ Funcționalități

- 🔐 **Autentificare completă** - Înregistrare, login, reset parolă
- 📝 **Forum interactiv** - Postări, comentarii, like-uri, vote-uri
- 🏷️ **Categorii dinamice** - Organizare conținut pe categorii
- 👤 **Profile utilizatori** - Avatar-uri, bio, statistici
- 🎨 **UI/UX modern** - Design responsiv cu animații Framer Motion
- ⚡ **Real-time updates** - Actualizări instant fără refresh
- 🛡️ **Securitate** - CSRF protection, rate limiting, validare

## 🚀 Deploy pe Vercel

### 1. Pregătire proiect

```bash
# Clonează repository-ul
git clone <your-repo-url>
cd auth-app

# Instalează dependențele
npm install

# Verifică build-ul local
npm run build
```

### 2. Configurare MongoDB Atlas

1. Creează un cont pe [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Creează un cluster nou
3. Configurează network access (0.0.0.0/0 pentru Vercel)
4. Creează un database user
5. Obține connection string-ul

### 3. Deploy pe Vercel

#### Opțiunea A: Vercel CLI
```bash
# Instalează Vercel CLI
npm i -g vercel

# Login în Vercel
vercel login

# Deploy
vercel --prod
```

#### Opțiunea B: Vercel Dashboard
1. Conectează repository-ul la [Vercel Dashboard](https://vercel.com)
2. Configurează variabilele de mediu
3. Deploy automat

### 4. Variabile de mediu necesare

În Vercel Dashboard > Settings > Environment Variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/auth_app?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
CSRF_SECRET=your-super-secret-csrf-key-at-least-32-characters-long
```

### 5. Configurare domeniu (opțional)

1. În Vercel Dashboard > Settings > Domains
2. Adaugă domeniul tău custom
3. Configurează DNS records

## 📦 Structura Proiectului

```
auth-app/
├── src/
│   ├── app/                 # App Router (Next.js 15)
│   │   ├── api/            # API routes
│   │   ├── (auth)/         # Grouped auth pages
│   │   └── category/       # Category pages
│   ├── components/         # React components
│   │   ├── ui/            # UI components reusabile
│   │   └── settings/      # Settings components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities și configurări
│   └── models/            # MongoDB models
├── public/                # Static assets
└── middleware.ts          # Next.js middleware
```

## 🛠️ Tehnologii Folosite

- **Framework**: Next.js 15 cu App Router
- **Database**: MongoDB Atlas cu Mongoose
- **Styling**: Tailwind CSS cu animații Framer Motion
- **Authentication**: JWT cu securitate CSRF
- **TypeScript**: Type safety complet
- **Deployment**: Vercel

## 🔧 Comenzi Disponibile

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint check
```

## 🌟 Funcționalități Avansate

- **Real-time updates**: Actualizări instantanee fără refresh
- **Responsive design**: Optimizat pentru toate device-urile
- **Dark mode**: Suport complet pentru tema întunecată
- **SEO optimized**: Meta tags și structured data
- **Performance**: Optimizări pentru Core Web Vitals

## 📄 Licență

MIT License - vezi fișierul LICENSE pentru detalii.
