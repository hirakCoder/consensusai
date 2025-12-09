# ConsensusAI - Product Business Document

**Version:** 1.0
**Last Updated:** December 5, 2025
**Status:** MVP Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Overview](#3-product-overview)
4. [Target Users](#4-target-users)
5. [Core Features](#5-core-features)
6. [User Flows](#6-user-flows)
7. [Technical Architecture](#7-technical-architecture)
8. [Design System](#8-design-system)
9. [Business Model & Pricing](#9-business-model--pricing)
10. [Competitive Analysis](#10-competitive-analysis)
11. [Current Status](#11-current-status)
12. [Roadmap](#12-roadmap)

---

## 1. Executive Summary

**ConsensusAI** is a web-based SaaS platform that facilitates **multi-AI debates** for decision-making. Unlike simple AI comparison tools or single-model chatbots, ConsensusAI orchestrates 4 leading AI models (GPT-4, Gemini, Claude, Grok) to debate each other over multiple rounds, read and critique positions, and synthesize a consensus recommendation.

### Value Proposition
> "Don't just ask one AI. Let four AI models debate your question and reach consensus."

### Key Differentiators
- **Active Debate**: AIs don't just answer in parallel - they read, critique, and respond to each other
- **Multi-Round Synthesis**: 3 rounds of debate with evolving positions
- **Visual Experience**: "Living Cortex" neural arena visualization
- **Bias Mitigation**: Cross-referencing 4 models reduces individual model bias
- **Devil's Advocate Mode**: Forces contrarian perspectives for stress-testing decisions

---

## 2. Problem Statement

### The Challenge
Users face a paradox of choice when consulting AI for important decisions:
- Single AI models have inherent biases and knowledge gaps
- Manually comparing responses across ChatGPT, Gemini, Claude, etc. is tedious
- No way to see how models respond to each other's arguments
- Hard to know if an AI is confidently wrong (hallucination)

### Market Opportunity
- AI assistant market growing rapidly
- Users making increasingly important decisions with AI help
- No existing solution for multi-model deliberative AI
- Trust gap in single-model AI responses

---

## 3. Product Overview

### What ConsensusAI Does

1. **Accepts a Decision Question**: User poses a question (e.g., "Should I invest in Bitcoin?")
2. **Convenes AI Council**: 4 AI models analyze independently
3. **Facilitates Debate**: AIs read each other's positions and respond over 3 rounds
4. **Synthesizes Consensus**: Engine analyzes positions and generates unified recommendation
5. **Delivers Actionable Output**: Verdict, key insights, action plan, and risk analysis

### The "Living Cortex" Experience
The platform uses a unique "Neural Arena" visualization:
- **Central Core**: Pulsating orb representing consensus synthesis
- **AI Nodes**: 4 corners with brand-colored AI identifiers
- **Data Streams**: Animated lines showing information flow
- **Conflict States**: Red glitches when AIs disagree
- **Consensus States**: Blue crystalline convergence when AIs align

---

## 4. Target Users

### Primary Personas

#### 1. Professional Decision Makers
- **Profile**: Executives, managers, consultants
- **Use Cases**: Strategic decisions, vendor selection, market analysis
- **Pain Point**: Need confident AI-backed recommendations for business decisions

#### 2. Investors & Traders
- **Profile**: Retail investors, crypto enthusiasts, traders
- **Use Cases**: Investment analysis, market timing, portfolio allocation
- **Pain Point**: Want multiple perspectives on financial decisions

#### 3. Tech Professionals
- **Profile**: Developers, architects, product managers
- **Use Cases**: Tech stack decisions, architecture choices, tool evaluation
- **Pain Point**: Framework/language debates need objective multi-perspective analysis

#### 4. Life Decision Makers
- **Profile**: Individuals facing major choices
- **Use Cases**: Career moves, major purchases, relocation decisions
- **Pain Point**: High-stakes personal decisions need thorough analysis

---

## 5. Core Features

### 5.1 Multi-Model AI Debate Engine

| Feature | Description |
|---------|-------------|
| **4 AI Models** | GPT-4, Gemini, Claude, Grok |
| **3 Debate Rounds** | Initial positions, responses, final synthesis |
| **Devil's Advocate** | Optional mode for contrarian stress-testing |
| **Context Support** | Additional context/constraints for nuanced analysis |

### 5.2 Question Input System

| Feature | Description |
|---------|-------------|
| **Quick Templates** | Pre-built question templates (Investment, Career, Tech, Purchase, Strategy) |
| **Character Limits** | Question: 500 chars, Context: 300 chars |
| **Model Tier Selection** | Budget (faster) vs Premium (smarter) models |
| **How It Works** | Expandable educational section for new users |

### 5.3 Live Debate Visualization

| Feature | Description |
|---------|-------------|
| **Neural Arena** | Animated visualization of AI deliberation |
| **Activity Feed** | Real-time SSE streaming of debate progress |
| **AI Status Cards** | Individual model thinking/responding indicators |
| **Round Progress** | Visual indicator of debate progress (1/3, 2/3, 3/3) |

### 5.4 Verdict & Results

| Feature | Description |
|---------|-------------|
| **Decision Verdict** | YES / NO / CONDITIONAL / WAIT |
| **Consensus Gauge** | Visual agreement percentage |
| **AI Agreement Grid** | 2x2 grid showing each AI's position |
| **Spectrum Slider** | Position visualization (No to Yes scale) |
| **Attribution Heatmap** | Color-coded text showing which AI contributed each insight |
| **Action Plan** | Immediate actions, risks, prerequisites, success indicators |
| **Timeline** | Suggested implementation timeline |

### 5.5 Advanced Features

| Feature | Description |
|---------|-------------|
| **Follow-up Questions** | Ask follow-ups with previous context pre-loaded |
| **Full Transcript** | Complete debate history accessible |
| **Share Certificates** | Shareable verdict pages with CTAs |
| **Decision History** | Browse past debates (stored locally) |
| **Custom Tooltips** | Instant hover tooltips for UI elements |

### 5.6 Trust & Transparency

| Feature | Description |
|---------|-------------|
| **Bias Check Badge** | "Cross-referenced by 4 AI models" |
| **Position Tracking** | See how positions changed across rounds |
| **Individual Analysis** | Click any AI to see full reasoning |
| **Confidence Scores** | Each AI rates their confidence (1-10) |

---

## 6. User Flows

### 6.1 Primary Flow: New Debate

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

[Landing Page]
     │
     ▼
[Click "Start Debate" or "Try Free"]
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    QUESTION INPUT SCREEN                         │
│                                                                   │
│  1. Select Model Tier (Budget/Premium)                           │
│  2. Choose Template OR Write Custom Question                     │
│  3. (Optional) Add Context/Constraints                           │
│  4. (Optional) Enable Devil's Advocate                           │
│  5. Click "Start AI Debate"                                      │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DEBATE IN PROGRESS                            │
│                                                                   │
│  Neural Arena Animation:                                         │
│  - Core Orb pulsing in center                                    │
│  - AI Nodes glowing in corners                                   │
│  - Data streams flowing to center                                │
│                                                                   │
│  Activity Feed (Real-time SSE):                                  │
│  - "Debate started with 4 AI models"                             │
│  - "GPT-4 is analyzing..."                                       │
│  - "Claude: YES. Strong fundamentals..."                         │
│  - "Round 2 starting..."                                         │
│                                                                   │
│  AI Status Cards:                                                │
│  - [GPT: Thinking] [Gemini: YES] [Claude: Analyzing] [Grok: NO]  │
│                                                                   │
│  Duration: ~30-90 seconds                                        │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VERDICT SCREEN                              │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    AI CONSENSUS                            │  │
│  │                       [YES]                                │  │
│  │              All 4 AIs Agree (unanimous)                   │  │
│  │                                                            │  │
│  │  "Based on current market conditions and your long-term   │  │
│  │   horizon, Bitcoin represents a reasonable allocation..." │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Confidence Gauge: [████████░░] 82%                              │
│                                                                   │
│  AI Agreement Grid:                                              │
│  ┌─────────────┬─────────────┐                                   │
│  │ GPT-4 [YES] │ Gemini [YES]│                                   │
│  ├─────────────┼─────────────┤                                   │
│  │Claude [YES] │ Grok [YES]  │                                   │
│  └─────────────┴─────────────┘                                   │
│                                                                   │
│  Spectrum Slider:                                                │
│  NO ├────[C]──[Gm]──[G][Gk]─────────────────────────┤ YES       │
│                                                                   │
│  [Action Plan] [Key Risks] [Timeline] [Full Transcript]          │
│                                                                   │
│  Actions: [Copy Share Link] [Ask Follow-up] [New Debate]         │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Follow-up Question Flow

```
[Verdict Screen]
     │
     ▼
[Click "Ask Follow-up"]
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FOLLOW-UP INPUT                                │
│                                                                   │
│  Context Pre-loaded:                                             │
│  - Original question                                             │
│  - AI positions summary                                          │
│  - Key arguments                                                 │
│  - Consensus result                                              │
│                                                                   │
│  [Enter follow-up question...]                                   │
│  [Submit Follow-up]                                              │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
[New Debate with Context] → [New Verdict]
```

### 6.3 Share Flow

```
[Verdict Screen]
     │
     ▼
[Click "Copy Share Link"]
     │
     ▼
[Link copied: consensusai.app/share/abc123]
     │
     ▼
[Recipient Opens Link]
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SHARE PAGE                                   │
│                                                                   │
│  "Shared Decision" badge                                         │
│                                                                   │
│  QUESTION: "Should I invest in Bitcoin now?"                     │
│                                                                   │
│  VERDICT: [YES]                                                  │
│  All 4 AIs Agree                                                 │
│                                                                   │
│  AI Perspectives:                                                │
│  - GPT-4: YES. Strong fundamentals...                            │
│  - Gemini: YES. Adoption curve...                                │
│  - Grok: YES. Institutional...                                   │
│  - Claude: YES. Risk-adjusted...                                 │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │     Make Your Own AI-Powered Decision                       ││
│  │            [Try ConsensusAI Free →]                         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 History Flow

```
[Any Screen]
     │
     ▼
[Click "History" in Nav]
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HISTORY DRAWER                                │
│                                                                   │
│  Recent Decisions:                                               │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Dec 3: Should I invest in Bitcoin?                [YES]     ││
│  │ Dec 2: React vs Vue for new project               [COND]    ││
│  │ Dec 1: Should I learn Rust or Go?                 [YES]     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                   │
│  [Click any to view full details]                                │
└─────────────────────────────────────────────────────────────────┘
```

### 6.5 Authentication Flow (Optional)

```
[Landing Page]
     │
     ▼
[Click "Sign In"]
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLERK AUTH MODAL                              │
│                                                                   │
│  Sign in with:                                                   │
│  [Google] [GitHub] [Email]                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
[Authenticated - Pro features unlocked if subscribed]
```

---

## 7. Technical Architecture

### 7.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT                                   │
│                                                                   │
│  public/cortex.html    - Main debate UI (Living Cortex)         │
│  public/index.html     - Landing page                            │
│  public/share.html     - Shareable verdict page                  │
│                                                                   │
│  Tech: Vanilla HTML/CSS/JS, SSE for real-time updates           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/SSE
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER                                   │
│                                                                   │
│  server.js             - HTTP server, API routes, SSE           │
│  debate-engine.js      - Multi-round debate orchestration       │
│  prompts.js            - AI personas and prompt templates       │
│  auth.js               - Clerk authentication                    │
│  usage.js              - Rate limiting and usage tracking       │
│  history.js            - Decision storage                        │
│  config.js             - Configuration and tiers                │
│                                                                   │
│  Tech: Node.js, native HTTP module                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LLM CLIENTS                                 │
│                                                                   │
│  llm-clients/                                                    │
│  ├── openai.js         - GPT-4 / GPT-4o-mini                    │
│  ├── gemini.js         - Gemini Pro / Flash                      │
│  ├── anthropic.js      - Claude 3.5 Sonnet                       │
│  └── grok.js           - Grok Beta                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STORAGE                                     │
│                                                                   │
│  data/                                                           │
│  └── decisions/        - JSON files for debate results          │
│                                                                   │
│  decisions/            - Markdown exports of debates            │
│                                                                   │
│  (Note: Currently file-based, planned migration to database)    │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/config` | GET | Get model tiers, usage stats, auth config |
| `/api/debate` | POST | Start a new debate (SSE response) |
| `/api/debate/:id` | GET | Get debate result by ID |
| `/api/history` | GET | Get user's debate history |
| `/api/usage` | GET | Get usage statistics |
| `/api/auth/me` | GET | Get current user info |
| `/api/auth/config` | GET | Get Clerk publishable key |
| `/share/:id` | GET | Public share page |

### 7.3 Debate Engine Flow

```
1. INITIALIZATION
   - Validate question
   - Check rate limits
   - Select model tier (budget/premium)
   - Initialize SSE connection

2. ROUND 1: INITIAL POSITIONS
   - Send question to all 4 AIs in parallel
   - Each AI returns: decision, confidence, key argument, full position
   - Stream updates via SSE

3. ROUND 2: RESPONSES
   - Share Round 1 positions with all AIs
   - Each AI critiques and responds
   - May change position based on arguments
   - Stream updates via SSE

4. ROUND 3: FINAL SYNTHESIS
   - Share all arguments
   - Final positions locked
   - Stream updates via SSE

5. CONSENSUS CALCULATION
   - Count positions (YES/NO/CONDITIONAL/WAIT)
   - Calculate agreement percentage
   - Determine verdict
   - Generate synthesis summary
   - Create action plan

6. RESULT DELIVERY
   - Save to history
   - Return final verdict object
   - Close SSE connection
```

### 7.4 Data Models

#### Debate Result Object
```javascript
{
  id: "2025-12-03-should-i-invest-in-bitcoin",
  timestamp: "2025-12-03T15:30:00Z",
  question: "Should I invest in Bitcoin?",
  context: "I have $5000 to invest...",
  settings: {
    tier: "BUDGET",
    devilAdvocate: false
  },
  rounds: [
    {
      round: 1,
      responses: [
        {
          model: "gpt",
          decision: "YES",
          confidence: 8,
          keyArgument: "Strong institutional adoption...",
          fullPosition: "..."
        },
        // ... other models
      ]
    },
    // ... rounds 2, 3
  ],
  verdict: {
    decision: "YES",
    consensus: "unanimous",
    agreementPct: 100,
    summary: "All 4 AIs recommend...",
    synthesis: "Based on the collective analysis...",
    actionPlan: {
      immediate: ["Set up exchange account", "..."],
      risks: ["Volatility", "..."],
      prerequisites: ["Emergency fund", "..."],
      successIndicators: ["..."],
      timeline: "Start within 1-2 weeks..."
    }
  },
  stats: {
    totalTokens: 12500,
    durationMs: 45000
  }
}
```

---

## 8. Design System

### 8.1 Visual Theme: "Bioluminescent Neural Arena"

The design creates a sense of living, breathing intelligence through:
- **Deep space backgrounds** (#030304)
- **Glassmorphism panels** with blur effects
- **Neon glow effects** for AI brand colors
- **Breathing animations** for the central core

### 8.2 Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-deep` | #030304 | Main background |
| `--core-primary` | #6366f1 | Primary accent (indigo) |
| `--ai-gpt` | #10A37F | OpenAI green |
| `--ai-gemini` | #4285f4 | Google blue |
| `--ai-claude` | #D97706 | Anthropic amber |
| `--ai-grok` | #f97316 | xAI orange |
| `--success` | #10B981 | YES / Agreement |
| `--warning` | #F59E0B | CONDITIONAL |
| `--error` | #EF4444 | NO / Conflict |

### 8.3 Typography

| Element | Font | Size |
|---------|------|------|
| Hero | Space Grotesk | 3.5rem |
| Section Title | Space Grotesk | 1.5rem |
| Body | Inter | 1rem |
| Code/Data | JetBrains Mono | 0.875rem |

### 8.4 Key Animations

- **Core Breathe**: 4s scale pulsing on central orb
- **Data Stream**: Animated dashed lines from AI nodes to center
- **Card Fly-in**: Cards animate from corners during debate
- **Glitch Effect**: Red vibration for conflict states
- **Skeleton Loading**: Gradient pulse for loading states

*Full design specifications: See `CORTEX-UI-UX-SPEC.md`*

---

## 9. Business Model & Pricing

### 9.1 Freemium Model

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 3 debates/day, Budget models, Basic features |
| **Pro** | $10/month | Unlimited debates, Premium models, Priority support |
| **Enterprise** | Custom | Custom integrations, SLA, dedicated support |

### 9.2 Model Tiers

| Tier | Models Used | Speed | Quality |
|------|-------------|-------|---------|
| **Budget** | GPT-4o-mini, Gemini Flash, Grok Beta, Claude Haiku | Fast (~30s) | Good |
| **Premium** | GPT-4o, Gemini Pro, Grok, Claude Sonnet | Slower (~90s) | Best |

### 9.3 Cost Structure (Estimated per Debate)

| Tier | API Cost | Margin @ $0.33/debate |
|------|----------|----------------------|
| Budget | ~$0.02-0.05 | 85%+ |
| Premium | ~$0.15-0.25 | 25-50% |

### 9.4 Revenue Projections

| Metric | Conservative | Moderate | Aggressive |
|--------|--------------|----------|------------|
| Monthly Active Users | 1,000 | 5,000 | 20,000 |
| Pro Conversion | 2% | 3% | 5% |
| Pro Subscribers | 20 | 150 | 1,000 |
| Monthly Revenue | $200 | $1,500 | $10,000 |

---

## 10. Competitive Analysis

### 10.1 Direct Competitors

| Competitor | Approach | Weakness vs ConsensusAI |
|------------|----------|------------------------|
| ChatGPT | Single model | No cross-validation |
| Claude.ai | Single model | No cross-validation |
| Gemini | Single model | No cross-validation |
| Perplexity | Search + AI | Not multi-model debate |

### 10.2 Indirect Competitors

| Competitor | Approach | Weakness vs ConsensusAI |
|------------|----------|------------------------|
| Manual comparison | User queries multiple AIs | Tedious, no synthesis |
| TypingMind/Poe | Model switching | No debate, no synthesis |

### 10.3 ConsensusAI Moat

1. **Multi-round debate engine**: Proprietary orchestration logic
2. **Living Cortex UI**: Unique visualization experience
3. **Attribution transparency**: Shows which AI contributed what
4. **Interactive timeline**: Scrub through debate rounds

---

## 11. Current Status

**Last Updated:** December 9, 2025
**Status:** Ready for Production Deployment

### 11.1 Completed Features

#### Core Platform
- [x] Multi-AI debate engine (4 models: GPT, Claude, Gemini, Grok)
- [x] 3-round debate with position evolution
- [x] Living Cortex UI visualization
- [x] Real-time SSE streaming
- [x] Devil's Advocate mode
- [x] Follow-up question system
- [x] Share functionality
- [x] Decision history (localStorage)
- [x] Custom tooltips
- [x] Usage tracking & rate limiting
- [x] Clerk authentication (optional)
- [x] Model tier selection (Budget/Premium)
- [x] AI Panel settings (model selection, personas)
- [x] Comparison question detection

#### Production Infrastructure
- [x] Stripe payment integration (checkout, webhooks, portal)
- [x] Sentry error monitoring integration
- [x] PostHog analytics integration
- [x] SEO (meta tags, Open Graph, sitemap, robots.txt)
- [x] API test suite (30 tests)
- [x] CI/CD pipeline (GitHub Actions)
- [x] Vercel deployment configuration
- [x] Marketing automation agent

### 11.2 Production Gaps (Remaining)

| Priority | Gap | Status |
|----------|-----|--------|
| HIGH | Vercel deployment | Ready - needs deploy command |
| HIGH | Stripe webhook setup | After deployment |
| MEDIUM | Sentry DSN configuration | Needs account setup |
| MEDIUM | Email capture modal | Phase 2 |
| LOW | Real database (PostgreSQL) | Phase 2 |
| LOW | Mobile optimization | Partial |

### 11.3 Environment Configuration Required

```bash
# Production environment variables needed:
STRIPE_WEBHOOK_SECRET=whsec_...  # After webhook creation
SENTRY_DSN=https://...          # From Sentry dashboard
POSTHOG_API_KEY=phc_...         # From PostHog dashboard
```

---

## 12. Roadmap

### Phase 1: Launch ✅ (Current)
- [x] Stripe integration for Pro tier
- [x] SEO optimization
- [x] Test suite
- [x] CI/CD pipeline
- [x] Vercel deployment config
- [ ] Deploy to production
- [ ] Configure Stripe webhook
- [ ] Manual end-to-end testing

### Phase 2: Growth Features
- [ ] Email capture modal
- [ ] User accounts with saved preferences
- [ ] PostgreSQL/Supabase database migration
- [ ] Email notifications (welcome, weekly digest)
- [ ] Cost tracking dashboard
- [ ] Mobile optimization

### Phase 3: Platform Expansion
- [ ] Team/organization features
- [ ] API access for developers
- [ ] Chrome extension
- [ ] Slack/Discord integration
- [ ] Twitter marketing automation

### Phase 4: Scale
- [ ] Enterprise SSO
- [ ] White-label offering
- [ ] Voice input
- [ ] Document analysis
- [ ] Decision templates marketplace

---

## Appendix

### A. File Structure

```
consensus-platform/
├── public/
│   ├── cortex.html      # Main debate UI
│   ├── index.html       # Landing page
│   ├── share.html       # Share page
│   ├── disclaimer.html  # Legal
│   ├── privacy.html     # Privacy policy
│   └── terms.html       # Terms of service
├── llm-clients/
│   ├── openai.js
│   ├── gemini.js
│   ├── anthropic.js
│   └── grok.js
├── data/
│   └── decisions/       # JSON storage
├── decisions/           # Markdown exports
├── server.js            # HTTP server
├── debate-engine.js     # Debate orchestration
├── prompts.js           # AI prompts
├── auth.js              # Clerk auth
├── usage.js             # Rate limiting
├── history.js           # History management
└── config.js            # Configuration
```

### B. Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
ANTHROPIC_API_KEY=sk-ant-...
XAI_API_KEY=xai-...

# Optional (for auth)
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

### C. Running Locally

```bash
cd /Users/hirakbanerjee/Desktop/consensus-platform
node server.js
# Open http://localhost:3000
# Cortex UI: http://localhost:3000/cortex.html
```

### D. Related Documents

| Document | Description |
|----------|-------------|
| `CORTEX-UI-UX-SPEC.md` | Complete UI/UX specification |
| `UI-UX-REVIEW.md` | Design system review |
| `DESIGN-SPEC-2.0.md` | Design philosophy |
| `TODO-NEXT.md` | Production gaps |
| `SESSION-2025-12-03.md` | Recent development session |

---

*Document generated: December 5, 2025*
*Product: ConsensusAI - Multi-LLM Decision Intelligence Platform*
