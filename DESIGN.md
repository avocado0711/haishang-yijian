---
name: 海上衣笺
description: A nocturnal, editorial atelier workspace for made-to-measure garment design.
colors:
  night-indigo: "#080b16"
  ink-panel: "#0d1120"
  raised-panel: "#131728"
  plum-selection: "#56345f"
  plum-light: "#cbb7d3"
  chalk: "#f1f1ee"
  fog: "#8d8f9a"
  mineral-green: "#7d968c"
  alert-wine: "#d7a6a6"
typography:
  display:
    fontFamily: "Noto Sans SC, Microsoft YaHei UI, PingFang SC, sans-serif"
    fontSize: "clamp(44px, 4.3vw, 70px)"
    fontWeight: 600
    lineHeight: 1.07
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Noto Sans SC, Microsoft YaHei UI, PingFang SC, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Noto Sans SC, Microsoft YaHei UI, PingFang SC, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0em"
  label:
    fontFamily: "Barlow Condensed, Noto Sans SC, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.06em"
rounded:
  sm: "2px"
  md: "4px"
  lg: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  3xl: "44px"
components:
  button-primary:
    backgroundColor: "{colors.plum-selection}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "42px"
  button-primary-hover:
    backgroundColor: "#70457e"
    textColor: "{colors.chalk}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "#c7c8cf"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "42px"
  field:
    backgroundColor: "{colors.night-indigo}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.sm}"
    padding: "10px 11px"
  stage-nav-active:
    backgroundColor: "#17101f"
    textColor: "{colors.chalk}"
    rounded: "{rounded.md}"
    padding: "9px 4px"
  record-panel:
    backgroundColor: "#110e1a"
    textColor: "{colors.chalk}"
    rounded: "{rounded.md}"
    padding: "24px"
---

# Design System: 海上衣笺

## Overview

**Creative North Star: "The Nocturne Atelier"**

海上衣笺 is a working atelier after dark: almost-black indigo surfaces hold one garment, one decision, or one conversation at a time, while plum light marks where the visitor is and what is selected. The interface should feel like a fashion worktable, not a marketing landing page or a generic dashboard.

The system is editorial in scale and operational in detail. Large Chinese headings establish the current task, hairline rules organize dense tailoring information, and standard web controls keep every action immediately understandable. Real garment photography, fabric macro images, CAD paper patterns, and sample photos carry the product truth.

**Key Characteristics:**

- Near-black deep blue fields with restrained plum emphasis.
- One dominant visual or task per stage.
- Large, direct Chinese headings and very little explanatory copy.
- Hairline borders, low radii, and almost no elevation.
- Standard controls that behave like a professional design tool.

## Colors

The palette is a dark indigo workspace warmed only where human decisions are represented.

### Primary

- **Plum Selection** (`#56345f`): Primary actions, active segmented controls, selected records, and current-stage emphasis.
- **Plum Light** (`#cbb7d3`): Focus outlines, active labels, selected checks, and subtle status glow.

### Secondary

- **Mineral Green** (`#7d968c`): Connected service state, completed checks, and confirmed records.
- **Alert Wine** (`#d7a6a6`): Fit risks, form errors, and items requiring review.

### Neutral

- **Night Indigo** (`#080b16`): Page ground and full-height work surface.
- **Ink Panel** (`#0d1120`): Main work panels and fixed navigation.
- **Raised Panel** (`#131728`): Secondary controls and grouped decision surfaces.
- **Chalk** (`#f1f1ee`): Primary text and active controls.
- **Fog** (`#8d8f9a`): Secondary text, measurements, disabled labels, and helper copy.

**The Plum Rarity Rule.** Plum is a decision color, never decoration. It appears on the current stage, a selected option, a primary button, or a focus state.

## Typography

**Display Font:** Noto Sans SC, with Microsoft YaHei UI and PingFang SC fallbacks  
**Body Font:** Noto Sans SC  
**Label / Data Font:** Barlow Condensed for Latin numerals and compact metadata

