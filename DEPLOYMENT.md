# Deployment Guide

## Local Development

1. **Copy environment file:**
```bash
cp .env.local.example .env.local
```

2. **Update `.env.local` with your values:**
- Set your MongoDB URI (local or Atlas)
- Configure email settings for password reset
- Secrets are pre-generated and secure

3. **Start development:**
```bash
npm run dev
```

## Production Deployment (Vercel)

### Step 1: Environment Variables
In Vercel Dashboard → **Settings** → **Environment Variables**, copy ALL values from your `.env.local`:

```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/authapp
JWT_SECRET=your_jwt_secret_from_env_local
CSRF_SECRET=your_csrf_secret_from_env_local
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret_from_env_local
EMAIL_FROM=noreply@yourdomain.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
ADMIN_EMAIL=admin@yourdomain.com
```

### Step 2: MongoDB Setup
1. **MongoDB Atlas**: [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create **free cluster**
3. **Database Access** → Create user
4. **Network Access** → Allow all IPs (`0.0.0.0/0`)
5. **Connect** → Copy connection string to `MONGODB_URI`

### Step 3: Email Setup (Optional)
For Gmail App Password:
1. Enable 2FA on Gmail
2. Generate App Password
3. Use App Password in `EMAIL_PASS`

### Step 4: Deploy
1. Push code to GitHub
2. Connect Vercel to repository
3. Add environment variables
4. Deploy!
