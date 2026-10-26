---
name: experium-transcript
description: Generate an EN audio transcript (~45s) for a single Experium Park exhibit. Reads owner's notes, applies the park's short-form explainer style, shows a draft for review, then writes to scripts/{exhibit_id}/en.md. Use when creating audio content for an exhibit.
argument-hint: '"Exhibit Name" path/to/owner-notes.md'
arguments: "Exhibit name (quoted) + path to owner notes document"
---

# Experium EN Audio Transcript

Generate a ~45-second English audio script for one Experium Park exhibit, following the park's short-form explainer style.

## Arguments

`$ARGUMENTS` — exhibit name (quoted) followed by the path to the owner's notes document.

Example: `"Penjing Garden" docs/owner-notes.md`

---

## Step 1: Read the inputs

Read the notes document at the provided path. Find the section for the named exhibit. Extract every detail the owner has written — facts, personal anecdotes, effort taken to source/transport, curator's intent. Do not discard anything; the more detail you carry into generation, the better.

If the exhibit section is not found, tell the user and stop.

From the notes, extract every distinct factual statement about the exhibit as individual bullet points. Each bullet should be one clear, atomic fact or observation — not a summary. You will output these in Step 2.

If the user has shared images in the conversation, treat them based on how they're labelled:
- **Actual photo** (labelled as such, or clearly the real specimen at the park): use to anchor visual/sensory details (colour, shape, size, texture). Only describe what is actually visible — do not infer anything not clearly shown.
- **Reference image** (e.g. a Google image, illustration, or example of the species): use only to understand what the exhibit generally looks like — to help write a vivid hook or sensory line. Do not describe the reference image as if it is the actual specimen at Experium. Do not extract measurements, ages, or facts from it.

If the user shares an image without labelling it, ask: "Is this a photo of the actual exhibit at Experium, or a reference image?"

---

## Step 2: Extract and output Facts

Before generating the script, output the Facts section immediately. Do not proceed to Step 3 until this is shown.

Format:

```
### Facts — [Exhibit Name]
- [atomic fact from notes]
- [atomic fact from notes]
- ...
```

Each bullet is one clear, atomic fact or observation from the owner's notes. Not summaries. Not paraphrases of groups of facts. One idea per bullet.

Only include what is present in the notes. Never add a bullet for something that is absent or unknown (e.g. "genus not documented in notes" — this is not a fact, do not include it).

**Stop here and wait for nothing — output the Facts block now, then continue to Step 3.**

---

## Step 3: Generate the draft

Write a ~45-second audio script (100–120 words). Follow these rules exactly:

### Structure

**Hook (0–5s)**
- Open with a strong visual contradiction, a surprising fact, or a mystery. Make the listener stop.
- Good hooks: "This tree looks like it was planted upside down." / "Meet the only tree on Earth that naturally peels into every colour of the rainbow."
- **Folklore vs. science contrast**: Introduce two opposing perspectives immediately — local belief or legend alongside a scientific or historical fact. This creates instant intrigue. Example: "Locals say God dropped it here. Scientists say it's been standing for 3,000 years. Both might be right."
- The owner's unusual decision to source or transport the exhibit is also a strong hook.

**Identity + Scale (immediately after the hook)**
- Right after the hook, establish: the exhibit's name, its "primary title" or role (e.g. "the tree of life", "the world's fastest-growing forest"), and any striking physical dimension or unique scale.
- This orients the listener before the rapid roll begins.

**Rapid Roll (bulk)**
- Short, punchy sentences. One idea per sentence. No compound sentences joined by "and" or "but" — split them.
- Present tense throughout ("its bark makes rope", "its leaves store water").
- Group attributes in parallel sequences:
  - "Its fruit has X… Its leaves do Y… Its bark makes Z…"
- Use relatable comparisons for scale or quantity grounded in the notes: "wider than a house", "older than your great-great-grandparents", "more vitamin C than an orange".
- Highlight extreme or unusual real-world uses, historical trivia, or bizarre human interactions (e.g. used as a shelter, a prison, a medicine, a dye).
- **Dynamic transformation**: if the exhibit involves a process or change, break it down step by step in sequence. Example: "Green becomes blue. Blue becomes purple. Purple becomes orange. Every single week, this tree repaints itself."
- Weave in the owner's personal details naturally — e.g. "The founder had this brought all the way from [place]" or "It took [X] years to train this into its current shape." Never brag; state as fact.

**Memorable Close (last 5s)**
- One or two sentences.
- End with a strong, definitive statement about why this exhibit is one-of-a-kind.
- Emphasise an ongoing process or dynamic quality that leaves a lasting impression — something that is still happening right now, not a finished story.
- Not a moral lesson. Not a call to action. A quiet, specific image that stays with the listener.

### Voice

The narrator is someone who genuinely loves nature and art — not a scientist, not a tour guide reading from a card. They notice things. They find beauty in how a root grows, how a leaf catches light, how a tree has quietly been doing something extraordinary for decades. They see nature as art and art in nature. That wonder should come through in every line — not as exclamation marks or hyperbole, but as quiet, specific observation that makes the listener feel like they're seeing something for the first time.

---

### Style rules
- Simple vocabulary. A 12-year-old should understand every sentence without a dictionary.
- No long or complex compound sentences. If a sentence has more than one idea, split it into two.
- No bullet points in the output script — flowing prose only.
- No academic classifications as openers ("The Ficus benghalensis is a species of…").
- No slogans or calls to action ("Come back and visit!").
- Third person throughout. The park is "the park" or "Experium". The owner is "the founder" or "the curator" — never "we" or "I".

### Vocabulary — avoid / prefer

These words feel clinical, museum-like, or unnatural for a living eco park. Never use them:

| Avoid | Use instead |
|-------|-------------|
| specimen | tree, plant, this tree, it |
| entity | tree, plant, it, this one |
| flora / fauna | plants, trees, animals, birds |
| organism | living thing, creature, tree, plant |
| botanical | (drop the word — just say what it is) |
| deciduous / evergreen | "loses its leaves in winter" / "stays green all year" |
| canopy | treetop, crown, top branches |
| cultivar / rootstock | variety, type |
| indigenous / endemic | native, found only in… |
| perennial | lives year after year |
| foliage | leaves |
| genus / species (as a noun) | kind of tree, type of plant |

General rule: if a 12-year-old would need to Google the word, replace it with plain English.

---

### Grounding rules — STRICT
- **Only use facts explicitly present in the owner's notes or visible in the provided photos.** Do not add any fact, attribute, use, measurement, or historical claim that is not sourced from these inputs.
- If the notes don't mention a detail (e.g. exact age, medicinal use, country of origin), do not invent it — even if it is commonly true of that species.
- Relatable comparisons (e.g. "wider than a car") are allowed only if the scale is stated or clearly visible in a photo.
- When in doubt, leave it out.

---

## Step 4: Show the draft

Show the script under a `### Script` heading.

Below the script, show:
- Word count
- Estimated reading time (words ÷ 2.5 words/second, rounded to nearest 5s)

Then ask:

> **Approve, Revise, or Reject?**
> - **Approve** — writes the file
> - **Revise** — tell me what to change, I'll regenerate
> - **Reject** — discards, no file written

---

## Step 5: Handle the response

**Approve:** Write the script to `scripts/{exhibit_id}/en.md`, where `exhibit_id` is the exhibit name lowercased with spaces replaced by hyphens (e.g. "Penjing Garden" → `penjing-garden`). Confirm the path written.

**Revise:** Apply the user's feedback, regenerate the script, return to Step 3.

**Reject:** Acknowledge and stop. No file written.
