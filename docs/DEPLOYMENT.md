# AngRaksha — Cloud & Web Deployment Guide

**Project:** AngRaksha (Team Astra)  
**Event:** NIRMAAN 2026 | **Track:** Smart Mobility & Aerospace  

---

## 1. Local Development Quickstart

```bash
# 1. Navigate to the web application directory
cd ASTRA/web

# 2. Install dependencies (if not already installed)
npm install

# 3. Start the Next.js local development server
npm run dev

# 4. Open in your browser:
# http://localhost:3000/dashboard   -> Live Guardian Dashboard
# http://localhost:3000/simulator   -> Interactive Demo Console
# http://localhost:3000/live-location -> Live GPS Map
```

---

## 2. Deploying to Vercel (Production Cloud Hub)

1. Push your repository to GitHub / GitLab.
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select your repository and configure **Root Directory** as `web`.
4. Add environment variables (if integrating Supabase):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. Your live cloud dashboard will be accessible worldwide!
