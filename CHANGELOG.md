# Changelog

All notable changes to ConsensusAI are documented in this file.

## [1.2.0] - 2025-12-09

### Added
- **Stripe Payment Integration**: Full checkout, webhooks, and customer portal
- **SEO Optimization**: Meta tags, Open Graph, Twitter cards, sitemap.xml, robots.txt
- **API Test Suite**: 30 automated tests with `npm test`
- **CI/CD Pipeline**: GitHub Actions for automated testing and deployment
- **Marketing Agent**: Automated Twitter posting (`agents/marketing-agent.js`)
- **Vercel Deployment**: Ready-to-deploy configuration
- **Deployment Guide**: Comprehensive `DEPLOY-GUIDE.md`

### Changed
- Updated documentation to reflect production-ready status
- Improved Stripe price configuration with environment variables

## [1.1.0] - 2025-12-05

### Added
- **AI Panel Settings**: Users can select which AI models participate (2-4)
- **Custom Personas**: Configurable debate approach per AI model
- **Comparison Questions**: Intelligent detection of "A vs B" questions
- **3D Node Enhancement**: Improved visual depth with glows and shadows
- **Sentry Integration**: Error monitoring code (needs DSN configuration)
- **PostHog Integration**: Analytics tracking (needs API key configuration)

### Fixed
- Post-debate UI visibility issues
- Followup section reset behavior
- Z-index layering for AI nodes

## [1.0.0] - 2025-12-03

### Added
- **Living Cortex UI**: Complete neural arena visualization
- **Follow-up Questions**: Context-aware follow-up system
- **Custom Tooltips**: CSS tooltips replacing native browser tooltips
- **SSE Streaming**: Real-time debate progress updates
- **Share Functionality**: Shareable verdict pages at `/share/:id`

### Fixed
- Verdict panel reset for consistency
- Tactical drawer visibility after debate
- Timeline scrubber cleanup

## [0.9.0] - 2025-12-02

### Added
- **Persona System**: Each LLM has distinct analytical personality
- **Token Logging**: Track token usage with warnings
- **Share Pages**: Public `/share/:id` routes

## [0.8.0] - 2025-12-01

### Added
- Multi-AI debate engine with 4 models (GPT, Claude, Gemini, Grok)
- 3-round debate system with position evolution
- Devil's Advocate mode
- Model tier selection (Budget/Premium)
- Usage tracking and rate limiting
- Clerk authentication (optional)
- Decision history with local storage

---

## Version History

| Version | Date | Status |
|---------|------|--------|
| 1.2.0 | Dec 9, 2025 | Production Ready |
| 1.1.0 | Dec 5, 2025 | Feature Complete |
| 1.0.0 | Dec 3, 2025 | MVP Complete |
| 0.9.0 | Dec 2, 2025 | Beta |
| 0.8.0 | Dec 1, 2025 | Alpha |
