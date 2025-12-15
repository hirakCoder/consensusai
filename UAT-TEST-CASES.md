# ConsensusAI - Mobile UAT Test Cases

## Test Environment
- **Devices**: iPhone SE (375px), iPhone 14 (390px), Galaxy Fold (280px)
- **URL**: http://localhost:3000 or production URL
- **Test Mode**: Manual + Automated (Puppeteer)

---

## 1. INITIAL LOAD & HOME SCREEN

### TC-1.1: First Visit (No Cookie Consent)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open app on mobile | Cookie banner appears at TOP (slim bar) |
| 2 | Verify banner text | Shows "Cookies help us improve. Learn more" |
| 3 | Tap "OK" | Banner dismisses, consent saved |
| 4 | Refresh page | Cookie banner should NOT appear again |

### TC-1.2: Home Screen Elements
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View header | Sign In/Sign Up buttons visible (not overlapping) |
| 2 | View center | Orb with "READY" text visible |
| 3 | View AI nodes | 4 AI icons (GPT, Gemini, Claude, Grok) visible in corners |
| 4 | View input | "Ask the Council..." input at bottom |
| 5 | View template chips | Horizontally scrollable chips visible |
| 6 | View footer | Copyright and links visible |

### TC-1.3: Responsive Layout (Galaxy Fold - 280px)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load on 280px width | All elements fit without horizontal scroll |
| 2 | Header buttons | Compact but not overlapping |
| 3 | Orb size | Scaled down appropriately |
| 4 | Input | Full width, submit button visible |

---

## 2. QUESTION INPUT FLOW

### TC-2.1: Type Question
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap input field | Keyboard opens, input focused |
| 2 | Type question | Text appears in input |
| 3 | Input expands | Input accommodates long text |

### TC-2.2: Template Chips
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Scroll chips horizontally | Chips scroll smoothly |
| 2 | Tap a chip | Question auto-fills in input |
| 3 | Tap submit | Debate starts |

### TC-2.3: Empty Submit
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Leave input empty | Submit button visible |
| 2 | Tap submit | Nothing happens (validation) |

---

## 3. DEBATE IN PROGRESS

### TC-3.1: Debate Start
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit question | Stream appears at top |
| 2 | Query box | HIDDEN during debate |
| 3 | Footer | HIDDEN during debate |
| 4 | Template chips | HIDDEN during debate |

### TC-3.2: Live Stream Display
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Stream header | "LIVE DEBATE" + "Round X" visible |
| 2 | AI responses | Each AI's response appears with name + verdict |
| 3 | Stream scrolls | Content scrollable within stream area |
| 4 | Text readable | Full-width, proper line wrapping |

### TC-3.3: AI Node Animations
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | When AI responding | Corresponding node glows/pulses |
| 2 | Pulse animation | Smooth pulsing effect visible |
| 3 | Multiple rounds | Nodes animate for each round |

### TC-3.4: Round Progression
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Round 1 complete | Stream shows Round 2 indicator |
| 2 | Round 2 complete | Final round indicator appears |
| 3 | Orb state | Shows "DEBATE" during process |

---

## 4. VERDICT / RESULTS

### TC-4.1: Verdict Panel Appearance
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Debate completes | Verdict panel slides up from bottom |
| 2 | Auto-scroll | Panel scrolls to show top (decision) |
| 3 | Panel height | Max 90% viewport height |

### TC-4.2: Verdict Content
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Consensus badge | "MAJORITY: YES/NO (X/4)" visible |
| 2 | AI split indicator | "2/4" or similar visible |
| 3 | Decision text | Clear YES/NO/CONDITIONAL with explanation |
| 4 | Question shown | Original question displayed |

### TC-4.3: AI Position Spectrum
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Spectrum bar | NO → CONDITIONAL → YES scale visible |
| 2 | AI avatars | Positioned correctly on spectrum |
| 3 | Tap avatar | (If clickable) Shows inspector |

### TC-4.4: LLM Response Cards
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | 2x2 grid | 4 cards displayed in grid |
| 2 | Card alignment | All cards same height, aligned |
| 3 | Card content | Name, verdict badge, summary visible |
| 4 | Font sizes | Consistent, readable (0.7rem name, 0.75rem summary) |
| 5 | Text clamp | Summary shows max 3 lines with ellipsis |

