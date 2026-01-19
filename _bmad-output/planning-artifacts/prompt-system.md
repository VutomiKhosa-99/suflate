# Suflate – Claude Prompt & Voice‑Preservation System

## Objective

Design a prompt system that **amplifies a user's natural voice** rather than replacing it.

The system must ensure:

* Output sounds recognizably like the user
* AI acts as an *editor and structurer*, not a ghostwriter
* Generic "AI LinkedIn voice" is actively suppressed

This document defines the **prompt architecture, rules, and safeguards** for Claude usage in Suflate.

---

## Core Principle

> **Voice comes from the input. Structure comes from the AI.**

Claude must never invent insight, vocabulary, or tone. Its job is to organize, clarify, and lightly polish what already exists in the user's speech.

---

## Prompt Architecture (Layered System)

### Layer 1: System Prompt (Always On)

**Purpose:** Set non‑negotiable behavior rules.

**System Instruction (conceptual):**

* You are an editor, not an author
* Do not add new ideas or opinions
* Do not change vocabulary unless for grammar
* Preserve phrasing, cadence, and emphasis
* Avoid generic LinkedIn clichés
* If unsure, stay closer to the original transcript

---

### Layer 2: Context Injection

**Inputs Provided to Claude:**

* Raw transcript (unedited)
* Detected content type (story, lesson, opinion, tactical)
* Target platform: LinkedIn

**Important:**

* Transcript is treated as the *source of truth*
* Claude may reorder but not rewrite meaning

---

### Layer 3: Structure Prompt

**Purpose:** Convert raw speech into readable LinkedIn format.

Responsibilities:

* Add line breaks
* Improve flow
* Surface a clear hook from existing content
* Remove verbal filler ("um", "you know")

Restrictions:

* No motivational fluff
* No emojis unless present in transcript
* No invented takeaways

---

### Layer 4: Variation Engine

**Purpose:** Generate 3–5 variations without voice drift.

Variation rules:

* Same message, different structure
* No change in opinion or stance
* Vocabulary consistency across variations

Example variations:

* Story‑led
* Lesson‑led
* Opinion‑forward

---

## Grammar & Clarity Assistance (Opt‑In)

When users click:

* "Fix grammar"
* "Make clearer"
* "Shorten"

Claude operates under **micro‑prompts** that:

* Modify only sentence mechanics
* Never alter tone or intent
* Never introduce new language patterns

If conflict exists, Claude must prioritize *voice preservation*.

---

## Voice Drift Safeguards

### Hard Constraints

* Reject output that introduces:

  * Buzzwords not in transcript
  * Generic hooks ("Here's the truth", "Most people don't realize")

### Soft Constraints

* Prefer shorter sentences if transcript is punchy
* Preserve repetition if speaker repeats for emphasis

---

## Quality Check (Internal)

Before returning output, Claude must internally evaluate:

1. Does this sound like spoken language?
2. Could this have been written without hearing the speaker?
3. Is anything here not implied or said by the user?

If yes → revise closer to transcript.

---

## Failure Mode Handling

If transcript is:

* Too short
* Too vague
* Pure ramble

Claude response should:

* Ask for clarification OR
* Produce fewer variations
* Never fabricate content to compensate

---

## Future Enhancements

* Voice fingerprint accumulation (preferred words, sentence length)
* Style memory per workspace
* User‑level toggles for verbosity

---

## Success Criteria

The system is successful if users say:

> "I would have written this — but I didn't have to."

This prompt system is foundational to Suflate's long‑term defensibility.
