# ConsensusAI - Project Tracker

> Last Updated: December 15, 2025
>
> This file tracks all features, bugs, and improvements for the ConsensusAI platform.
> Use this as a single source of truth for project status.

---

## Status Legend
- `DONE` - Completed and deployed
- `IN_PROGRESS` - Currently being worked on
- `TODO` - Planned but not started
- `BLOCKED` - Waiting on something external
- `WONTFIX` - Decided against implementing

---

## Core Features

### Authentication & User Management
| Feature | Status | Notes |
|---------|--------|-------|
| Clerk integration | DONE | Sign in/up working |
| User session persistence | DONE | - |
| User tier display | DONE | Free/Pro badge |
| Account management | DONE | Via Clerk |

### AI Debate Engine
| Feature | Status | Notes |
|---------|--------|-------|
| Multi-round debate | DONE | 2+ rounds |
| 4 LLM integration (GPT, Claude, Gemini, Grok) | DONE | All working |
| Streaming responses | DONE | SSE-based |
| Consensus detection | DONE | Full/partial/split |
| Question type detection | DONE | Planning, comparison, how-to, etc. |
| Devil's advocate mode | DONE | Toggle available |
| Follow-up questions | DONE | AI-generated |

### Billing & Subscriptions
| Feature | Status | Notes |
|---------|--------|-------|
| Stripe integration | DONE | Checkout working |
| Free tier (10 debates/day) | DONE | - |
| Pro tier ($19/mo) | DONE | - |
| Usage tracking | DONE | Per user |
| Upgrade flow | DONE | Shows login modal if not authenticated |

### UI/UX
| Feature | Status | Notes |
|---------|--------|-------|
| Desktop responsive | DONE | - |
| Tablet responsive (768px) | DONE | 44px touch targets, decluttered |
| Mobile responsive (480px) | DONE | iOS zoom prevention, proper touch targets |
| Small mobile (360px) | DONE | Minimal UI, maintained 36px+ touch targets |
| Tooltips disabled on mobile | DONE | Per NN/g best practices |
| Cookie consent banner | DONE | Accept/Decline |
| 404 error page | DONE | Branded |
| PWA manifest | DONE | Add to home screen ready |
| Secondary pages mobile | DONE | Terms, privacy, cookies, disclaimer |

---

## Pending Tasks

### HIGH PRIORITY

| Task | Status | Notes |
|------|--------|-------|
| **Content Moderation** | DONE | Banned topics, NSFW, controversial warnings |
| **API Resilience** | DONE | 30s timeout, 3x retry, circuit breaker pattern |
| **Security Hardening** | PARTIAL | CSP headers still TODO, rate limiting done |
| Add app icons (all sizes) | TODO | Need 72-512px PNGs for PWA |
| Add favicon.ico | TODO | Brand favicon |
| Create real OG image | TODO | Replace placeholder og-image.png |
| Replace legal placeholders | TODO | Terms & Privacy from Termly |
| Test mobile during active debate | DONE | Completed Dec 15 |

### CRITICAL - Before Launch

| Task | Status | Priority | Details |
|------|--------|----------|---------|
| Content Moderation | DONE | P0 | Banned topics, NSFW detection, warning system |
| API Resilience | DONE | P0 | 30s timeouts, 3x retry, circuit breaker |
| Security (CSP) | TODO | P1 | Content-Security-Policy header |
| Rate Limiting | DONE | P1 | Already implemented in usage.js |

### MEDIUM PRIORITY

| Task | Status | Notes |
|------|--------|-------|
| Add analytics (GA/Plausible) | TODO | Optional but recommended |
| Add SENTRY_DSN to Railway | TODO | Enable error tracking |
| Improve loading states | TODO | Skeleton loaders |
| Add onboarding tour | TODO | For new users |
| Export to PDF | TODO | User-requested |
| Shareable debate links | TODO | Public share URLs |

### LOW PRIORITY

| Task | Status | Notes |
|------|--------|-------|
| Keyboard shortcuts | TODO | Power user feature |
| Dark/light theme toggle | TODO | Currently dark only |
| Rate limit user feedback | TODO | Show when throttled |
| Apple touch icons | TODO | iOS home screen |

---

## Known Bugs

| Bug | Status | Severity | Notes |
|-----|--------|----------|-------|
| None currently tracked | - | - | - |

---

## Recently Completed (Last 7 Days)

