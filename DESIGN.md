---
name: Agenda Psi
description: A cream diary page lifted onto a plum desk, ruled in brass and written in one monospace hand.
colors:
  desk: "#3a1f2c"
  desk-deep: "#2c1620"
  page: "#f5ecd8"
  page-shade: "#eadfc4"
  page-shade-deep: "#ded1ae"
  rule: "#c7a96b"
  rule-soft: "rgba(199, 169, 107, 0.35)"
  ink: "#1e5c55"
  ink-deep: "#123e39"
  ink-wash: "#dceae6"
  brass: "#a9752f"
  brass-wash: "#f0e3c8"
  oxblood: "#8c3b3f"
  oxblood-wash: "#f1dedd"
  text: "#2a2018"
  text-muted: "#6b5d48"
  text-soft: "#9c8d72"
  error: "#a6453b"
typography:
  display:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "clamp(28px, 4vw, 38px)"
    fontWeight: 800
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "15px"
    fontWeight: 700
    letterSpacing: "-0.01em"
  title:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "14px"
    fontWeight: 500
  body:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  sm: "3px"
  md: "4px"
  lg: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.page}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
    typography: "{typography.title}"
  button-primary-hover:
    backgroundColor: "{colors.ink-deep}"
    textColor: "{colors.page}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "9px 15px"
  button-ghost-hover:
    backgroundColor: "{colors.ink-wash}"
    textColor: "{colors.ink-deep}"
  input-underline:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "0"
    padding: "8px 2px"
  card-page:
    backgroundColor: "{colors.page}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "32px 32px 28px 44px"
  slot-free:
    backgroundColor: "transparent"
    textColor: "{colors.text-soft}"
    height: "56px"
  slot-booked:
    backgroundColor: "{colors.ink-wash}"
    textColor: "{colors.ink-deep}"
    height: "56px"
    padding: "6px 8px 6px 10px"
---

# Design System: Agenda Psi

## Overview

**Creative North Star: "The Analyst's Desk"**

The interface is a single cream page lifted onto a deep plum desk. That is not a
metaphor applied after the fact — it is the vocabulary the implementation
already uses: the background token is `desk`, the surface is `page`, the hairline
is `rule`, the accent is `ink`, and the page arrives with a `page-settle`
animation and a binding gutter drawn 18px from its left edge. Everything else
follows from taking that seriously.

The density is clerical rather than spacious. Type is small and tightly tracked,
rules are thin, and whitespace is rationed the way it is on a printed form: the
page earns its margins, and the content inside sits close together. There is
exactly one lift in the whole system, and it belongs to the page itself. Nothing
inside the page ever floats, because paper does not stack on paper.

Colour is used the way a practitioner's desk uses it — a brass rule, a teal pen,
a red correction. The saturated hues appear in text, lines and one primary
action; everything broader is carried by washed tints of the same hues, so a
booked hour reads as a filled line rather than as a coloured button.

**Key Characteristics:**
- One typeface, carrying all hierarchy by weight and tracking
- One lift: the page floats, nothing inside it does
- Lines organise, boxes do not
- Warm, ruled, and legible before it is decorative
- State shown by washed tint, never by shadow

## Colors

A warm, ink-on-paper palette: one deep ground, one cream surface, and three
working hues that behave like pens rather than like brand colours.

### Primary
- **Consulting Teal** (`ink`): the pen. Primary buttons, focus rings, active
  states, the booked-hour text, and every link. It is the only colour that
  carries an action.
- **Deep Ink** (`ink-deep`): the pressed state of that pen — primary button
  hover, and the text colour of a booked hour against its wash.
- **Ink Wash** (`ink-wash`): the trace it leaves. Fills booked hours and ghost
  button hovers. Broad areas get the wash; never the pen.

### Secondary
- **Brass** (`brass`) and **Brass Rule** (`rule`): the hardware of the page.
  The rule draws every divider, border and gutter line; brass itself marks
  lunch and other configured, non-clinical states. **Brass Wash**
  (`brass-wash`) fills those blocks.

### Tertiary
- **Oxblood** (`oxblood`) with **Oxblood Wash** (`oxblood-wash`): reserved for
  overrides and exceptions — a session booked over a lunch break. It signals
  *deliberate deviation*, not error.
- **Correction Red** (`error`): error notices only. Distinct from oxblood on
  purpose; one means "you meant this", the other means "this failed".

### Neutral
- **Deep Plum Desk** (`desk`) and **Plum Shadow** (`desk-deep`): the surface the
  page rests on. Never a content background.
