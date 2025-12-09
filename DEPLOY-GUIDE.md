# ConsensusAI - Deployment Guide

## Quick Deploy Checklist

### 1. Stripe (✅ DONE)
Your Stripe is configured with:
- Product: ConsensusAI Pro
- Monthly: $19/month (`price_1ScC8bCX1ThI6E9rfLB6d4nF`)
- Yearly: $190/year (`price_1ScC8bCX1ThI6E9rMgf1oZ4j`)

**After deploying to Railway, create webhook:**
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://consensusai.live/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy webhook secret to Railway environment variables as `STRIPE_WEBHOOK_SECRET`

---

### 2. Sentry (Error Monitoring)

**Setup (5 minutes):**
1. Go to https://sentry.io/signup/
2. Create a Node.js project
3. Copy the DSN
4. Add to `.env`: `SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx`

---

### 3. PostHog (Analytics) - Optional

**Setup (5 minutes):**
1. Go to https://app.posthog.com/signup
2. Create project
3. Copy API key
4. Add to `.env`: `POSTHOG_API_KEY=phc_xxx`

---

### 4. Railway Deployment (Recommended for SSE Streaming)

Railway supports persistent connections required for SSE streaming.

**Step 1: Create GitHub Repository**
```bash
# Create new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/consensus-platform.git
git push -u origin main
```

**Step 2: Deploy to Railway**
1. Go to https://railway.app/ and sign up/login with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `consensus-platform` repository
4. Railway will auto-detect Node.js and deploy

**Step 3: Add Environment Variables**
In Railway dashboard → Your project → Variables:
```
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
XAI_API_KEY=xai-...
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_ID_MONTHLY=price_1ScC8bCX1ThI6E9rfLB6d4nF
STRIPE_PRICE_ID_YEARLY=price_1ScC8bCX1ThI6E9rMgf1oZ4j
STRIPE_WEBHOOK_SECRET=whsec_...
SENTRY_DSN=https://a36583375e761bd73e59fc208eb0e5cd@o4510505498705920.ingest.us.sentry.io/4510505505652736
POSTHOG_API_KEY=phc_...
NODE_ENV=production
APP_URL=https://consensusai.live
```

**Step 4: Connect Custom Domain**
1. In Railway → Your project → Settings → Domains
2. Click "Custom Domain" → Enter: `consensusai.live`
3. Railway will provide DNS records (CNAME)
4. In Namecheap DNS settings, add:
   - Type: CNAME
   - Host: `@` (or leave blank for root)
   - Value: `[your-app].up.railway.app`
   - TTL: Automatic
5. For www subdomain, add another CNAME pointing to same value

**Step 5: Verify Deployment**
```bash
# Test API endpoint
curl https://consensusai.live/api/config

# Test SSE streaming
curl -N https://consensusai.live/api/debate/stream?id=test123
```

---

### Alternative: Vercel Deployment (No SSE Streaming)

⚠️ **Note:** Vercel serverless functions don't support SSE streaming. Use Railway for full functionality.

**Environment Variables to Add in Vercel:**
```
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
XAI_API_KEY=xai-...
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
STRIPE_SECRET_KEY=sk_live_... (use live key for production!)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENTRY_DSN=https://...
POSTHOG_API_KEY=phc_...
NODE_ENV=production
APP_URL=https://your-domain.vercel.app
```

---

### 5. UptimeRobot (Free Monitoring)

**Setup (2 minutes):**
1. Go to https://uptimerobot.com/
2. Create free account
3. Add HTTP(s) monitor: `https://your-domain.vercel.app`
4. Set alert contacts (email)
5. Done!

---

### 6. Custom Domain (Optional)

1. Buy domain (Namecheap, Google Domains, etc.)
2. In Vercel: Project Settings → Domains → Add
3. Add DNS records as instructed
4. Update `APP_URL` in Vercel env vars

---

### 7. Go Live Checklist

- [ ] Railway deployment successful
- [ ] consensusai.live domain connected
- [ ] All AI API keys added (OpenAI, Anthropic, Google, xAI)
- [ ] Stripe webhook created and secret added
- [ ] Sentry DSN added
- [ ] All API keys are LIVE (not test) keys
- [ ] APP_URL set to https://consensusai.live
- [ ] Test SSE streaming works (live debate updates)
- [ ] Test a payment flow end-to-end
- [ ] Test a debate works
- [ ] Share link works
- [ ] Mobile view looks good

---

## Marketing Agent Setup

**For automated Twitter posting:**

1. Get Twitter API keys from https://developer.twitter.com/
2. Add to `.env`:
   ```
   TWITTER_API_KEY=xxx
   TWITTER_API_SECRET=xxx
   TWITTER_ACCESS_TOKEN=xxx
   TWITTER_ACCESS_SECRET=xxx
   ```
3. Install twitter library: `npm install twitter-api-v2`
4. Test: `node agents/marketing-agent.js preview`
5. Schedule with cron: `0 9 * * * node /path/to/agents/marketing-agent.js generate`

---

## Running Tests

```bash
# Start server
node server.js &

# Run tests
npm test

# Stop server
pkill -f "node server.js"
```

---

## CI/CD Pipeline

GitHub Actions workflow is set up in `.github/workflows/ci.yml`

Railway auto-deploys from main branch - no additional secrets needed!

---

## Quick Commands

```bash
# Local development
npm run dev

# Run tests
npm test

# Setup Stripe products
npm run setup-stripe

# Preview marketing tweets
node agents/marketing-agent.js preview

# Railway CLI (optional)
npm i -g @railway/cli
railway login
railway up
```

---

## Development Workflow

```
LOCAL DEV  →  Feature Branch  →  PR to Main  →  Auto Deploy
    ↓             ↓                   ↓              ↓
npm run dev    git push        Code Review     Railway
localhost:3000  origin/feat   GitHub Actions  consensusai.live
```

1. **Local Development**: `npm run dev` → http://localhost:3000
2. **Feature Branch**: `git checkout -b feat/new-feature`
3. **Push & PR**: `git push origin feat/new-feature` → Create PR
4. **Auto Deploy**: Merge to main → Railway auto-deploys

---

*Last updated: December 9, 2025*
