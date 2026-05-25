# Linguabook Pro - Deployment Guide

## GitHub Setup

1. Initialize git repository (if not already done):
```bash
git init
git add .
git commit -m "Initial commit: Linguabook Pro"
```

2. Create a new repository on GitHub
3. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/linguabook-pro.git
git branch -M main
git push -u origin main
```

## Netlify Deployment

### Prerequisites
- GitHub account with the repository
- Netlify account

### Steps

1. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "Connect to Git"
   - Select GitHub and authenticate
   - Choose your `linguabook-pro` repository

2. **Configure Build Settings**:
   - Base directory: `client`
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Next.js plugin: `@netlify/plugin-nextjs`

3. **Set Environment Variables** in Netlify dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `NEXT_PUBLIC_APP_URL`: Your production URL (e.g., `https://your-domain.netlify.app`)
   - `NEXT_PUBLIC_ADMIN_EMAIL`: Your admin account email for automatic admin access

4. **Deploy**:
   - Click "Deploy site"
   - Netlify will automatically build and deploy on every push to `main`

## Local Development

```bash
cd client
cp .env.local.example .env.local
# Update .env.local with your actual credentials
npm install
npm run dev
```

The app will be available at `http://localhost:3000`

## Notes
- Never commit `.env.local` file
- Use `.env.local.example` as a template for environment variables
- The `.gitignore` file ensures sensitive files are not pushed to GitHub
- Netlify will install dependencies and build the project automatically
