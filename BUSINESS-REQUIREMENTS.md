# ConsensusAI - Business Requirements Document (BRD)

> **Version:** 1.0
> **Last Updated:** December 15, 2025
> **Status:** Production Ready
> **Owner:** ConsensusAI Team

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Tiers & Pricing](#2-user-tiers--pricing)
3. [Core User Flows](#3-core-user-flows)
4. [Credit & Usage System](#4-credit--usage-system)
5. [AI Debate Engine](#5-ai-debate-engine)
6. [API Failure Handling](#6-api-failure-handling)
7. [Content Moderation](#7-content-moderation)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Payment Processing](#9-payment-processing)
10. [UI/UX Requirements](#10-uiux-requirements)
11. [Security Requirements](#11-security-requirements)
12. [Error Handling](#12-error-handling)
13. [Analytics & Tracking](#13-analytics--tracking)

---

## 1. Product Overview

### 1.1 What is ConsensusAI?

ConsensusAI is an AI-powered decision intelligence platform that helps users make informed decisions by:

- Submitting questions to **4 different AI models** simultaneously (GPT-4, Claude, Gemini, Grok)
- Running a multi-round **debate** between these AIs
- Analyzing **consensus and disagreement** between AI perspectives
- Providing a **synthesized recommendation** with action items

### 1.2 Value Proposition

| For Users | Benefit |
|-----------|---------|
| Individuals | Get balanced AI perspectives, not just one model's opinion |
| Decision-makers | See where AIs agree (high confidence) vs disagree (caution needed) |
| Researchers | Compare how different LLMs approach the same question |

### 1.3 Key Differentiators

1. **Multi-model consensus** - Not just one AI's opinion
2. **Structured decisions** - YES/NO/CONDITIONAL/WAIT/ALTERNATIVE
3. **Confidence scoring** - Based on AI agreement, not arbitrary percentages
4. **Devil's advocate mode** - Forces contrarian perspectives
5. **Actionable output** - Action plans, not just analysis

---

## 2. User Tiers & Pricing

### 2.1 Free Tier

| Attribute | Value |
|-----------|-------|
| Price | $0/month |
| Daily debate limit | 3 debates/day |
| Model tier | Budget (cost-effective models) |
| Features | Basic consensus, 7-day history |
| Reset time | Midnight UTC |

### 2.2 Pro Tier

| Attribute | Value |
|-----------|-------|
| Price | $19/month |
| Daily debate limit | Unlimited |
| Model tier | Premium (GPT-4 Turbo, Claude 3 Opus, etc.) |
| Features | Advanced consensus, unlimited history, priority support |
| Billing | Monthly, via Stripe |
| Cancellation | Anytime, access until end of billing period |

### 2.3 Model Tiers Explained

**Budget Tier (Free users):**
- GPT-4o-mini
- Claude 3 Haiku
- Gemini 1.5 Flash
- Grok (standard)

**Premium Tier (Pro users):**
- GPT-4 Turbo
- Claude 3 Opus
- Gemini 1.5 Pro
- Grok (latest)

---

## 3. Core User Flows

### 3.1 New User Flow

```
1. User lands on homepage
2. Sees cookie consent banner → Accept/Decline
3. Can immediately ask a question (no auth required)
4. After 3 free debates → Prompted to sign up
5. Sign up via Clerk (email/Google/GitHub)
6. Continue with free tier OR upgrade to Pro
```

### 3.2 Question Submission Flow

```
1. User types question in input box
2. (Optional) Add context/constraints
3. (Optional) Toggle Devil's Advocate mode
4. (Optional) Select model tier (Pro only)
5. (Optional) Select which AIs to include (min 2)
6. Click Submit or press Enter
7. → Content moderation check
   - If blocked → Show error, don't charge
   - If warning → Log, proceed
   - If allowed → Continue
8. → Usage limit check
   - If limit reached → Show upgrade modal
   - If allowed → Continue
9. Start debate stream
```

### 3.3 Debate Execution Flow

```
1. Connect to SSE stream for real-time updates
2. Round 1: All AIs answer independently
   - Show each AI's response as it completes
   - Display in debate stream panel
3. Round 2+: AIs respond to each other's arguments
   - May change position based on others' points
   - Continue until consensus or max rounds (2)
4. Synthesis: Generate action plan from consensus
5. Show verdict overlay with results
```

### 3.4 Verdict Display Flow

```
1. Verdict overlay slides up
2. Shows:
   - Consensus badge (UNANIMOUS / STRONG CONSENSUS / MAJORITY / SPLIT)
   - Decision (YES/NO/CONDITIONAL/etc.)
   - AI agreement count (e.g., 3/4)
   - Position spectrum (visual slider)
   - Individual AI cards with their positions
   - Key insights (pros/cons)
   - Action plan (if available)
3. User can:
   - Click AI card → Open detailed inspector
   - Ask follow-up question
   - Start new question
   - View full transcript
```

### 3.5 Follow-up Question Flow

```
1. From verdict panel, user types follow-up
2. Context from previous debate is preserved
3. New debate runs with previous context
4. Counts as new debate credit
```

### 3.6 History Flow

```
1. Click history icon in header
2. History drawer opens
3. Shows recent debates (question + consensus)
4. Click item → Re-display that verdict
5. Can ask follow-up from historical verdict
```

### 3.7 Upgrade Flow

```
1. Trigger: Click "Upgrade" OR hit usage limit
2. If not authenticated:
   - Show login modal first
   - After login, continue to checkout
3. If authenticated:
   - Create Stripe checkout session
   - Redirect to Stripe checkout page
   - On success → Redirect to app with Pro status
4. Webhook updates user tier to "pro"
```

### 3.8 Subscription Management Flow

```
1. Pro user clicks account/settings
2. Option to "Manage Subscription"
3. Opens Stripe Customer Portal
4. User can:
   - Update payment method
   - Cancel subscription
   - View invoices
5. On cancellation:
   - Access continues until billing period ends
   - Webhook downgrades tier to "free"
```

---

## 4. Credit & Usage System

### 4.1 Free Tier Limits

| Metric | Limit | Reset |
|--------|-------|-------|
| Debates per day | 3 | Midnight UTC |
| Questions per debate | 1 | - |
| Follow-ups | Count as new debate | - |

### 4.2 Credit Consumption Rules

| Action | Credits Used |
|--------|--------------|
| Submit new question | 1 credit |
| Submit follow-up | 1 credit |
| View history | 0 credits |
| API failure (>50% fail) | 0 credits (refunded) |
| Content blocked | 0 credits |

### 4.3 Credit Refund Scenarios

| Scenario | Credit Charged? | Reason |
|----------|-----------------|--------|
| 4/4 AIs succeed | Yes | Full results |
| 3/4 AIs succeed | Yes | Sufficient results |
| 2/4 AIs succeed | Yes | Minimum viable (50%) |
| 1/4 AIs succeed | **No** | Degraded experience |
| 0/4 AIs succeed | **No** | Complete failure |
| Query blocked by moderation | **No** | No processing done |
| User hits rate limit | **No** | Request rejected |

### 4.4 Usage Tracking

```javascript
// Tracked per user:
{
  tier: 'free' | 'pro',
  dailyUsage: { '2025-12-15': 2 },  // Date → count
  totalDebates: 47,
  stripeCustomerId: 'cus_xxx'  // For Pro users
}
```

---

## 5. AI Debate Engine

### 5.1 Participating AIs

| AI | Provider | ID | Color |
|----|----------|-----|-------|
| GPT-4 | OpenAI | `openai` | Green (#10b981) |
| Claude | Anthropic | `claude` | Orange (#f97316) |
| Gemini | Google | `gemini` | Blue (#3b82f6) |
| Grok | xAI | `grok` | Purple (#8b5cf6) |

### 5.2 Debate Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| Max rounds | 2 | Can end early on consensus |
| Min AIs | 2 | User can deselect up to 2 |
| Max AIs | 4 | All 4 by default |
| Timeout per AI | 30 seconds | Per API call |
| Max retries | 3 | With exponential backoff |

### 5.3 Structured Decision Types

| Decision | Meaning | When Used |
|----------|---------|-----------|
| `YES` | Proceed/Approve | Clear positive recommendation |
| `NO` | Don't proceed/Reject | Clear negative recommendation |
| `CONDITIONAL` | Yes, but with conditions | Depends on factors |
| `WAIT` | Need more information | Insufficient data |
| `ALTERNATIVE` | Neither option, suggest different | Better path exists |

### 5.4 Consensus Types

| Type | Condition | Display |
|------|-----------|---------|
| `unanimous` | All AIs agree | "ALL 4 AIs AGREE" |
| `supermajority` | All but one agree | "STRONG CONSENSUS" |
| `majority` | >50% agree | "MAJORITY: X (3/4)" |
| `split` | No majority | "SPLIT DECISION" |
| `insufficient` | <2 valid responses | "INSUFFICIENT DATA" |

### 5.5 Question Type Detection

The system auto-detects question types and adjusts labels:

| Type | Example | Decision Label |
|------|---------|----------------|
| `decision` | "Should I buy X?" | YES/NO/CONDITIONAL |
| `planning` | "How should I plan X?" | PLAN PROVIDED |
| `howto` | "How do I do X?" | GUIDE PROVIDED |
| `factual` | "What is X?" | INFO PROVIDED |
| `recommendation` | "What's the best X?" | RECOMMENDED |
| `comparison` | "X vs Y?" | VERDICT |
| `general` | Other | ANSWERED |

### 5.6 Devil's Advocate Mode

When enabled:
- One AI is assigned contrarian role
- Must argue against the majority position
- Helps surface overlooked risks
- Indicated in debate stream

---

## 6. API Failure Handling

### 6.1 Retry Logic

```
Attempt 1: Immediate
Attempt 2: Wait 1 second
Attempt 3: Wait 2 seconds (exponential backoff)
Total timeout: 30 seconds per AI
```

### 6.2 Circuit Breaker

| State | Behavior |
|-------|----------|
| `CLOSED` | Normal operation |
| `OPEN` | Block requests, return cached error |
| `HALF_OPEN` | Test with limited requests |

**Triggers:**
- Opens after 5 consecutive failures
- Recovers after 60 seconds
- Tests with 2 requests in half-open state

### 6.3 Retryable vs Non-Retryable Errors

**Retryable (will retry):**
- Timeout
- Network errors (ECONNREFUSED, ECONNRESET)
- Rate limiting (429)
- Server errors (500, 502, 503, 504)

**Non-Retryable (immediate fail):**
- Authentication errors (401, 403)
- Invalid API key
- Quota exceeded
- Bad request (400)

### 6.4 Partial Failure UI

When some AIs fail:

1. **Warning banner** at top of verdict:
   ```
   ⚠️ 1 AI unavailable: Claude. No credit was charged.
   ```

2. **Failed AI card** shows:
   - Grayed out appearance
   - "UNAVAILABLE" badge
   - Error message

3. **Consensus** calculated from successful AIs only

---

## 7. Content Moderation

### 7.1 Moderation Levels

| Level | Action | User Message |
|-------|--------|--------------|
| `BLOCKED` | Reject query | "This query contains prohibited content..." |
| `WARNING` | Allow but log | (None shown, proceeds normally) |
| `ALLOWED` | Normal processing | (None) |

### 7.2 Blocked Content Categories

**Banned Topics (Immediate Block):**
- Violence and harm instructions
- Illegal activities (drugs, hacking, fraud)
- Child safety violations
- Self-harm content
- Terrorism

**NSFW Content (Block):**
- Explicit sexual content
- Pornography references
- Adult services

### 7.3 Warning Categories (Allowed but Logged)

- Abortion/reproductive rights
- Gun control
- Immigration
- Vaccines
- Election-related
- Climate change debates
- Religious extremism

### 7.4 Spam Detection

Blocked patterns:
- Repeated characters (10+)
- Too short (<3 chars after sanitization)
- Too long (>1000 chars)
- Multiple URLs (3+)
- Spam phrases

### 7.5 Input Sanitization

All queries are sanitized:
- Remove `<script>` tags
- Remove HTML tags
- Remove `javascript:` URLs
- Remove event handlers
- Trim and limit to 1000 chars

---

## 8. Authentication & Authorization

### 8.1 Auth Provider

- **Provider:** Clerk
- **Methods:** Email, Google, GitHub
- **Session:** JWT-based

### 8.2 Auth States

| State | Can Debate? | Limit | Can Upgrade? |
|-------|-------------|-------|--------------|
| Anonymous | Yes | 3/day (IP-based) | Must sign up first |
| Free User | Yes | 3/day | Yes |
| Pro User | Yes | Unlimited | Already Pro |

### 8.3 User Identification

```javascript
// Priority order:
1. Clerk userId (authenticated)
2. IP address hash (anonymous)
```

---

## 9. Payment Processing

### 9.1 Provider

- **Provider:** Stripe
- **Checkout:** Stripe Checkout (hosted)
- **Portal:** Stripe Customer Portal

### 9.2 Webhook Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Upgrade user to Pro |
| `customer.subscription.deleted` | Downgrade user to Free |
| `invoice.payment_failed` | Log, send notification |

### 9.3 Refund Policy

- 7-day refund window for first payment
- Contact support for refund requests
- Pro-rated refunds at discretion

---

## 10. UI/UX Requirements

### 10.1 Responsive Breakpoints

| Breakpoint | Target | Key Adaptations |
|------------|--------|-----------------|
| Desktop | >1024px | Full layout, side panels |
| Tablet | 768-1024px | Compact header, 2-column grid |
| Mobile | 480-768px | Stack layout, bottom sheets |
| Small Mobile | <480px | Minimal UI, large touch targets |
| Galaxy Fold | 280px | Extra compact, no animations |

### 10.2 Touch Targets

- Minimum: 44x44px (iOS standard)
- Mobile buttons: 48px height minimum
- Spacing: 8px minimum between targets

### 10.3 Core UI Elements

| Element | Desktop | Mobile |
|---------|---------|--------|
| Query box | Center, visible | Center, hidden during debate |
| AI nodes | Around orb | Corner positioned |
| Debate stream | Right panel | Top overlay |
| Verdict | Center overlay | Bottom sheet |
| History | Left drawer | Full screen |

### 10.4 Accessibility

- Keyboard navigation supported
- Focus indicators visible
- Color contrast AA compliant
- Tooltips disabled on touch devices

---

## 11. Security Requirements

### 11.1 HTTP Headers

| Header | Value |
|--------|-------|
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |
| HSTS | max-age=31536000; includeSubDomains |

### 11.2 Data Protection

| Data | Storage | Encryption |
|------|---------|------------|
| User credentials | Clerk (not stored locally) | Clerk-managed |
| Payment info | Stripe (not stored locally) | PCI-compliant |
| Queries | Temporary processing only | In-transit (HTTPS) |
| Debate history | Browser localStorage | None (client-side) |

### 11.3 API Security

- API keys stored in environment variables
- Rate limiting per user/IP
- Input sanitization on all endpoints
- CORS configured for allowed origins

---

## 12. Error Handling

### 12.1 Error Types & User Messages

| Error | User Message | Action |
|-------|--------------|--------|
| Rate limit exceeded | "Daily limit reached. Upgrade for unlimited." | Show upgrade modal |
| Content blocked | "This query contains prohibited content." | Don't charge credit |
| API timeout | "AI is taking longer than expected..." | Retry or show partial |
| All AIs failed | "Unable to get responses. Please try again." | Don't charge credit |
| Payment failed | "Payment could not be processed." | Retry or contact support |
| Auth required | "Please sign in to continue." | Show login modal |

### 12.2 Error Display

- **Toast notifications:** Transient errors (3-5 seconds)
- **Modal dialogs:** Blocking errors requiring action
- **Inline messages:** Form validation errors

---

## 13. Analytics & Tracking

### 13.1 Events Tracked

| Event | Properties |
|-------|------------|
| `debate_started` | question, tier, devil_advocate |
| `debate_completed` | duration, consensus_type, model_count |
| `checkout_initiated` | user_id |
| `checkout_completed` | plan, amount |
| `error_occurred` | type, message |

### 13.2 Metrics

| Metric | Description |
|--------|-------------|
| Daily Active Users | Unique users per day |
| Debates per User | Average debates/user/day |
| Consensus Rate | % debates reaching consensus |
| Conversion Rate | Free → Pro upgrades |
| API Success Rate | % successful API calls |

---

## Appendix A: File Reference

| File | Purpose |
|------|---------|
| `server.js` | Main server, API routes |
| `debate-engine.js` | Core debate logic |
| `content-moderation.js` | Query filtering |
| `api-resilience.js` | Retry, circuit breaker |
| `usage.js` | Credit tracking |
| `auth.js` | Clerk integration |
| `stripe.js` | Payment processing |
| `public/index.html` | Main application UI |

---

## Appendix B: API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/config` | GET | App configuration |
| `/api/debate` | POST | Start new debate |
| `/api/debate/stream` | GET (SSE) | Real-time debate updates |
| `/api/history` | GET | User's debate history |
| `/api/user/stats` | GET | Usage statistics |
| `/api/health` | GET | API health status |
| `/api/tier` | GET/POST | Get/set model tier |
| `/api/auth/me` | GET | Current user info |
| `/api/stripe/checkout` | POST | Create checkout session |
| `/api/stripe/portal` | POST | Create portal session |
| `/api/stripe/webhook` | POST | Stripe webhooks |

---

## Appendix C: Change Log

| Date | Version | Changes |
|------|---------|---------|
| Dec 15, 2025 | 1.0 | Initial BRD creation |

---

*This document serves as the authoritative reference for ConsensusAI business logic and user flows.*
