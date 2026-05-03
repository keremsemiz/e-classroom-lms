# E-Classroom LMS - Vercel Deployment Guide

This guide will walk you through deploying the E-Classroom LMS to Vercel with Turso database.

## Why Vercel + Turso?

- **Vercel**: Free tier with generous limits, perfect for Next.js apps
- **Turso**: Free SQLite-compatible database that works on serverless platforms

---

## Step 1: Create a Turso Database (FREE)

1. Go to [turso.tech](https://turso.tech) and sign up (use GitHub for easy login)
2. Create a new database:
   - Click "Create Database"
   - Name it: `e-classroom`
   - Select closest region
3. Get your credentials:
   - Go to your database → Settings
   - Copy the **Database URL** (looks like: `libsql://e-classroom-xxx.turso.io`)
4. Create an auth token:
   - Go to Settings → Tokens
   - Create a new token
   - Copy the token (you'll only see it once!)

---

## Step 2: Push Code to GitHub

1. Create a new repository on GitHub:
   - Go to github.com → New Repository
   - Name it: `e-classroom-lms`
   - Make it Private or Public
   - Don't initialize with README (we have code)

2. Push your code:
```bash
cd /home/z/my-project
git init
git add .
git commit -m "Initial commit - E-Classroom LMS"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/e-classroom-lms.git
git push -u origin main
```

---

## Step 3: Connect Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Import your project:
   - Click "Add New..." → "Project"
   - Select `e-classroom-lms` repository
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: ./

3. Configure Environment Variables:
   Click "Environment Variables" and add:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | `libsql://your-database.turso.io` |
   | `DATABASE_AUTH_TOKEN` | `your-turso-auth-token` |
   | `JWT_SECRET` | `generate-a-random-32-char-string` |
   | `NEXTAUTH_SECRET` | `generate-another-random-32-char-string` |
   | `NEXTAUTH_URL` | `https://e-classroom.smzedu.com` |

4. Click "Deploy"
5. Wait 2-3 minutes for deployment to complete

---

## Step 4: Seed the Database

After first deployment, seed your Turso database:

1. Go to Turso Dashboard → your database → "Run SQL"
2. Or use the Turso CLI locally:

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Connect to your database
turso db shell e-classroom

# Run the seed SQL (we'll generate this)
```

Alternatively, use the Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Run seed script
vercel env pull .env.local
npm run db:seed
```

---

## Step 5: Connect Custom Domain (Cloudflare)

### Option A: Use Vercel Nameservers (Recommended)

1. In Vercel Dashboard:
   - Go to your project → Settings → Domains
   - Add domain: `e-classroom.smzedu.com`
   - Vercel will show you the CNAME record

2. In Cloudflare:
   - Go to DNS Settings for `smzedu.com`
   - Add CNAME record:
     - Name: `e-classroom`
     - Target: `cname.vercel-dns.com`
     - Proxy status: **DNS Only** (gray cloud, not orange)

3. Wait 5-10 minutes for DNS propagation

### Option B: Keep Cloudflare Proxy

If you want to keep Cloudflare's proxy:

1. In Cloudflare, go to SSL/TLS → Overview
   - Set encryption mode to "Full (strict)"

2. Add CNAME record:
   - Name: `e-classroom`
   - Target: `cname.vercel-dns.com`
   - Proxy status: **Proxied** (orange cloud)

3. In Vercel, add domain and verify

---

## Step 6: Test Your Deployment

1. Visit `https://e-classroom.smzedu.com`
2. Login with:
   - Email: `admin@smzedu.com`
   - Password: `password123`

---

## Troubleshooting

### Database Connection Errors
- Check `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in Vercel environment variables
- Make sure Turso database is not paused (free tier pauses after inactivity)

### Build Errors
- Check Vercel build logs
- Make sure all dependencies are in `package.json`

### Domain Not Working
- Check Cloudflare DNS settings
- Make sure SSL is set to "Full (strict)" in Cloudflare

---

## Environment Variables Reference

| Variable | Where to Get |
|----------|--------------|
| `DATABASE_URL` | Turso Dashboard → Database Settings |
| `DATABASE_AUTH_TOKEN` | Turso Dashboard → Tokens |
| `JWT_SECRET` | Generate random 32-char string |
| `NEXTAUTH_SECRET` | Generate random 32-char string |
| `NEXTAUTH_URL` | Your domain (https://e-classroom.smzedu.com) |

Generate secrets with:
```bash
openssl rand -base64 32
```

---

## Costs (FREE Tier)

| Service | Free Limits |
|---------|-------------|
| Vercel | 100GB bandwidth, 100 builds/day |
| Turso | 9GB storage, 1B rows read/month |

This is more than enough for a school LMS!