- **Diary Cream** (`page`), **Cream Shade** (`page-shade`), **Cream Shade Deep**
  (`page-shade-deep`): the page and its two pressed tones, used for hover beds
  and inset rows.
- **Pencil Brown** (`text`), **Muted Pencil** (`text-muted`), **Soft Pencil**
  (`text-soft`): the three weights of writing — content, caption, and the
  not-yet-written.

### Named Rules

**The Wash, Not the Ink Rule.** Any area larger than a line of text is filled
with a `-wash` tint. The saturated hues — `ink`, `brass`, `oxblood` — are for
text, 1px rules, and the single primary button. A saturated fill across a block
breaks the paper reading instantly.

**The One Page Rule.** Exactly one cream surface floats on the desk at a time.
Two competing pages is a layout error, not a composition choice.

## Typography

**Display Font:** JetBrains Mono (with `ui-monospace`, `SFMono-Regular`, Menlo,
Consolas)
**Body Font:** JetBrains Mono — the same family
**Label/Mono Font:** JetBrains Mono — the same family

**Character:** One monospaced hand writes the entire product. Pinned by the
owner after matcha.fm and served from the product's own origin. The fixed
advance width is doing real work here: an hour column, a five-day grid and a
recovery key in five-character groups all line up without tabular-figure
tricks.

### Hierarchy
- **Display** (800, `clamp(28px, 4vw, 38px)`, tracking `-0.025em`): the product
  name and page titles. Tight tracking is what keeps a monospace face from
  reading as code at this size.
- **Headline** (700, 15px, `-0.01em`): section headings inside a page.
- **Title** (500, 14px): the patient name in a booked hour — the most-read text
  in the product.
- **Body** (400, 16px, 1.5): prose, legal documents, and long-form reading at a
  68ch measure.
- **Label** (600, 11px, uppercase, tracking `0.08em`): field captions and
  column headers. The one place letterforms are spaced apart rather than
  pulled together.

### Named Rules

**The One Family Rule.** Hierarchy is carried by weight (800 → 400) and tracking
(`-0.025em` → `+0.08em`), never by introducing a second typeface. A serif or a
sans anywhere in this interface is a defect.

**The Legibility Floor Rule.** A confirmed user has low vision. Body and content
text do not go below 14px, and nothing a user must read to do their job goes
below 12px. *Current state: the stylesheet still has seven rules at 10px and
eight at 11px, and 12px is carrying the hour column, the back link and the lunch
markers. Those are debt against this rule, not precedent for it.*

## Layout

A single centred container, `max-width: 1080px`, padded `32px 32px 28px 44px` —
the asymmetric left padding is the page's binding margin, with a hairline rule
drawn 18px from the edge and a second faint line 6px beyond it. Card surfaces
(sign-in, lock, consent) use the same treatment at `max-width: 420px`.

The schedule is a grid of five day columns against an hour column, with a
`min-width: 620px` floor and horizontal scroll below that — the hour column
stays put while days scroll. Row height is a single token (`--cell-h: 56px`),
which is what makes a day scannable at a glance.

Spacing runs on a 4px rhythm, clustering at 4 / 8 / 12 / 20 / 32. Breakpoints
are 760px, 720px and 480px, plus three capability queries: `hover: none`,
`prefers-reduced-motion` and `prefers-reduced-transparency`.

### Named Rules

**The Binding Gutter Rule.** The page keeps its wider left padding and its
binding line at every breakpoint. It is the single detail that makes the surface
read as a page rather than as a card.

## Elevation & Depth

There is exactly one shadow in this interface, and it is large: `0 18px 40px
rgba(20, 12, 10, 0.35)` plus a `0 0 0 1px rgba(0,0,0,0.15)` ring, applied to the
page container and the lock card. It reads as a sheet lifted a centimetre off a
dark desk.

Everything inside the page is flat. Depth there is tonal: `page-shade` for hover
beds, the `-wash` tints for filled states, and 1px rules for separation. The
`--shadow-sm` and `--shadow-md` tokens exist in the stylesheet but are
essentially unused inside content, and should stay that way.

### Shadow Vocabulary
- **Page lift** (`box-shadow: 0 18px 40px rgba(20,12,10,0.35), 0 0 0 1px rgba(0,0,0,0.15)`):
  the page and the lock card. Nothing else.

### Named Rules

**The One Lift Rule.** The page floats; nothing inside it does. A popover, a
dialog or an elevated card inside the page is a violation — separate it with a
rule and a tint instead.

