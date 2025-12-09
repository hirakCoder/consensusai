# ConsensusAI 2.0 - "Neural Arena" Design Specification

## 1. Design Philosophy: "The War Room"

**Vibe:** High-stakes decision engine (think Iron Man's JARVIS meets a Bloomberg Terminal).
**Core Metaphor:** We are not just "querying APIs"; we are convening a council of digital gods.
**Differentiation:** Competitors show text lists. We show *collision and synthesis*.

-----

## 2. Design Tokens (CSS Variables)

We use a "Deep Space" theme where colors glow against a void background to reduce eye strain and increase "premium" feel.

```css
:root {
  /* BACKGROUNDS */
  --bg-void: #050505;       /* True Black */
  --bg-panel: #0A0A0A;      /* Panel Background */
  --bg-glass: rgba(20, 20, 20, 0.6); /* Frosted Glass */

  /* BRAND ACCENTS (The Neural Colors) */
  --core-primary: #6366F1;  /* Indigo (The Consensus) */
  --core-glow: rgba(99, 102, 241, 0.5);

  /* AI IDENTITY COLORS (Neon Variants) */
  --ai-gpt: #10A37F;        /* OpenAI Green */
  --ai-gemini: #4D8BFF;     /* Google Blue */
  --ai-grok: #FF5E00;       /* xAI Orange */
  --ai-claude: #D97706;     /* Anthropic Amber */

  /* SEMANTIC STATUS */
  --status-clash: #FF3333;  /* Disagreement */
  --status-merge: #00E5FF;  /* Agreement */

  /* TYPOGRAPHY */
  --font-display: 'Satoshi', sans-serif; /* Headlines */
  --font-mono: 'JetBrains Mono', monospace; /* Data/Code */

  /* EFFECTS */
  --cinematic-shadow: 0 0 40px -10px var(--core-glow);
  --border-subtle: 1px solid rgba(255,255,255,0.08);
}
```

-----

## 3. The "Loading" State (The Hook)

**Goal:** Hide the 15s latency by gamifying the wait.
**Visual:** The "Neural Arena".

1.  **Center:** A pulsating circle (The Core).
2.  **Corners:** 4 Icons (The Models).
3.  **Animation:**
    * **Phase 1 (Thinking):** Dashed lines extend from corners to the center.
    * **Phase 2 (Debating):** Small "particle dots" travel along the lines.
    * **Phase 3 (Conflict):** If Devil's Advocate is triggered, the line turns Red and shakes/vibrates.
    * **Phase 4 (Synthesis):** The Central Core sucks all lines in and explodes (implodes) into the Result Card.

-----

## 4. Key Component Redesigns

### A. The Input Field (Command Center)

* **Change:** Move from a "Form" to a "Command Line" aesthetic.
* **Style:** A floating bar at the bottom (like Perplexity/ChatGPT) but with "Model Status Lights" on top.
* **Micro-interaction:** When the user types, the status lights flicker (showing the AIs are "listening").

### B. The Result Card (The Premium Output)

* **Layout:** "The Executive Brief" (Top-heavy hierarchy).
* **Header:** Huge Verdict (e.g., "YES, BUT...") with a cinematic glow.
* **The "Attribution Stream" (Crucial for Trust):**
    * Instead of static text, the summary uses **Color-Coded Highlights**.
    * *Example:* "While the fundamentals are strong [Green Underline for GPT], regulatory risks remain high [Amber Underline for Claude]."
    * *Why:* This proves we actually synthesized 4 opinions.

### C. The "Consensus Gauge" (Visual Data)

* Replace the simple progress bar with a **"Tension Meter"**.
* A horizontal bar where the Left side is "No" (Red) and Right side is "Yes" (Green).
* Show 4 distinct "Avatar Heads" positioned along the bar.
* *Benefit:* Instantly shows outliers. (e.g., 3 heads on Right, Grok on far Left).

-----

## 5. Mobile Responsiveness Strategy (The Stack)

**Problem:** 4 Columns don't fit on mobile.
**Solution:** "The Story Mode" layout.

1.  **Top:** The "Verdict" is sticky.
2.  **Middle (The Debate):** A vertical timeline (like a WhatsApp chat).
    * *Left Align:* AIs arguing FOR.
    * *Right Align:* AIs arguing AGAINST.
    * This turns the debate into a readable conversation.
3.  **Bottom:** Floating Action Button (FAB) for "Share" or "New Debate".

-----

## 6. Trust & Conversion Triggers

### A. The "Bias Check" Badge

* A small shield icon in the corner of the result.
* On Hover: "Scanned for hallucination by cross-referencing 4 models."
* *Psychology:* Relieves anxiety about AI errors.

### B. The "Share Certificate"

* Redesign the Share Page to look like a **Stock Certificate** or **Official Audit**.
* Dark background, gold/silver borders.
* "Signed and Verified by ConsensusAI Neural Engine."
* **CTA:** "Challenge this Verdict" (instead of just "Try App").

-----

## 7. Implementation Prompts (For Claude/Cursor)

**Animation Keyframes (CSS):**

```css
@keyframes pulse-core {
  0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(99, 102, 241, 0); }
  100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
}

@keyframes data-stream {
  0% { stroke-dashoffset: 1000; }
  100% { stroke-dashoffset: 0; }
}

@keyframes glitch-text {
  /* Used for the "Devil's Advocate" moments */
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}
```

-----

## 8. Visual Reference: The Neural Arena Layout

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
     [GPT]──────────┼──────────────╮                         │
       ●            │              │                         │
                    │              ▼                         │
                    │         ╭─────────╮                    │
     [Gemini]───────┼────────▶│  CORE   │◀────────[Grok]     │
       ●            │         │ (pulse) │            ●       │
                    │         ╰─────────╯                    │
                    │              ▲                         │
                    │              │                         │
     [Claude]───────┼──────────────╯                         │
       ●            │                                         │
                    └─────────────────────────────────────────┘

     LEGEND:
     ────────  = Data Stream (animated dashed line)
     ●         = AI Node (glows with brand color)
     CORE      = Central Nexus (pulses, absorbs streams)
```

**Conflict State:**
```
     [GPT]═══════════╗
                     ║  ← Red, vibrating
                ╔════╬════╗
     [Gemini]═══╣ CLASH  ╠═══[Grok]
                ╚════╬════╝
                     ║  ← Orange sparks
     [Claude]════════╝
```

**Consensus State:**
```
     [GPT]───────────╮
                     │  ← Blue/White, smooth
                ╭────┴────╮
     [Gemini]───┤  MERGE  ├───[Grok]
                ╰────┬────╯
                     │  ← Particles converge
     [Claude]────────╯
```

-----

## 9. Implementation Priority

### Phase 1: Core Visual Identity
1. New CSS variables (Deep Space theme)
2. Central Nexus SVG/Canvas component
3. Basic data-stream animation

### Phase 2: Loading Experience
1. 4-phase animation sequence
2. Real SSE event integration
3. Conflict/Consensus visual states

### Phase 3: Results Overhaul
1. Attribution Stream with color-coded text
2. Tension Meter gauge
3. Bias Check badge

### Phase 4: Mobile & Polish
1. Story Mode layout for mobile
2. Share Certificate design
3. Micro-interactions refinement

-----

*Neural Arena Design Spec v2.0 - December 2024*
