# ConsensusAI - UI/UX Design Review Document

## Product Overview

**ConsensusAI** is a web-based SaaS platform that facilitates multi-AI debates for decision-making. Unlike simple AI comparison tools, our AIs actively debate each other, read and critique positions, and work toward consensus over multiple rounds.

**Target Users:** Professionals, entrepreneurs, and individuals making important decisions (investments, career moves, tech choices, purchases, strategy).

**Business Model:** Freemium with Pro tier ($10/month for unlimited debates).

---

## Design System

### Color Palette

```css
/* Background Colors (Dark Theme) */
--bg-primary: #09090b;      /* Main background - near black */
--bg-secondary: #0f0f11;    /* Card backgrounds */
--bg-tertiary: #18181b;     /* Elevated surfaces */
--bg-card: rgba(255, 255, 255, 0.02);  /* Glassmorphism cards */

/* Text Colors */
--text-primary: #fafafa;    /* Headings, important text */
--text-secondary: #a1a1aa;  /* Body text */
--text-tertiary: #71717a;   /* Muted/helper text */

/* Brand/Accent Colors */
--accent-primary: #6366f1;   /* Indigo - primary actions */
--accent-secondary: #8b5cf6; /* Violet - gradients */
--accent-tertiary: #a855f7;  /* Purple - gradients */
--accent-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);

/* Semantic Colors */
--success: #10b981;  /* Green - consensus reached, YES decisions */
--warning: #f59e0b;  /* Amber - conditional, split decisions */
--error: #ef4444;    /* Red - NO decisions, errors */
--info: #3b82f6;     /* Blue - informational */

/* LLM Brand Colors */
--gpt-color: #10a37f;     /* OpenAI green */
--gemini-color: #4285f4;  /* Google blue */
--grok-color: #f97316;    /* xAI orange */
--claude-color: #d97706;  /* Anthropic amber */
```

### Typography

```css
/* Primary Font */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Monospace (for technical content) */
font-family: 'JetBrains Mono', monospace;

/* Font Weights Used */
300 - Light
400 - Regular
500 - Medium
600 - Semibold
700 - Bold
800 - Extrabold (hero headings only)

/* Key Sizes */
Hero title: clamp(2.5rem, 5vw, 4rem)
Section titles: 1.25rem - 1.5rem
Body text: 0.875rem - 1rem
Small text: 0.75rem - 0.8125rem
Micro text: 0.625rem - 0.6875rem
```

### Spacing & Radius

```css
/* Border Radius */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-2xl: 28px;

/* Common spacing: 0.25rem increments (4px base) */
/* Padding examples: 0.5rem, 0.75rem, 1rem, 1.25rem, 1.5rem, 2rem */
```

### Effects & Shadows

```css
/* Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5);
--shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.6);
--shadow-glow: 0 0 80px rgba(99, 102, 241, 0.12);

/* Transitions */
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
--transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);

/* Backdrop blur for glassmorphism */
backdrop-filter: blur(20px);
```

---

## User Flow

### 1. Landing Page (Hero)
```
[Logo: ConsensusAI] ─────────────── [Debate] [History] [Pricing] [Auth]

                    "3 AI Models Active" badge

        Make Better Decisions with ConsensusAI

    "Unlike side-by-side comparisons, our AIs debate each other.
     They read, critique, and refine positions until consensus."

              [Stats: Decisions | Consensus Rate | Avg Cost]
```

### 2. Question Input Form
```
┌─────────────────────────────────────────────────────────────┐
│  [How It Works - First time? Click to learn]           [v] │
├─────────────────────────────────────────────────────────────┤
│  Model Tier: [$ Budget] [✓] [$$ Premium]                    │
│              gpt-4o-mini | gemini-flash | grok-beta         │
├─────────────────────────────────────────────────────────────┤
│  Quick Templates:                                            │
│  [📈 Investment] [💼 Career] [💻 Tech Stack]                │
│  [🛒 Purchase] [🎯 Strategy] [⭐ Custom]                    │
├─────────────────────────────────────────────────────────────┤
│  Your Decision or Question:                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ e.g., Should I invest in Bitcoin now...             │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                   0/500     │
├─────────────────────────────────────────────────────────────┤
│  Context & Constraints (Optional):                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ e.g., I have $5000 to invest...                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                   0/300     │
├─────────────────────────────────────────────────────────────┤
│  Debate Settings:                                            │
│  [ ] Devil's Advocate Mode                                   │
│      One AI challenges the majority to stress-test           │
│  [✓] Show All Positions                                      │
│      Display every unique viewpoint                          │
├─────────────────────────────────────────────────────────────┤
│           [⚡ Start AI Debate - 3 Rounds (~2 min)]          │
└─────────────────────────────────────────────────────────────┘
```

