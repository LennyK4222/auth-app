# Vercel Deployment Configuration

## Environment Variables Required:

### Database
- `MONGODB_URI`: Your MongoDB connection string
  - Example: `mongodb+srv://user:pass@cluster.mongodb.net/authapp`

### Authentication
- `JWT_SECRET`: Strong random string for JWT signing
- `CSRF_SECRET`: Random string for CSRF protection
- `NEXTAUTH_SECRET`: Random string for NextAuth

### Email (for password reset)
- `EMAIL_FROM`: Sender email address
- `EMAIL_HOST`: SMTP host (e.g., smtp.gmail.com)
- `EMAIL_PORT`: SMTP port (e.g., 587)
- `EMAIL_USER`: SMTP username
- `EMAIL_PASS`: SMTP password/app password

### Optional
- `ADMIN_EMAIL`: Default admin email
- `NEXTAUTH_URL`: Your domain (auto-set by Vercel)

## Deployment Steps:

1. Push code to GitHub
2. Connect Vercel to your GitHub repository
3. Add environment variables in Vercel dashboard
4. Deploy

## Post-Deployment:

1. Set up MongoDB database
2. Create admin user via API
3. Test authentication flows
4. Configure domain (optional)
