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
Copy `.env.example` to `.env.local` and configure:
```bash
cp .env.example .env.local
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Variables

See `.env.example` for required environment variables including:
- MongoDB connection
- JWT secrets
- Email configuration
- CSRF protection

## Deployment

See `DEPLOYMENT.md` for detailed Vercel deployment instructions.

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
