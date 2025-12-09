# ConsensusAI "Living Cortex" - Complete UI/UX Specification

**Version:** 2.1 (December 2024)
**Theme:** Bioluminescent Neural Arena

---

## 1. Design Philosophy

### Core Metaphor: "The Living Liquid"
The UI represents a neural network coming alive. Instead of static interfaces, we use **Glow & Blur** effects to create a sense of living, breathing intelligence.

- **The Core:** A central "Synthesis Orb" that pulses with neural activity
- **The AIs:** Energy streams that pour into and interact with the center
- **Conflict:** Red static/glitch effects when AIs disagree
- **Consensus:** Crystalline convergence when AIs align

### Differentiation
While competitors show static text lists, ConsensusAI shows **collision and synthesis** - making the decision-making process visible and engaging.

---

## 2. Color System (CSS Variables)

### Deep Space Theme
```css
:root {
    /* BACKGROUNDS */
    --bg-deep: #030304;           /* Near-black background */
    --bg-panel: #0a0a0f;          /* Panel background */
    --glass-surface: rgba(255, 255, 255, 0.03);
    --glass-border: rgba(255, 255, 255, 0.08);
    --glass-glow: rgba(255, 255, 255, 0.05);

    /* BRAND ACCENTS (Neural Colors) */
    --core-primary: #6366f1;      /* Indigo - The Consensus */
    --core-glow: rgba(99, 102, 241, 0.5);

    /* AI IDENTITY COLORS */
    --ai-gpt: #10A37F;            /* OpenAI Green */
    --ai-gemini: #4285f4;         /* Google Blue */
    --ai-claude: #D97706;         /* Anthropic Amber */
    --ai-grok: #f97316;           /* xAI Orange */

    /* SEMANTIC STATUS */
    --success: #10B981;           /* Green - Agreement/Yes */
    --warning: #F59E0B;           /* Amber - Conditional */
    --error: #EF4444;             /* Red - Disagreement/No */
    --info: #3B82F6;              /* Blue - Wait/Info */

    /* TYPOGRAPHY */
    --font-hero: 'Space Grotesk', sans-serif;  /* Headlines */
    --font-body: 'Inter', sans-serif;          /* Body text */
    --font-mono: 'JetBrains Mono', monospace;  /* Code/Data */

    --text-primary: #EDEDED;
    --text-secondary: #B8B8B8;
    --text-muted: #888888;
}
```

---

## 3. Screen Flow & Components

### Screen A: Input ("The Ignition")

#### Layout
- Centralized, minimal design
- No navigation bars - pure focus on input
- Animated nebula fog background (subtle shifting)

#### The Omni-Bar
A floating glass input bar (600px wide on desktop):

**States:**
1. **Idle:** Displays "Ask the Council..."
2. **Typing:** 4 small colored lights orbit the input bar (AI indicators)
3. **Focused:** Subtle glow appears around the bar

#### Quick Template Chips (NEW - Gemini Feedback)
Holographic pill-shaped buttons below the input bar to help users get started:

**Chips:**
- Crypto Analysis - "Should I invest in Bitcoin right now?"
- Career Move - "Should I switch jobs for a 20% salary increase?"
- Tech Stack - "React vs Vue vs Svelte for a new project?"
- Life Decision - "Is buying a house better than renting in 2024?"

**Behavior:**
- On click: Chip animates with "dissolve" effect
- Question populates input field
- All chips fade out and hide
- Re-appear when input is cleared

```css
@keyframes chipDissolve {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.95) translateY(-5px); }
    100% { opacity: 0; transform: scale(0.8) translateY(-20px); }
}
```

#### Devil's Advocate Toggle (NEW - Gemini Feedback)
Toggle switch in bottom-left corner that enables "Devil's Advocate" mode:

**Visual:**
- Small toggle switch with devil emoji icon
- Off state: Muted colors, subtle appearance
- On state: Red glow effect, animated icon

**Behavior:**
- When enabled, adds challenge/contrarian perspective to debate
- Disables during active debate
- Sends `devilAdvocate: true` to backend

```css
.devil-toggle input:checked + .devil-switch {
    background: rgba(239, 68, 68, 0.3);
    border-color: var(--error);
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);
}
```

**CSS Animation:**
```css
@keyframes pulse-glow {
    0% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.2); }
    50% { box-shadow: 0 0 50px rgba(99, 102, 241, 0.4); }
    100% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.2); }
}
```

**Hover State:**
```css
.omni-bar:hover {
    box-shadow: 0 0 40px var(--core-glow), 0 0 60px rgba(99, 102, 241, 0.2);
    border-color: var(--core-primary);
}
```

---

### Screen B: Processing ("The War Room")

#### Neural Arena Layout
```
     [GPT]──────────╮
       ●            │
                    ▼
              ╭─────────╮
     [Gemini]─│  CORE   │─[Grok]
       ●      │ (pulse) │    ●
              ╰─────────╯
                    ▲
                    │
     [Claude]───────╯
       ●
```

#### Components

