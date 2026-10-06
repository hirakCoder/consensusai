# ConsensusAI

> **Status: archived (January 2026).** A multi-LLM debate engine I built solo between December 2025 and January 2026 and shelved before launch to focus on other products. The code, the Playwright/Puppeteer UAT suite and the CI runner are kept as-is as a reference; the hosted app and consensusai.live are no longer online.

**4 AI Models Debate Your Decisions**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Don't just ask one AI. Let GPT-4, Claude, Gemini, and Grok debate your question and reach consensus.

![ConsensusAI](public/og-image.png)

## What is ConsensusAI?

ConsensusAI is a multi-AI debate platform that helps you make better decisions. Instead of asking one AI and hoping it's right, ConsensusAI orchestrates **4 leading AI models** to:

1. **Analyze independently** - Each AI forms its own position
2. **Debate each other** - AIs read and critique each other's arguments
3. **Reach consensus** - A unified recommendation emerges from the debate

### Why Multi-AI?

| Single AI | ConsensusAI |
|-----------|-------------|
| One perspective | 4 perspectives |
| Hidden biases | Cross-validated |
| "Trust me" | See the reasoning |
| May hallucinate | Models correct each other |

## Features

- **4 AI Models**: GPT-4, Claude, Gemini, Grok
- **3-Round Debates**: Positions evolve through argumentation
- **Living Cortex UI**: Neural arena visualization
- **Devil's Advocate Mode**: Stress-test your decisions
- **Real-time Streaming**: Watch the debate unfold
- **Shareable Results**: Share verdict links
- **Follow-up Questions**: Dig deeper with context

## Quick Start

### Bring your own keys

This repository ships **no API keys, no database and no hosted service**. Everything that talks to a third party is read from environment variables at start-up (see `config.js`):

| Variable | Used by | Required? |
|---|---|---|
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `XAI_API_KEY` | `llm-clients/` — the four debaters | Yes, at least one; the debate runs with whichever models have keys |
| `DATABASE_URL` | `db.js` — Postgres for users and debate history | Optional; without it history is in-memory |
| `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | `auth.js` | Optional; auth is skipped when unset |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_WEBHOOK_SECRET` | `stripe.js` — Pro tier | Optional |
| `SENTRY_DSN`, `POSTHOG_API_KEY` | `sentry.js`, `analytics.js` | Optional |
| `ADMIN_SECRET` (or `OWNER_SECRET`), `ADMIN_EMAILS`, `OWNER_IPS` | `server.js`, `usage.js` — admin endpoints and unlimited usage for the owner | Optional; admin routes are disabled when unset |

Create your own accounts with each provider, put the keys in a local `.env` (copy `.env.example`), and never commit that file — `.gitignore` already excludes it. Any key, price ID or project reference that appears in the docs is a placeholder or an example from the original deployment, which has been shut down and whose credentials were revoked; none of them will work.

### Prerequisites

- Node.js 18+
- API keys for: OpenAI, Anthropic, Google AI, xAI

### Installation

```bash
# Clone the repository
git clone https://github.com/hirakCoder/consensusai.git
cd consensusai

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with YOUR OWN API keys (see 'Bring your own keys' above)

# Start the server
npm start
```

### Environment Variables

```bash
# Required - AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
XAI_API_KEY=xai-...

# Optional - Auth & Payments
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...

# Optional - Monitoring
SENTRY_DSN=https://...
POSTHOG_API_KEY=phc_...
```

### Usage

1. Open http://localhost:3000/cortex.html
2. Enter your decision question
3. Watch 4 AIs debate
4. Get your consensus verdict

## Tech Stack

- **Backend**: Node.js (native HTTP)
- **Frontend**: Vanilla HTML/CSS/JS
- **AI Models**: OpenAI, Anthropic, Google, xAI
- **Auth**: Clerk (optional)
- **Payments**: Stripe
- **Monitoring**: Sentry, PostHog

## Project Structure

```
consensusai/
├── server.js           # HTTP server & API routes
├── debate-engine.js    # Multi-round debate orchestration
├── prompts.js          # AI personas & prompt templates
├── llm-clients/        # AI provider integrations
│   ├── openai.js
│   ├── claude.js
│   ├── gemini.js
│   └── grok.js
├── public/             # Frontend
│   ├── cortex.html     # Main UI
│   └── share.html      # Shareable results
├── agents/             # Automation agents
│   └── marketing-agent.js
├── tests/              # Test suite
└── .github/workflows/  # CI/CD
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/debate` | POST | Start a new debate |
| `/api/debate/:id` | GET | Get debate result |
| `/api/config` | GET | Get configuration |
| `/api/tier` | GET/POST | Model tier selection |
| `/api/history` | GET | Decision history |
| `/api/stripe/checkout` | POST | Create checkout session |

## Testing

The part of this repo most worth reading if you care about quality engineering:

- `tests/` — unit tests for content moderation and API resilience (no LLM calls).
- `test-uat-desktop.js`, `test-uat-mobile.js` — Playwright end-to-end UAT flows (home, debate, verdict, follow-up, history, settings).
- `test-mobile-viewports.js`, `test-galaxy-fold-debate.js` — viewport checks on iPhone SE / 14 / 14 Pro Max, Pixel 7 and Galaxy Fold.
- `test-ci-runner.js` — one runner with `smoke`, `mobile`, `desktop`, `security` and `full` modes; `test-results/` holds the screenshots it produced.

```bash
npm run test:unit     # offline
npm run test:smoke    # needs a running server
npm run test:uat      # desktop + mobile UAT
```

## Development

```bash
# Run in development
npm run dev

# Run tests
npm test

# Setup Stripe products
npm run setup-stripe
```

## Deployment

See [DEPLOY-GUIDE.md](DEPLOY-GUIDE.md) for detailed deployment instructions.

### Quick Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

## Pricing

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | 3 debates/day, budget models |
| **Pro** | $19/mo | Unlimited debates, premium models |

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- **Author**: Hirak Banerjee — [hirakcoder.github.io](https://hirakcoder.github.io)
- **Documentation**: [BUSINESS-DOCUMENT.md](BUSINESS-DOCUMENT.md)
- **Deploy Guide**: [DEPLOY-GUIDE.md](DEPLOY-GUIDE.md)

---

Built with AI, for better AI-assisted decisions.
