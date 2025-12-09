# ConsensusAI - Implementation Plan

**Version:** 2.0
**Created:** December 5, 2025
**Updated:** December 9, 2025
**Status:** Phase 1 Complete - Ready for Deployment

---

## Executive Summary

This document outlines the implementation plan to take ConsensusAI from MVP to launch-ready product. The focus is on **getting paid** before adding features.

**Timeline:** 2-3 weeks to launch
**Target:** Solopreneurs, Developers, Marketers
**Price Point:** $19/month (single tier to start)

---

## Current Status

### Completed ✅

#### Core Platform
- [x] Multi-AI debate engine (4 models: GPT, Gemini, Claude, Grok)
- [x] 3-round debate with position evolution
- [x] Living Cortex UI visualization
- [x] Real-time SSE streaming
- [x] Devil's Advocate mode
- [x] Follow-up question system
- [x] Share functionality
- [x] Decision history (local storage)
- [x] Custom tooltips
- [x] Usage tracking & rate limiting
- [x] Clerk authentication (optional)
- [x] Model tier selection (Budget/Premium)
- [x] Template chips (8 categories)
- [x] Conflict lines between disagreeing nodes
- [x] 2-column Key Insights grid
- [x] Verdict panel reset for consistency
- [x] AI Panel settings (model selection, personas)
- [x] Comparison question detection

#### Production Infrastructure (Dec 9, 2025)
- [x] Stripe payment integration (checkout, webhooks, portal)
- [x] Stripe product/price setup script
- [x] Sentry error monitoring integration
- [x] PostHog analytics integration
- [x] SEO optimization (meta tags, Open Graph, Twitter cards)
- [x] sitemap.xml and robots.txt
- [x] API test suite (30 tests)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Vercel deployment configuration
- [x] Marketing automation agent
- [x] Comprehensive documentation

### Remaining ⏳
- [ ] Deploy to Vercel (ready - needs command)
- [ ] Create Stripe webhook (after deployment)
- [ ] Configure Sentry DSN (needs account)
- [ ] Configure PostHog API key (optional)
- [ ] Email capture modal (Phase 2)
- [ ] Production database migration (Phase 2)

---

## Phase 1: Payment Integration (Priority #1)

**Goal:** Accept money before anything else
**Timeline:** 3-5 days
**Owner:** Claude (CTO)

### 1.1 Stripe Setup

#### Required from Founder:
```
STRIPE_SECRET_KEY=sk_test_...      # From Stripe Dashboard → Developers → API Keys
STRIPE_PUBLISHABLE_KEY=pk_test_... # Public key for frontend
STRIPE_WEBHOOK_SECRET=whsec_...    # From Stripe Dashboard → Webhooks
STRIPE_PRICE_ID=price_...          # Created in Stripe Products
```

#### Implementation Tasks:
| Task | File | Description |
|------|------|-------------|
| Create Stripe client | `stripe.js` | Initialize Stripe SDK |
| Checkout endpoint | `server.js` | POST /api/checkout → Create Stripe session |
| Success/Cancel pages | `public/` | Redirect after payment |
| Webhook handler | `server.js` | POST /api/webhook → Handle payment events |
| Pro tier logic | `usage.js` | Check subscription status |
| UI integration | `cortex.html` | Upgrade button → Checkout |

#### Pricing Structure:
```
FREE TIER:
├── 3 debates/day
├── Budget models only
└── Basic features

PRO TIER ($19/month):
├── Unlimited debates
├── Premium models (GPT-4o, Claude Sonnet, etc.)
├── Priority processing
├── Decision history sync
└── Export to PDF (future)
```

### 1.2 Pro Feature Gating

| Feature | Free | Pro |
|---------|------|-----|
| Daily debates | 3 | Unlimited |
| Model tier | Budget only | Budget + Premium |
| History | Local only | Cloud sync |
| Follow-ups | 1 per debate | Unlimited |
| Export | None | PDF/Markdown |

### 1.3 Checkout Flow

```
User clicks "Upgrade" → Stripe Checkout → Payment → Webhook → Update user tier → Redirect to app
```

---

## Phase 2: Operations & Monitoring

**Goal:** Sleep peacefully knowing errors are caught
**Timeline:** 1-2 days (after Stripe)
**Owner:** Claude (CTO)

### 2.1 Sentry Error Monitoring

#### Setup:
```bash
npm install @sentry/node
```

#### Environment Variable:
```
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

#### Integration Points:
- Server startup
- API error handling
- Uncaught exceptions
- Frontend errors (optional)

#### Cost: FREE (5,000 errors/month)

### 2.2 PostHog Analytics

#### Setup:
```bash
npm install posthog-node
```

#### Environment Variable:
```
POSTHOG_API_KEY=phc_xxx
```

#### Events to Track:
| Event | Trigger | Properties |
|-------|---------|------------|
| `debate_started` | Form submit | question_length, has_context, tier |
| `debate_completed` | Result shown | duration, consensus_reached, model_count |
| `upgrade_clicked` | Upgrade button | current_tier, page |
| `checkout_completed` | Webhook | plan, amount |
| `followup_asked` | Follow-up submit | parent_debate_id |

#### Cost: FREE (1M events/month)

### 2.3 UptimeRobot

#### Setup: Manual (founder)
1. Go to uptimerobot.com
2. Create free account
3. Add monitor: `https://consensusai.app` (or your domain)
4. Set alert email

#### Cost: FREE (50 monitors)

---

## Phase 3: Production Deployment

**Goal:** Go live on a real domain
**Timeline:** 1-2 days
**Owner:** Claude (CTO) + Founder

### 3.1 Platform Options