### 3. Debate In Progress (Live Activity Feed)
```
┌─────────────────────────────────────────────────────────────┐
│  AI Debate in Progress        [● LIVE]  Round ●○○ (1/3)    │
├─────────────────────────────────────────────────────────────┤
│  Activity Feed:                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [🟢] Debate started with 4 AI models        12:01   │    │
│  │ [GPT] GPT-4 is analyzing...                 12:01   │    │
│  │ [GEM] Gemini is analyzing...                12:01   │    │
│  │ [GRK] Grok is analyzing...                  12:02   │    │
│  │ [CLD] Claude: YES. Strong fundamentals...   12:03   │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   GPT-4     │ │   Gemini    │ │    Grok     │           │
│  │  gpt-4o-mini│ │ gemini-flash│ │  grok-beta  │           │
│  │  [Thinking] │ │ [Thinking]  │ │    YES      │           │
│  │             │ │             │ │  Conf: 8/10 │           │
│  │             │ │             │ │ "Bitcoin's  │           │
│  │             │ │             │ │ adoption..."│           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 4. Results Page (Verdict)
```
┌─────────────────────────────────────────────────────────────┐
│                    ✦ AI CONSENSUS ✦                         │
│                                                              │
│                    [🟢 Checkmark Icon]                       │
│                                                              │
│                         YES                                  │
│                  (gradient text, huge)                       │
│                                                              │
│               ✓ All 4 AIs Agree (unanimous)                 │
│                                                              │
│    "Based on current market conditions and your long-term   │
│     horizon, Bitcoin represents a reasonable allocation..."  │
├─────────────────────────────────────────────────────────────┤
│  Confidence Gauge:  [████████░░] 82%                        │
│                     High confidence across all models        │
├─────────────────────────────────────────────────────────────┤
│  AI Agreement:                                               │
│  [GPT][GEM][GRK][CLD]  All 4 AIs reached consensus          │
│                                                              │
│  Key Insights:                                               │
│  • Long-term fundamentals remain strong                      │
│  • Dollar-cost averaging reduces timing risk                 │
│  • Consider 5-10% portfolio allocation max                   │
├─────────────────────────────────────────────────────────────┤
│  [📋 Copy Share Link]  [💬 Ask Follow-up]  [🔄 New Debate]  │
└─────────────────────────────────────────────────────────────┘
```

### 5. Action Plan Section
```
┌─────────────────────────────────────────────────────────────┐
│  [📋] Your Action Plan                                       │
│       AI-generated recommendations                           │
├─────────────────────────────────────────────────────────────┤
│  Executive Summary:                                          │
│  "Proceed with a measured Bitcoin investment using DCA..."   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ ✓ Immediate      │  │ ⚠ Key Risks     │                 │
│  │ • Set up account │  │ • Volatility    │                 │
│  │ • Plan DCA       │  │ • Regulatory    │                 │
│  │ • Set limits     │  │ • Market timing │                 │
│  └──────────────────┘  └──────────────────┘                 │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ ℹ Before You     │  │ ★ Success       │                 │
│  │ • Emergency fund │  │ • Stick to plan │                 │
│  │ • Risk tolerance │  │ • Review yearly │                 │
│  └──────────────────┘  └──────────────────┘                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ⏱ Suggested Timeline: Start within 1-2 weeks...        ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 6. Share Page (/share/:id)
```
┌─────────────────────────────────────────────────────────────┐
│              [C] ConsensusAI                                 │
│              "Shared Decision" badge                         │
├─────────────────────────────────────────────────────────────┤
│  QUESTION ASKED:                                             │
│  "Should I invest in Bitcoin now or wait for a dip?"        │
├─────────────────────────────────────────────────────────────┤
│                    [🟢]                                      │
│                    YES                                       │
│            ✓ All 4 AIs Agree                                │
│                                                              │
│  "Based on current market conditions..."                     │
├─────────────────────────────────────────────────────────────┤
│  AI Perspectives:                                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ GPT-4    │ YES. Strong fundamentals...    [███░░]   │    │
│  │ Gemini   │ YES. Adoption curve...         [████░]   │    │
│  │ Grok     │ YES. Institutional...          [████░]   │    │
│  │ Claude   │ YES. Risk-adjusted...          [███░░]   │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│       Make Your Own AI-Powered Decision                      │
│    Get consensus from 4 leading AI models on any question    │
│                                                              │
│              [Try ConsensusAI Free →]                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Library

### 1. Buttons
- **Primary**: Gradient background (indigo→violet→purple), white text, glow shadow
- **Secondary**: Dark background, border, white text
- **Ghost**: Transparent, appears on hover

### 2. Cards
- Semi-transparent background with subtle border
- Rounded corners (16-28px)
- Hover effects: lift + border highlight

### 3. Form Inputs
- Dark background (#0f0f11)
- Subtle border, focus ring on interaction
- Character counters

### 4. LLM Avatar Pills
- Circular with brand color background
- Used in activity feed and agreement section
- Stacked with negative margin for grouped display

### 5. Decision Badges
- YES: Green gradient border + background
- NO: Red gradient border + background
- CONDITIONAL: Amber gradient
- WAIT: Purple gradient

### 6. Progress Indicators
- Round dots for debate progress
- Spinner for loading states
- Confidence bars (horizontal fill)

### 7. Modals
- Centered, max-width constrained
- Dark backdrop with blur
- Sticky header with close button

---

## Animation Details

### Micro-interactions
```css
/* Floating background orbs */
@keyframes float1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(50px, 30px); } }

