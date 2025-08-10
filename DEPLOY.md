# 🚀 Ghid Deploy pe Vercel

## Pasul 1: Pregătește Repository-ul

1. **Asigură-te că codul este în Git:**
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

## Pasul 2: Configurează MongoDB Atlas

1. Mergi pe [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Creează un cont gratuit dacă nu ai deja
3. Creează un cluster nou (alege Free Tier)
4. În **Network Access**, adaugă `0.0.0.0/0` pentru a permite conexiuni de oriunde
5. În **Database Access**, creează un user cu parola
6. În **Clusters**, apasă **Connect** și copiază connection string-ul

## Pasul 3: Deploy pe Vercel

### Opțiunea A: Vercel Dashboard (Recomandat)

1. Mergi pe [vercel.com](https://vercel.com) și fă login cu GitHub
2. Apasă **"New Project"**
3. Importă repository-ul `auth-app`
4. În **Environment Variables**, adaugă:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/auth_app?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-for-security
   CSRF_SECRET=your-csrf-secret-key-minimum-32-characters-for-security
   ```
5. Apasă **Deploy**

### Opțiunea B: Vercel CLI

```bash
# Instalează Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Setează environment variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add CSRF_SECRET
```

## Pasul 4: Generează Secrete Sigure

Pentru `JWT_SECRET` și `CSRF_SECRET`, folosește:

```bash
# În terminal/PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Sau online pe [Password Generator](https://passwordsgenerator.net/) (minimum 32 caractere).

## Pasul 5: Testează Deployment-ul

1. Vercel îți va da un URL de genul: `https://auth-app-username.vercel.app`
2. Testează:
   - Înregistrare utilizator nou
   - Login/Logout
   - Crearea unei postări
   - Navigarea prin categorii

## Pasul 6: Configurare Domeniu Custom (Opțional)

1. În Vercel Dashboard > Settings > Domains
2. Adaugă domeniul tău (ex: `myawesome-forum.com`)
3. Configurează DNS records la provider-ul de domeniu
4. Actualizează `NEXTAUTH_URL` în Environment Variables

## 🔧 Debugging Deployment Issues

### Eroare: "Module not found"
- Verifică că toate dependențele sunt în `package.json`
- Rulează `npm install` local

### Eroare: "Database connection failed"
- Verifică `MONGODB_URI` în Environment Variables
- Asigură-te că Network Access permite `0.0.0.0/0`
- Verifică username/password în connection string

### Eroare: "JWT malformed"
- Verifică că `JWT_SECRET` și `CSRF_SECRET` sunt setate corect
- Re-deploy după setarea variabilelor

## 📊 Monitoring și Logs

1. În Vercel Dashboard > Functions
2. Vezi logs pentru debugging
3. Monitorizează performance și erori

## 🎉 Success!

Odată deployat cu succes:
- ✅ Aplicația ta rulează pe Vercel
- ✅ MongoDB Atlas store-ază datele
- ✅ Utilizatorii se pot înregistra și loga
- ✅ Forum-ul funcționează complet

**URL-ul aplicației tale:** `https://auth-app-[username].vercel.app`

---

**Need help?** Verifică [Vercel Docs](https://vercel.com/docs) sau [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/).
