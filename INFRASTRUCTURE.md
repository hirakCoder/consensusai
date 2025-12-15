# ConsensusAI Infrastructure Documentation

*Last Updated: December 15, 2025*

## Overview

ConsensusAI is a micro-SaaS platform deployed on Railway with automatic deployments from GitHub.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   GitHub (main branch)                                               │
│         │                                                            │
│         ▼ (auto-deploy on push)                                      │
│   ┌─────────────┐                                                    │
│   │   Railway   │ ◄── Production Host                                │
│   │  (Node.js)  │     consensusai.live                               │
│   └──────┬──────┘                                                    │
│          │                                                           │
│          ▼                                                           │
│   ┌──────────────────────────────────────────────────────────┐      │
│   │                    EXTERNAL SERVICES                      │      │
│   ├──────────────┬──────────────┬─────────────┬─────────────┤      │
│   │    Clerk     │    Stripe    │   Sentry    │   PostHog   │      │
│   │    (Auth)    │  (Payments)  │  (Errors)   │ (Analytics) │      │
│   └──────────────┴──────────────┴─────────────┴─────────────┘      │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────┐      │
│   │                      AI PROVIDERS                         │      │
│   ├─────────────┬─────────────┬─────────────┬───────────────┤      │
│   │   OpenAI    │  Anthropic  │   Google    │     xAI       │      │
│   │   (GPT-4)   │  (Claude)   │  (Gemini)   │    (Grok)     │      │
│   └─────────────┴─────────────┴─────────────┴───────────────┘      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Deployment Platform

### Primary: Railway (Production)

| Setting | Value |
|---------|-------|
| **Platform** | Railway |
| **URL** | https://consensusai.live |
| **Runtime** | Node.js (Nixpacks) |
| **Start Command** | `node server.js` |
| **Health Check** | `/api/config` |
| **Auto-Deploy** | Yes, on push to `main` branch |

**Why Railway?**
- Supports Server-Sent Events (SSE) for real-time streaming
- Persistent connections (not serverless)
- Simple GitHub integration
- Reasonable pricing

### Secondary: Vercel (NOT USED for Production)

> **Warning:** Vercel serverless functions do NOT support SSE streaming. The `vercel.json` file exists for legacy/testing purposes only. Do not deploy production to Vercel.

---

## Deployment Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Local     │     │    GitHub    │     │   Railway    │     │  Production  │
│ Development  │ ──► │  (main)      │ ──► │  Auto-Build  │ ──► │    Live      │
│              │     │              │     │              │     │              │
│ localhost    │     │ git push     │     │ ~2-3 min     │     │ consensusai  │
│ :3000        │     │              │     │              │     │ .live        │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### How to Deploy

**Automatic (Recommended):**
1. Commit changes to `main` branch
2. Push to GitHub: `git push origin main`
3. Railway automatically detects and deploys (~2-3 minutes)
4. Check status at https://railway.app/dashboard

**Manual (Emergency):**
```bash
# Login to Railway CLI (one-time)
railway login

# Deploy manually
railway up
```

### Rollback

```bash
# In Railway dashboard:
# 1. Go to Deployments
# 2. Click on previous successful deployment
# 3. Click "Redeploy"

# Or via CLI:
railway rollback
```

---

## Environment Variables

All secrets are stored in Railway dashboard (not in code).

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `OPENAI_API_KEY` | GPT-4 API access | platform.openai.com |
| `ANTHROPIC_API_KEY` | Claude API access | console.anthropic.com |
| `GOOGLE_AI_API_KEY` | Gemini API access | aistudio.google.com |
| `XAI_API_KEY` | Grok API access | x.ai |
| `CLERK_PUBLISHABLE_KEY` | Auth frontend key | dashboard.clerk.com |
| `CLERK_SECRET_KEY` | Auth backend key | dashboard.clerk.com |
| `STRIPE_SECRET_KEY` | Payment processing | dashboard.stripe.com |
| `STRIPE_PUBLISHABLE_KEY` | Payment frontend | dashboard.stripe.com |
| `STRIPE_PRICE_ID_MONTHLY` | $19/month plan | Stripe Products |
| `STRIPE_PRICE_ID_YEARLY` | $190/year plan | Stripe Products |
| `STRIPE_WEBHOOK_SECRET` | Webhook verification | Stripe Webhooks |
| `NODE_ENV` | `production` | Set manually |
| `APP_URL` | `https://consensusai.live` | Set manually |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Error tracking |
| `POSTHOG_API_KEY` | Analytics |

---

## Domain Configuration

| Domain | Points To | Purpose |
|--------|-----------|---------|
| `consensusai.live` | Railway app | Production |
| `www.consensusai.live` | Railway app | WWW redirect |