/* Live pulse indicator */
@keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

/* Card update highlight */
@keyframes cardUpdate {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
  50% { transform: scale(1.02); box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.3); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
}

/* Typing indicator */
@keyframes typingBounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-4px); }
}

/* Result pop-in */
@keyframes resultPop {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
```

---

## Current Screenshots Description

Since I cannot provide actual screenshots, here's what each screen looks like:

### Landing/Hero
- Dark background with animated purple/indigo gradient orbs
- Subtle grid overlay pattern
- Centered hero with gradient text
- Floating "3 AI Models Active" badge with pulsing dot

### Question Form
- Main card with glassmorphism effect
- 6 template buttons in grid (2x3 on mobile, 6x1 on desktop)
- Expandable "How It Works" section
- Toggle-style tier selector (Budget/Premium)
- Large gradient CTA button

### Debate in Progress
- Activity feed with real-time SSE updates
- 4 LLM cards in grid layout
- Each card shows: avatar, name, model ID, status/position
- Live indicator badge (red pulsing dot)
- Round progress dots (●○○)

### Results
- Large verdict section with icon + decision text
- Consensus badge (green for unanimous, amber for split)
- Confidence gauge (circular progress)
- Stacked AI avatars showing agreement
- Action plan grid (2x2 sections)

### Share Page
- Simplified version of results
- Public-facing, marketing-focused
- CTA to try the product

---

## Questions for Reviewer

1. **Visual Hierarchy**: Is the decision verdict prominent enough? Does the eye flow naturally from question → verdict → action plan?

2. **Color Usage**: Are the LLM brand colors (green, blue, orange, amber) harmonious with our indigo/violet accent palette?

3. **Information Density**: The results page has a lot of information. Should we progressive-disclose more content?

4. **Mobile Experience**: Key breakpoints are at 768px and 600px. Any concerns about touch targets or readability?

5. **Glassmorphism**: We use subtle backdrop-blur and transparency. Does this feel modern or dated?

6. **Animation**: Are the animations (floating orbs, typing indicators, card highlights) enhancing or distracting?

7. **Dark Theme Only**: We only support dark mode. Should we consider a light theme option?

8. **Trust Signals**: How can we better convey that this is a legitimate, trustworthy service?

9. **Onboarding**: The "How It Works" section is collapsed by default. Is this sufficient for first-time users?

10. **Share Page**: Does the share page effectively convert visitors to try the product?

---

## Technical Notes

- **Single HTML file**: All CSS is inline (~3200 lines of styles)
- **No framework**: Vanilla HTML/CSS/JS
- **Responsive**: Flexbox and CSS Grid based
- **SSE**: Real-time updates via Server-Sent Events
- **Font loading**: Google Fonts (Inter, JetBrains Mono)

---

## How to Test Locally

```bash
cd /Users/hirakbanerjee/Desktop/consensus-platform
node server.js
# Open http://localhost:3000
# Share page: http://localhost:3000/share/[any-id]
```

---

*Document prepared for Gemini UI/UX review - December 2024*