**1. Core Orb (Central Nexus)**
- Size: 120px diameter
- Breathing animation: Scale 1.0 → 1.15 over 4 seconds
- Radial gradient from indigo to dark
- Box shadow creates glow effect

```css
.core-orb {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, var(--core-primary), #1a1a2e);
    box-shadow:
        0 0 80px var(--core-glow),
        0 0 120px rgba(99, 102, 241, 0.3),
        inset 0 0 60px rgba(99, 102, 241, 0.4);
    animation: breathe 4s ease-in-out infinite;
}

@keyframes breathe {
    0%, 100% { transform: scale(1); filter: brightness(1); }
    50% { transform: scale(1.15); filter: brightness(1.3); }
}
```

**2. AI Nodes (Corner Positions)**
- 4 nodes positioned around the core
- Each has unique brand color
- Pulsing glow animation when active

```css
.ai-node {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(var(--ai-color), 0.1);
    border: 2px solid var(--ai-color);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: node-pulse 2s ease-in-out infinite;
}
```

**3. Data Streams (SVG Lines)**
- Dashed lines from each AI node to center
- Animated dash offset creates flowing effect
- Color matches each AI's brand

```css
@keyframes data-stream {
    0% { stroke-dashoffset: 1000; }
    100% { stroke-dashoffset: 0; }
}

.stream-line {
    stroke-dasharray: 12 8;
    animation: data-stream 2s linear infinite;
}
```

**4. Debate Stream Panel (Left Side)**
- Glass panel showing real-time AI responses
- Cards fly in from corners
- Height: 420px, scrollable

**Card Structure:**
```html
<div class="thought-card gpt">
    <div class="card-header">
        <span class="ai-badge">GPT</span>
        <span class="verdict-badge yes">YES</span>
    </div>
    <p class="card-text">Analysis text...</p>
</div>
```

**Card Animation:**
```css
@keyframes card-fly-in {
    0% { opacity: 0; transform: translateX(-50px) scale(0.9); }
    100% { opacity: 1; transform: translateX(0) scale(1); }
}
```

#### Animation Phases

1. **Phase 1 - Thinking (0-3s)**
   - Dashed lines extend from corners to center
   - Core pulses slowly
   - AI nodes glow with their brand color

2. **Phase 2 - Debating (3-10s)**
   - Particle dots travel along the lines
   - Cards appear in stream panel
   - Core brightness fluctuates

3. **Phase 3 - Conflict (if triggered)**
   - Lines turn red and vibrate
   - Core shows glitch effect
   - Conflict spark particles spawn

4. **Phase 4 - Synthesis (final)**
   - All lines converge to center
   - Core implodes/explodes into result
   - Smooth transition to verdict overlay

---

### Screen C: Verdict ("The Dossier")

#### Verdict Overlay
- Fixed position, full screen
- Blurred dark background (rgba(0, 0, 0, 0.85) + blur(20px))
- Centered panel with glassmorphism effect
- Scrollable content area

#### Components

**1. Consensus Badge (Header)**
```
┌─────────────────────────────────────────────┐
│  [ALL 4 AIs AGREE]              4/4         │
│                               Unanimous      │
└─────────────────────────────────────────────┘
```

- Gradient background (green for consensus, amber for split)
- Shows actual agreement count (e.g., "3/4 Agree on YES")

**2. Hero Decision Text**
- Large typography (3.5rem)
- Gradient text effect (white to gray)
- Shows decision with context: "YES. Invest with dollar-cost averaging."

**3. Spectrum Slider (Position Visualization)**
```
┌─────────────────────────────────────────────┐
│  No        Conditional        Yes           │
│  ├─────[C]────[Gm]──────[G][Gk]───────────┤│
└─────────────────────────────────────────────┘
```

- Frosted glass track
- AI avatars positioned by their stance (0-100%)
- Clickable to open inspector modal
- Positions:
  - YES: 70-95%
  - NO: 5-30%
  - CONDITIONAL: 40-60%
  - WAIT: 25-45%

**4. AI Agreement Grid**
```
┌──────────────────┬──────────────────┐
│  GPT-4o          │  Gemini          │
│  [YES]           │  [YES]           │
│  "Key argument"  │  "Key argument"  │
├──────────────────┼──────────────────┤
│  Claude          │  Grok            │
│  [CONDITIONAL]   │  [YES]           │
│  "Key argument"  │  "Key argument"  │
└──────────────────┴──────────────────┘
```

- 2x2 grid of AI response cards
- Color-coded verdict badges
- Truncated key arguments

**5. Attribution Text (Heatmap)**
- Synthesis paragraph with AI-colored underlines
- Hover reveals which AI contributed each insight

```css
.attribution-gpt { border-bottom: 2px solid var(--ai-gpt); }
.attribution-claude { border-bottom: 2px solid var(--ai-claude); }
```

**6. Action Plan Grid**
```
┌──────────────────┬──────────────────┐
│  ✓ Immediate     │  ⚠ Key Risks     │
│    Actions       │                  │
│  • Action 1      │  • Risk 1        │
│  • Action 2      │  • Risk 2        │
│  • Action 3      │  • Risk 3        │
└──────────────────┴──────────────────┘
```

