# UI/UX Specification: ConsensusAI "Living Cortex" Edition

## 1. Core Visual Metaphor

**"The Living Liquid"**
Instead of thin lines connecting dots, we use **Glow & Blur**.

* **The Core:** The central "Consensus" is a glowing, breathing orb of light.
* **The AIs:** They are not circles; they are "Energy Streams" that pour into the center.
* **Conflict:** When AIs disagree, the center turns unstable (glitch effect/red static).
* **Consensus:** The center stabilizes into a solid, crystalline geometry.

-----

## 2. Design System Tokens

### Color Palette (The "Bioluminescent" Theme)

* `--bg-deep`: `#030304` (Warmer than pure black)
* `--glass-surface`: `rgba(255, 255, 255, 0.03)` + `backdrop-filter: blur(20px)`
* `--glow-gpt`: `0 0 60px rgba(16, 163, 127, 0.4)`
* `--glow-claude`: `0 0 60px rgba(217, 119, 6, 0.4)`
* `--text-primary`: `#EDEDED`
* `--text-muted`: `#888888`
* `--font-hero`: `'Space Grotesk', sans-serif` (Tech/Future)
* `--font-body`: `'Inter', sans-serif` (Readability)

-----

## 3. Screen-by-Screen Redesign

### Screen A: The Input (The "Ignition")

* **Layout:** Centralized. No top nav bars. Just the focus.
* **The Component:** "The Omni-Bar".
    * A large, floating glass bar (600px wide).
    * **State 1 (Idle):** "Ask the Council..."
    * **State 2 (Typing):** As the user types, 4 small colored lights orbit the input bar.
* **Background:** subtle animated "nebula" fog that shifts slowly.

### Screen B: The Process (The "War Room")

* **Layout:**
    * **Center:** The "Synthesis Core" (a large, breathing orb).
    * **The Feeds:** "Thought Cards" that fly in from the corners into the center.
    * **Animation:**
        1. Card flies from corner (GPT): "Analyzing Market Data..."
        2. Card flies from opposite corner (Grok): "Challenging Assumption..."
        3. **The Clash:** If they disagree, cards *collide* and spawn a "Conflict Spark".

### Screen C: The Verdict (The "Dossier")

* **The Header:** "STRONG CONSENSUS [92%]" in a glowing badge.
* **The "Spectrum Slider":**
    * A frosted glass track.
    * The "Thumb" is a cluster of AI avatars positioned by their stance.
* **The Text (Heatmap):**
    * Hover Effect: Border lights up with the color of the contributing AI.

### Screen D: Mobile View (The "Feed")

* On mobile, switch to "Chat Stream" mode.
* The "Verdict" is a sticky bottom sheet.

-----

## 4. The "Moat" Feature (Copycat Prevention)

**"Interactive Scrubbing"**

* Timeline Scrubber at the bottom of result page.
* Users can drag back to "Round 1" to see initial positions.
* Shows how opinions changed over time.

-----

## 5. CSS Snippets for the "Glow" Effect

```css
/* The 'Alive' Orb */
.core-orb {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #6366f1, #000);
  box-shadow:
    0 0 60px rgba(99, 102, 241, 0.4),
    inset 0 0 40px rgba(99, 102, 241, 0.8);
  animation: breathe 4s ease-in-out infinite;
}

@keyframes breathe {
  0% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.1); filter: brightness(1.3); }
  100% { transform: scale(1); filter: brightness(1); }
}

/* The Glass Cards */
.thought-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}
```
