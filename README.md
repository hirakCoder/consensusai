# ConsensusAI

**4 AI Models Debate Your Decisions**

[![CI/CD](https://github.com/YOUR_USERNAME/consensus-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/consensus-platform/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Don't just ask one AI. Let GPT-4, Claude, Gemini, and Grok debate your question and reach consensus.

![ConsensusAI Demo](https://consensusai.app/og-image.png)

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

### Prerequisites

- Node.js 18+
- API keys for: OpenAI, Anthropic, Google AI, xAI

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/consensus-platform.git
cd consensus-platform

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

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
consensus-platform/
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

- **Website**: https://consensusai.app
- **Documentation**: [BUSINESS-DOCUMENT.md](BUSINESS-DOCUMENT.md)
- **Deploy Guide**: [DEPLOY-GUIDE.md](DEPLOY-GUIDE.md)

---

Built with AI, for better AI-assisted decisions.