- Min-height: 180px for consistent proportions
- Flexbox layout with scrollable list

**7. Decision Timeline ("How This Was Made")**
- Vertical timeline with colored line
- Shows each debate round
- Icons indicate conflict or agreement states

```html
<div class="timeline-step complete">
    <div class="timeline-step-content">
        <div class="timeline-step-title">Round 1: Initial Analysis</div>
        <div class="timeline-step-desc">4 AIs submitted positions</div>
    </div>
</div>
```

**8. Full Debate Transcript (Collapsible)**
- Toggle button to expand/collapse
- Shows complete conversation history
- Organized by rounds
- Each message shows:
  - AI avatar/name
  - Decision badge
  - Position text
  - Key argument (italic)
  - "Changed Mind" badge if applicable

---

### Screen D: Mobile ("The Feed")

#### Responsive Breakpoints
- **Desktop:** > 768px (full arena layout)
- **Mobile:** ≤ 768px (stacked/feed layout)

#### Mobile Adaptations
- Omni-bar: Full width minus padding
- Arena: Simplified central core only
- Verdict: Single column layout
- Action grid: Stacks to single column
- Spectrum: Horizontal scroll enabled

---

## 4. Micro-Interactions & Animations

### Button Interactions
```css
.btn-primary {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4);
}

.btn-primary:active {
    transform: translateY(0) scale(0.98);
}
```

### Card Hover Effects
```css
.ai-resp-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
    border-color: var(--ai-color);
}
```

### Glitch Effect (Conflict State)
```css
@keyframes glitch-text {
    0% { transform: translate(0); }
    20% { transform: translate(-2px, 2px); }
    40% { transform: translate(-2px, -2px); }
    60% { transform: translate(2px, 2px); }
    80% { transform: translate(2px, -2px); }
    100% { transform: translate(0); }
}
```

### Loading Skeleton
```css
@keyframes skeleton-pulse {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

.skeleton {
    background: linear-gradient(90deg,
        rgba(255,255,255,0.03) 25%,
        rgba(255,255,255,0.08) 50%,
        rgba(255,255,255,0.03) 75%);
    background-size: 200% 100%;
    animation: skeleton-pulse 1.5s infinite;
}
```

---

## 5. Glassmorphism Specifications

### Standard Glass Panel
```css
.glass-panel {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

### Elevated Glass (Modals/Overlays)
```css
.glass-elevated {
    background: rgba(8, 8, 12, 0.98);
    backdrop-filter: blur(40px);
    box-shadow:
        0 40px 100px rgba(0, 0, 0, 0.6),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

---

## 6. Typography Scale

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Hero Decision | Space Grotesk | 3.5rem | 700 | 1.1 |
| Section Title | Space Grotesk | 1.5rem | 700 | 1.3 |
| Card Title | Space Grotesk | 0.875rem | 600 | 1.4 |
| Body Text | Inter | 1rem | 400 | 1.6 |
| Small Text | Inter | 0.875rem | 400 | 1.5 |
| Caption | Inter | 0.75rem | 500 | 1.4 |
| Badge | Inter | 0.7rem | 700 | 1 |

---

## 7. Special Features

### 1. Interactive Timeline Scrubber
- Fixed position at bottom of verdict
- Allows "rewinding" to see earlier debate rounds
- Updates visible content based on position

### 2. AI Inspector Modal
- Click any AI avatar to see full analysis
- Shows:
  - Complete reasoning
  - All risks identified
  - Assumptions made
  - Decision confidence

### 3. Tactical Drawer
- Bottom sheet with detailed action items
- 2x2 grid: Actions, Risks, Timeline, Indicators
- Slide-up animation (85vh height)

### 4. Share Certificate
- Premium-styled share page
- Dark background with gold/silver borders
- "Signed by ConsensusAI Neural Engine"
- CTA: "Challenge this Verdict"

### 5. Bias Check Badge
- Shield icon in corner
- Hover tooltip: "Cross-referenced by 4 AI models"
- Builds trust in multi-model validation

---

## 8. Accessibility Considerations

- All interactive elements have focus states
- Color is not the only indicator (icons + text)
- Minimum contrast ratio: 4.5:1
- Keyboard navigation supported
- Reduced motion: respects prefers-reduced-motion

---

## 9. Performance Optimizations

- CSS animations use GPU-accelerated properties (transform, opacity)
- Lazy loading for transcript content
- Debounced input handling
- SSE for real-time updates (no polling)
- Efficient DOM updates (batch when possible)

---

## 10. File Structure

```
public/
├── cortex.html      # Main UI file (all CSS inline for performance)
├── index.html       # Landing page
├── share.html       # Share certificate page
└── assets/
    └── (SVG icons inline in HTML)
```

---

## 11. Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Nov 2024 | Initial Cortex theme implementation |
| 2.1 | Dec 2024 | Added transcript view, fixed confidence display, improved proportions |

---

*Document prepared for design review and Gemini consultation.*