### TC-4.5: Key Insights
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Scroll down | Key Insights section visible |
| 2 | Supporting arguments | Listed with bullet points |
| 3 | Counterpoints | Listed if applicable |

### TC-4.6: Close Verdict
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap X button | Verdict panel closes |
| 2 | Tap outside panel | Verdict panel closes |
| 3 | Home state restored | Orb shows "READY", input visible |

---

## 5. FOLLOW-UP QUESTION FLOW

### TC-5.1: New Question After Results
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Close verdict | Input field visible |
| 2 | Type new question | Input accepts text |
| 3 | Submit | New debate starts |
| 4 | Stream | Shows new debate, not old one |

### TC-5.2: New Debate Button
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | In verdict panel | "New Question" button visible |
| 2 | Tap button | Verdict closes, input focused |
| 3 | Input cleared | Ready for new question |

---

## 6. ERROR STATES

### TC-6.1: Rate Limit Reached
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Use all free debates | - |
| 2 | Submit new question | Upgrade modal appears (not toast) |
| 3 | Modal content | Shows pricing, features |
| 4 | Close modal | Can dismiss, returns to home |

### TC-6.2: API Error
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Simulate API failure | Toast notification appears |
| 2 | Toast position | Bottom of screen, full width |
| 3 | Toast text | Error message readable, not cut off |
| 4 | Toast dismisses | Auto-hides after 3 seconds |

### TC-6.3: Network Error
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Disable network | - |
| 2 | Submit question | Error toast appears |
| 3 | UI state | Returns to ready state |

---

## 7. AUTHENTICATION FLOWS

### TC-7.1: Sign Up
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap "Sign Up" | Auth modal/flow opens |
| 2 | Complete signup | Returns to app, logged in |
| 3 | User avatar | Shows in header |

### TC-7.2: Sign In
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap "Sign In" | Auth modal/flow opens |
| 2 | Complete signin | Returns to app, logged in |
| 3 | History available | Can access debate history |

### TC-7.3: User Menu (Logged In)
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap user avatar | Bottom sheet menu opens |
| 2 | Menu options | Profile, History, Sign Out visible |
| 3 | Tap outside | Menu closes |

---

## 8. HISTORY DRAWER

### TC-8.1: Open History
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap history icon | Drawer slides in from right |
| 2 | Drawer width | Full width on mobile |
| 3 | Past debates | Listed with question + date |

### TC-8.2: View Past Debate
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap history item | Verdict panel shows for that debate |
| 2 | Content | Full results displayed |

### TC-8.3: Close History
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap X or outside | Drawer closes |
| 2 | Swipe right | Drawer closes (if implemented) |

---

## 9. AI SETTINGS

### TC-9.1: Open AI Settings
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap settings icon | Full-screen panel opens |
| 2 | Panel content | AI selection options visible |

### TC-9.2: Toggle AI Models
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Toggle AI off | AI deselected |
| 2 | Minimum AIs | At least 2 must remain selected |
| 3 | Submit debate | Only selected AIs participate |

---

## 10. UPGRADE FLOW

### TC-10.1: Upgrade Modal Display
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Trigger upgrade modal | Modal slides up from bottom |
| 2 | Content visible | Title, features, price all visible |
| 3 | CTA button | "Upgrade to Pro" button visible |

### TC-10.2: Upgrade Process
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Tap upgrade button | Stripe checkout opens |
| 2 | Complete payment | Returns to app with Pro access |

---

## AUTOMATED TEST SCRIPT

Run all tests:
```bash
node test-mobile-debate-flow.js    # Full debate flow
node test-mobile-viewports.js      # All viewport sizes
node test-galaxy-fold-debate.js    # Smallest screen
node test-mobile-verdict.js        # Verdict panel
```

---

## PASS/FAIL CRITERIA

- **PASS**: All critical flows (1-6) work without errors
- **CONDITIONAL PASS**: Minor UI issues that don't block functionality
- **FAIL**: Any flow that prevents user from completing a debate

---

## SIGN-OFF

| Tester | Date | Result | Notes |
|--------|------|--------|-------|
| | | | |