### DNS Records (Namecheap)

```
Type    Host    Value                           TTL
CNAME   @       [app-name].up.railway.app       Auto
CNAME   www     [app-name].up.railway.app       Auto
```

---

## External Services

### 1. Clerk (Authentication)
- **Dashboard:** https://dashboard.clerk.com
- **Purpose:** User signup, login, session management
- **Integration:** Frontend SDK + Backend verification

### 2. Stripe (Payments)
- **Dashboard:** https://dashboard.stripe.com
- **Purpose:** Subscription billing ($19/month, $190/year)
- **Webhook URL:** `https://consensusai.live/api/stripe/webhook`
- **Webhook Events:**
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

### 3. Sentry (Error Monitoring)
- **Dashboard:** https://sentry.io
- **Purpose:** Track production errors, performance issues
- **Integration:** `@sentry/node` package

### 4. PostHog (Analytics)
- **Dashboard:** https://app.posthog.com
- **Purpose:** User analytics, feature usage tracking
- **Integration:** `posthog-node` package

---

## AI Providers

| Provider | Model | Endpoint | Rate Limits |
|----------|-------|----------|-------------|
| OpenAI | GPT-4o | api.openai.com | Tier-based |
| Anthropic | Claude 3.5 Sonnet | api.anthropic.com | Tier-based |
| Google | Gemini 1.5 Pro | generativelanguage.googleapis.com | Per-minute |
| xAI | Grok-3 | api.x.ai | Per-minute |

### Fallback Behavior
- If one AI fails, debate continues with remaining AIs
- Credit only charged if ≥50% of AIs respond successfully
- Circuit breaker opens after repeated failures

---

## Security

### Headers (Applied to All Responses)

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | [see server.js] | XSS protection |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing protection |
| `X-Frame-Options` | `DENY` | Clickjacking protection |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer control |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Feature restrictions |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HTTPS enforcement |

### CSP Whitelist
- **Scripts:** self, Tailwind CDN, Clerk JS
- **Styles:** self, Google Fonts
- **Connections:** self, AI providers, Clerk
- **Frames:** Clerk (auth popups)

---

## Monitoring

### Health Checks

| Endpoint | Expected | Purpose |
|----------|----------|---------|
| `/api/config` | 200 + JSON | API health |
| `/` | 200 + HTML | Frontend health |

### Uptime Monitoring
- **Service:** UptimeRobot (free tier)
- **URL:** https://consensusai.live
- **Check Interval:** 5 minutes
- **Alerts:** Email on downtime

### Logs
- **Location:** Railway dashboard → Deployments → Logs
- **Retention:** 7 days (free tier)

---

## Disaster Recovery

### Backup Strategy
- **Code:** GitHub repository (full history)
- **Database:** No persistent database (stateless)
- **User Data:** Stored in Clerk (auth) and Stripe (payments)
- **Debate History:** Browser localStorage (client-side only)

### Recovery Steps

1. **Code Issue:** Rollback via Railway dashboard
2. **Environment Issue:** Re-add env vars from secure backup
3. **Domain Issue:** Update DNS to point to new deployment
4. **Total Loss:** Re-deploy from GitHub, re-configure env vars

---

## File Structure (Infrastructure-Related)

```
consensus-platform/
├── server.js              # Main server (production entry point)
├── railway.json           # Railway deployment config
├── vercel.json            # Vercel config (NOT USED for prod)
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variable template
├── config.js              # App configuration
├── DEPLOY-GUIDE.md        # Deployment instructions
├── INFRASTRUCTURE.md      # This document
└── api/
    └── index.js           # Vercel serverless (NOT USED)
```

---

## Costs (Estimated Monthly)

| Service | Plan | Cost |
|---------|------|------|
| Railway | Hobby | ~$5-20 |
| Clerk | Free tier | $0 |
| Stripe | Per transaction | 2.9% + 30¢ |
| Sentry | Free tier | $0 |
| PostHog | Free tier | $0 |
| Domain | Annual | ~$12/year |
| **AI APIs** | Usage-based | Variable |

---

## Contacts

| Role | Contact |
|------|---------|
| Support | support@consensusai.app |
| Security | security@consensusai.app |
| Privacy | privacy@consensusai.app |

---

## Quick Reference

```bash
# Deploy (automatic)
git push origin main

# Deploy (manual)
railway up

# View logs
railway logs

# Check deployment status
railway status

# Rollback
railway rollback
```

---

*For detailed deployment steps, see [DEPLOY-GUIDE.md](./DEPLOY-GUIDE.md)*
*For business logic, see [BUSINESS-REQUIREMENTS.md](./BUSINESS-REQUIREMENTS.md)*