| Date | Task | Commit |
|------|------|--------|
| Dec 15, 2025 | **Content Moderation System** | - |
| Dec 15, 2025 | - Banned topic detection (violence, illegal, etc.) | content-moderation.js |
| Dec 15, 2025 | - NSFW content filtering | content-moderation.js |
| Dec 15, 2025 | - Controversial topic warnings | content-moderation.js |
| Dec 15, 2025 | - Input sanitization (XSS prevention) | content-moderation.js |
| Dec 15, 2025 | **API Resilience System** | - |
| Dec 15, 2025 | - 30s timeout for all API calls | api-resilience.js |
| Dec 15, 2025 | - Retry with exponential backoff (3x) | api-resilience.js |
| Dec 15, 2025 | - Circuit breaker pattern | api-resilience.js |
| Dec 15, 2025 | - /api/health endpoint for monitoring | server.js |
| Dec 15, 2025 | **Unit Tests** | - |
| Dec 15, 2025 | - Content moderation tests (18/18 pass) | tests/moderation.test.js |
| Dec 15, 2025 | - API resilience tests (15/15 pass) | tests/resilience.test.js |
| Dec 15, 2025 | - npm test:unit, test:all scripts | package.json |
| Dec 15, 2025 | **Mobile UI Complete Overhaul** | - |
| Dec 15, 2025 | Cookie banner mobile optimization (slim top bar) | - |
| Dec 15, 2025 | Header overlap fix for Galaxy Fold (280px) | - |
| Dec 15, 2025 | AI nodes repositioned to prevent overlap | - |
| Dec 15, 2025 | Template chips visible on mobile | - |
| Dec 15, 2025 | Debate stream full-width fixed panel | - |
| Dec 15, 2025 | Query box hidden during active debate | - |
| Dec 15, 2025 | Verdict panel bottom sheet optimization | - |
| Dec 15, 2025 | LLM card alignment/font consistency | - |
| Dec 15, 2025 | Auto-scroll to verdict on completion | - |
| Dec 15, 2025 | Follow-up question flow fixed | - |
| Dec 15, 2025 | Error/toast mobile display improvements | - |
| Dec 15, 2025 | Rate limit → upgrade modal flow | - |
| Dec 15, 2025 | **Testing Infrastructure** | - |
| Dec 15, 2025 | UAT test cases documented | UAT-TEST-CASES.md |
| Dec 15, 2025 | Automated mobile UAT tests (100% pass) | test-uat-mobile.js |
| Dec 15, 2025 | Automated desktop UAT tests (100% pass) | test-uat-desktop.js |
| Dec 15, 2025 | CI/CD test runner | test-ci-runner.js |
| Dec 15, 2025 | npm test scripts added | package.json |
| Dec 10, 2025 | Security headers (HSTS, X-Frame-Options, etc.) | 8337157 |
| Dec 10, 2025 | Cache headers for static assets | 8337157 |
| Dec 10, 2025 | Cookie consent banner | 8337157 |
| Dec 10, 2025 | cookies.html policy page | 8337157 |
| Dec 10, 2025 | manifest.json for PWA | 8337157 |
| Dec 10, 2025 | 404.html error page | 8337157 |
| Dec 10, 2025 | Updated sitemap.xml | 8337157 |
| Dec 10, 2025 | Mobile ring scaling (768/480/360px) | a3301f2 |
| Dec 10, 2025 | Fixed AI settings button cutoff | a3301f2 |
| Dec 10, 2025 | Fixed horizontal scrolling on mobile | 32de419 |

---

## Infrastructure

| Component | Status | Provider | Notes |
|-----------|--------|----------|-------|
| Hosting | DONE | Railway | Auto-deploy from main |
| Database | DONE | Railway (SQLite/Local) | - |
| Authentication | DONE | Clerk | - |
| Payments | DONE | Stripe | - |
| Error tracking | DONE | Sentry | Needs SENTRY_DSN env var |
| CI/CD | DONE | GitHub Actions | Syntax check only |
| Domain | TODO | - | Using Railway subdomain |

---

## External Integrations

| Integration | Status | Notes |
|-------------|--------|-------|
| OpenAI (GPT-4) | DONE | API key required |
| Anthropic (Claude) | DONE | API key required |
| Google (Gemini) | DONE | API key required |
| xAI (Grok) | DONE | API key required |
| Clerk | DONE | Auth provider |
| Stripe | DONE | Payments |
| Sentry | DONE | Error monitoring |

---

## How to Use This Tracker

1. **Before starting work**: Check this file for current status
2. **While working**: Update status to `IN_PROGRESS`
3. **After completing**: Move to `DONE`, add to "Recently Completed"
4. **Found a bug?**: Add to "Known Bugs" section
5. **New feature idea?**: Add to appropriate priority section

### Linear Integration (Optional)

If you want to use Linear.app for more advanced project management:
1. Create a Linear workspace
2. Import tasks from this file
3. Set up GitHub integration for auto-linking commits
4. Use Linear CLI: `npm install -g @linear/cli`

---

## Quick Commands

```bash
# Check project status
cat PROJECT-TRACKER.md

# Search for TODO items
grep -n "TODO" PROJECT-TRACKER.md

# View recent git commits
git log --oneline -20

# Check deployment status
# (Railway auto-deploys from main branch)
```

---

*This file is the single source of truth for ConsensusAI project tracking.*