## Shapes

Radii are almost absent by design: 3px on buttons and inputs, 4px on small
chips, 6px on the page and card surfaces. Nothing is pill-shaped and nothing is
circular except the lunch handle.

Form language is lines, not containers. Text inputs have no box — a 1px bottom
rule that thickens to 2px of `ink` on focus. Rows are separated by
`border-bottom: 1px solid rule-soft`. Grid cells are divided by a left rule. A
3px left rule marks a block as annotation: notices, entries, migration counts.

### Named Rules

**The Ruled, Not Boxed Rule.** A line organises; a box encloses. Reach for a
rule, a tint or spacing before reaching for a border on four sides.

**The Margin Mark Rule.** The 3px left rule is this system's annotation mark —
`ink` for neutral and positive notices, `brass` for warnings, `error` for
failures. It is deliberate and systemic. Automated slop detectors flag it as an
"AI side-tab accent"; that finding is a false positive here and should be
dismissed rather than designed around.

## Components

### Buttons
- **Shape:** barely rounded (3px), never pill.
- **Primary:** `ink` fill, `page` text, 1px `ink` border, padding `10px 20px`,
  600 weight at 14px with `0.02em` tracking. One per view.
- **Hover / Focus:** background and border shift to `ink-deep` over 0.15s.
  Focus is a 2px `ink` outline at 2px offset, never a glow.
- **Ghost (`nav-btn`):** transparent with a 1px `rule` border; on hover the bed
  fills `ink-wash`, the border becomes `ink`, and text goes `ink-deep`.
- **Link:** underlined text at 13px in `ink`, 3px underline offset. Used for
  secondary escapes such as "Forgot your password?" and the legal links.

### Cards / Containers
- **Corner Style:** 6px.
- **Background:** `page` on `desk`.
- **Shadow Strategy:** the single page lift; see Elevation.
- **Border:** none — the 1px dark ring in the shadow does that work.
- **Internal Padding:** `32px 32px 28px 44px` for the page, `30px 28px` for
  cards.

### Inputs / Fields
- **Style:** no box. Transparent background, `border-bottom: 1px solid rule`,
  square corners, 15px text.
- **Focus:** the bottom rule thickens to 2px of `ink`. Nothing else moves.
- **Label:** the 11px uppercase label sits above the line, 8px clear.

### Navigation
The home page is a contents list, not a nav bar: full-width rows separated by
`rule-soft`, each `22px` tall in padding, with a 5px marker column. On hover the
row bed fills `page-shade` and the content shifts 10px right. Back navigation is
a single `← Back` link at 12px.

### Schedule Cell (signature component)
The product's defining element. A 56px-tall button with a left hairline rule.

- **Free:** transparent, `text-soft`, centred, showing a `+` that sits at 0.4
  opacity on touch devices and appears on hover elsewhere.
- **Booked:** `ink-wash` bed, `ink-deep` text at 500/14px, left-aligned with
  10px of left padding — the name reads as writing on a ruled line.
- **Lunch:** `brass-wash` bed with a brass marker.
- **Override:** `oxblood-wash` — a session deliberately booked over lunch.
- **Focus:** 2px `ink` outline inset by 2px, so the ring stays inside the grid.

## Do's and Don'ts

### Do:
- **Do** carry hierarchy with weight and tracking in JetBrains Mono — 800 at
  display with `-0.025em`, 600 at label with `+0.08em`.
- **Do** fill broad areas with a `-wash` tint and keep the saturated hue for
  text, 1px rules and the one primary button.
- **Do** separate with a rule, a tint, or space, in that order.
- **Do** keep the page's binding margin and its hairline at every breakpoint.
- **Do** hold the legibility floor: 14px for content, 12px as the absolute
  minimum for anything a user must read to work.
- **Do** keep focus as a 2px `ink` outline — inset inside the grid, offset
  outside it.

### Don't:
- **Don't** introduce a second typeface. One family, no exceptions.
- **Don't** add a second elevation level. If something needs to stand out
  inside the page, rule it or tint it.
- **Don't** box an input. The underline is the field.
- **Don't** use `oxblood` for errors or `error` for overrides; the distinction
  between "deliberate" and "failed" is the whole point of having both.
- **Don't** put a cream surface on another cream surface, or two pages on the
  desk at once.
- **Don't** reach for a pill radius, a gradient, or a glow — none exist in this
  system, and each one would read as borrowed from somewhere else.