| Platform | Pros | Cons | Cost |
|----------|------|------|------|
| **Vercel** | Easy, fast, free tier | Serverless limitations | Free → $20/mo |
| **Railway** | Simple, good for Node | Less known | $5/mo |
| **Render** | Good free tier | Cold starts | Free → $7/mo |
| **Fly.io** | Fast, global | More complex | $5/mo |

**Recommendation:** Start with **Vercel** or **Railway**

### 3.2 Environment Variables (Production)

```bash
# Required
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
XAI_API_KEY=xai-...

# Auth
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# Monitoring
SENTRY_DSN=https://...
POSTHOG_API_KEY=phc_...

# App
NODE_ENV=production
```

### 3.3 Database Migration

**Current:** JSON files in `/data/decisions/`
**Target:** Supabase (PostgreSQL)

#### Schema:
```sql
-- Users (synced from Clerk)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT,
  tier TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Debates
CREATE TABLE debates (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  question TEXT,
  context TEXT,
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage
CREATE TABLE usage (
  user_id TEXT REFERENCES users(id),
  date DATE,
  count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, date)
);
```

**Note:** Database migration can happen AFTER launch. JSON files work for MVP.

---

## Phase 4: Launch

**Goal:** Get first 100 users
**Timeline:** 1 week
**Owner:** Founder (with AI assistance)

### 4.1 Launch Checklist

#### Pre-Launch (Day -3 to -1):
- [ ] Test payment flow end-to-end
- [ ] Test on mobile devices
- [ ] Prepare Product Hunt assets (logo, screenshots, tagline)
- [ ] Write Hacker News post draft
- [ ] Prepare Twitter announcement thread
- [ ] Get 3-5 friends to be early testers

#### Launch Day:
- [ ] Submit to Product Hunt (Tuesday-Thursday, 12:01 AM PT)
- [ ] Post "Show HN" on Hacker News
- [ ] Tweet announcement with demo video
- [ ] Post in r/SideProject, r/startups
- [ ] Email personal network

#### Post-Launch (Day +1 to +7):
- [ ] Respond to all comments/feedback
- [ ] Fix critical bugs immediately
- [ ] Collect testimonials from happy users
- [ ] Write "lessons learned" thread

### 4.2 Launch Assets Needed

| Asset | Spec | Status |
|-------|------|--------|
| Logo | 240x240 PNG | ✅ Have |
| Hero Screenshot | 1270x760 PNG | Need to capture |
| Demo Video | 60-90 sec, GIF or MP4 | Need to record |
| Tagline | <60 chars | "4 AIs debate your decisions" |
| Description | 260 chars (PH) | Need to write |

### 4.3 Launch Copy

**Product Hunt Tagline:**
> "4 AI models debate your decisions and reach consensus"

**Hacker News Title:**
> "Show HN: ConsensusAI – I built a tool where GPT, Claude, Gemini, and Grok debate your questions"

**Twitter Thread Hook:**
> "I built a tool where 4 AIs argue with each other about your decisions.
>
> Then they reach consensus.
>
> Here's what happened when I asked if I should quit my job 🧵"

---

## Phase 5: Marketing (Ongoing)

**Goal:** Sustainable user acquisition
**Timeline:** Ongoing
**Owner:** Founder

### 5.1 The "Dogfooding" Content Strategy

```
Weekly Routine:
├── Monday: Find trending topic (Perplexity/Grok)
├── Tuesday: Run debate on ConsensusAI
├── Wednesday: Screenshot interesting results
├── Thursday: Post to Twitter with insights
├── Friday: Engage with comments, find new topics
```

### 5.2 Tools Stack

| Purpose | Tool | Cost |
|---------|------|------|
| Tweet scheduling | Typefully | $12/mo or Free tier |
| Multi-platform | Buffer | Free tier |
| Reddit monitoring | GummySearch | $19/mo |
| Email newsletter | Loops | Free tier |

### 5.3 Content Ideas

1. **"AI Disagreement" posts** - When AIs split 2-2, share the drama
2. **"I asked 4 AIs about [controversial topic]"** - Tech debates, career advice
3. **"Behind the scenes"** - Building in public, sharing metrics
4. **"User stories"** - How people use it for real decisions
5. **"AI vs AI"** - Which AI gives the best advice by category

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API costs spike | Rate limiting already in place, monitor daily |
| Stripe issues | Start with test mode, verify webhooks |
| Server crashes | Sentry alerts, UptimeRobot monitoring |
| No users | Pre-build launch list, multiple channels |
| Negative feedback | Respond quickly, iterate fast |

---

## Success Metrics

### Week 1 Goals:
- [ ] 100 signups
- [ ] 10 paid subscribers ($190 MRR)
- [ ] <1% error rate
- [ ] 4.0+ Product Hunt rating

### Month 1 Goals:
- [ ] 500 signups
- [ ] 50 paid subscribers ($950 MRR)
- [ ] 1 viral tweet (>100 retweets)
- [ ] Feature in 1 newsletter

---

## Immediate Next Steps

1. **Founder provides Stripe API keys**
2. **Claude implements Stripe checkout**
3. **Claude adds Sentry**
4. **Claude adds PostHog**
5. **Deploy to Vercel/Railway**
6. **Launch on Product Hunt**

---

## Appendix: File Changes Summary

| File | Changes |
|------|---------|
| `package.json` | Add stripe, @sentry/node, posthog-node |
| `server.js` | Add /api/checkout, /api/webhook, Sentry init |
| `.env` | Add STRIPE_*, SENTRY_DSN, POSTHOG_API_KEY |
| `cortex.html` | Add upgrade button → checkout redirect |
| `usage.js` | Add subscription status check |
| `public/success.html` | New - Payment success page |
| `public/pricing.html` | New - Pricing page |

---

*Document generated by Claude (CTO) - December 5, 2025*
*Ready for founder approval and execution*
