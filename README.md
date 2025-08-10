# Auth App

A comprehensive social platform built with Next.js 15, featuring user authentication, profiles, posts, likes, and administrative controls.

## Features

- 🔐 **Authentication**: JWT-based login/register with password reset
- 👥 **User Profiles**: Public/private profiles with avatars, bios, and stats  
- 📝 **Posts & Comments**: Create, like, and comment on posts
- ❤️ **Social Features**: Like system with animated interactions
- 🎨 **Modern UI**: Responsive design with Framer Motion animations
- 🛡️ **Security**: CSRF protection, rate limiting, and secure sessions
- ⚙️ **Settings**: Comprehensive user preferences and privacy controls
- 👑 **Admin Panel**: User management and system administration

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with secure cookies
- **UI**: Tailwind CSS + Framer Motion
- **TypeScript**: Full type safety
- **Deployment**: Vercel-ready

## Getting Started

1. **Clone the repository**
```bash
git clone https://github.com/LennyK4222/auth-app.git
cd auth-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
All environment variables are pre-configured in `.env.local` with secure secrets.
Optionally update MongoDB URI and email settings:
```bash
# .env.local already exists with all required variables
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Variables

All environment variables are pre-configured in `.env.local` including:
- MongoDB connection
- JWT secrets (pre-generated)
- Email configuration
- CSRF protection

## Deployment

### Vercel (Recommended)
1. **Connect repository** to [vercel.com](https://vercel.com)
2. **Add environment variables** (copy from `.env.local`):
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
   ```
3. **Deploy** - automatic builds on push

### MongoDB Setup
- **Atlas**: [mongodb.com/atlas](https://mongodb.com/atlas) → Free cluster
- **Allow all IPs**: `0.0.0.0/0` in Network Access
- **Copy connection string** to `MONGODB_URI`

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable React components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
└── models/             # MongoDB/Mongoose models
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