**Character:** The Chinese sans carries authority and clarity at large sizes without turning the tool into a magazine. The condensed Latin face gives measurements, stage indices, and model labels a precise technical rhythm.

### Hierarchy

- **Display** (600, clamp 44px-70px, 1.07): Stage titles only; keep to one short sentence.
- **Title** (600, 24px, 1.25): Side-panel titles, garment names, and generated outputs.
- **Body** (400, 15px, 1.65): Conversation, form content, and guidance; avoid paragraphs over four lines.
- **Label** (500, 11px, 0.06em): Stage indices, model names, measurement units, and compact metadata.

**The Short Heading Rule.** A stage heading names the decision. Move explanation into controls, state labels, or the interface itself.

## Layout

The desktop shell uses a 104px compact stage rail, a 64px top bar, and a fluid workspace. The requirement stage divides into a flexible conversation area and a 356px record panel. Decision stages use a main work surface with a 344px control rail. At 1024px the side rail becomes a fixed thumb-reachable stage bar; content stacks below 820px.

Spacing follows a 4/8/12/16/24/32/44 rhythm. Content edges align across columns. Mobile layouts use one column, preserve a 96px bottom clear zone for the stage bar, and keep controls at least 44px tall.

## Elevation & Depth

The system is flat by default. Hierarchy comes from tonal value, thin rules, and photographic contrast. Panels use borders rather than shadows; the only persistent shadow is the bottom stage bar on small screens and the temporary toast.

**The Flat Worktable Rule.** Do not add floating cards or ambient shadows to ordinary panels. Use value and alignment first.

## Shapes

Corners are restrained: 2px for fields, tags, and compact controls; 4px for panels and buttons; 6px only for the outer workspace shell. Borders are 1px. Avoid pills except for status dots and small counters.

## Components

### Buttons

- **Shape:** 4px radius, 42px minimum height.
- **Primary:** Plum field with chalk text and one verb-led label.
- **Hover / Focus:** Plum deepens on hover; focus uses a 2px plum-light outline with a 3px offset.
- **Secondary:** Transparent field with a 1px neutral border and chalk-secondary text.

### Mode Selector

- **Style:** Compact segmented control inside the record panel.
- **State:** The chosen mode uses the same plum field as a selected decision; the alternate remains a hairline outline.

### Cards / Containers

- **Corner Style:** 4px.
- **Background:** Ink or raised panel depending on whether the container is a work surface or a nested control.
- **Border:** One hairline neutral border; selected cards add plum-light.
- **Internal Padding:** 12px for compact cards, 20px-24px for working panels.

### Inputs / Fields

- **Style:** Night indigo field, 1px neutral border, 2px radius.
- **Focus:** Plum-light border with visible browser focus outline.
- **Error:** Wine text remains adjacent to the field; do not rely on color alone.

### Navigation

The desktop stage rail shows an icon, index, and short Chinese label. The active stage receives the only plum glow. On mobile the same stages become a fixed bottom bar with full-width, thumb-reachable targets.

### Stage Surface

- **Style:** One full-height working surface per stage.
- **Behavior:** The conversation, garment direction, fabric swatch, CAD sheet, sample, or delivery record should occupy the dominant visual region.
- **Rule:** The current stage never competes with a second equally prominent section.

## Do's and Don'ts

### Do:

- **Do** keep the first screen dark, direct, and centered on one stage decision.
- **Do** use real garment, fabric, pattern, sample, and delivery assets before decorative graphics.
- **Do** preserve the 4/8/12/16/24/32/44 spacing rhythm and 1px rule language.
- **Do** keep actions verb-led and maintain 44px touch targets.
- **Do** use plum only for state, selection, focus, or primary action.

### Don't:

- **Don't** use cream, beige, or warm paper grounds as the main workspace.
- **Don't** put explanatory paragraphs above every stage heading.
- **Don't** scatter saturated purple across borders, backgrounds, and decorative elements.
- **Don't** turn the workspace into same-size icon cards or nested floating cards.
- **Don't** use heavy shadows, glass, gradients, or ornamental effects as page structure.
