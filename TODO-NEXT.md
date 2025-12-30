# ConsensusAI - Task Planner (Updated Dec 30, 2024)

## Recently Completed
- [x] Stripe payments integration
- [x] Clerk authentication
- [x] SQLite database (replaced file-based JSON)
- [x] Rate limiting (3 debates/day for free tier)
- [x] Model tiers (budget vs premium)
- [x] Devil's Advocate mode
- [x] Admin dashboard with monitoring
- [x] Content moderation
- [x] Upgrade flow fixes (all entry points working)
- [x] Character counter on input
- [x] Meta-statement filtering in verdicts
- [x] Centered debate stats bar

---

## Current Sprint - UI Polish & Email Setup

### 1. Favicon Fix (Google Search Visibility)
- [x] Create `favicon-16x16.png` from logo
- [x] Create `favicon-32x32.png` from logo
- [x] Create `apple-touch-icon.png` (180x180)
- [x] Create `icon-192x192.png` and `icon-512x512.png` for PWA
- [x] Update all HTML files with proper favicon links
- [x] Add `site.webmanifest` for PWA support

### 2. Logo Size Standardization
- [x] Audit current logo sizes
- [x] Standardize sizes:
  - Desktop: 50-60px
  - Tablet (768px): 48px
  - Mobile (480px): 40px
- [x] Updated index.html, contact.html, pricing.html

### 3. Transactional Email Setup (Resend)
- [ ] Create Resend account and get API key
- [ ] Add `RESEND_API_KEY` to environment
- [ ] Create email templates:
  - [ ] Welcome email (on signup)
  - [ ] Contact form notification (to admin)
  - [ ] Support request acknowledgment
- [ ] Set up Clerk webhook for `user.created` event
- [ ] Set up Stripe webhook for refund events
- [ ] Test all email flows

---

## Backlog

### High Priority
- [ ] Error monitoring (Sentry free tier)
- [ ] Automated tests (critical paths)
- [ ] CORS restrictions (currently wide open)

### Medium Priority
- [ ] SEO improvements (meta tags, structured data)
- [ ] Performance optimization (lazy loading)
- [ ] Analytics dashboard enhancements

### Low Priority
- [ ] Team/Enterprise pricing tier
- [ ] API access for developers
- [ ] Browser extension

---

## Key Configuration Files
- `server.js` - Main server, routes, webhooks
- `stripe.js` - Payment handling
- `auth.js` - Clerk authentication
- `prompts.js` - AI prompt templates
- `debate-engine.js` - Core debate logic
- `config.js` - Environment configuration

## Environment Variables Needed
```
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
XAI_API_KEY=
RESEND_API_KEY=          # NEW - for transactional emails
ADMIN_EMAILS=            # Comma-separated admin emails
```

## Test URLs
- Local: http://localhost:3000
- App: http://localhost:3000/cortex.html
- Admin: http://localhost:3000/admin.html
