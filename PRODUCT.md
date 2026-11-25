# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Shanghai Garment Group custom-business advisors, group-uniform solution designers, and bespoke program planners use the product as a client-interview and handoff assistant. Customers may answer the interview directly in the room, while the business user controls confirmation, resource matching, versioning, and the final handoff record.

## Product Purpose

海上衣笺 is an AI-assisted business collaboration workspace for made-to-measure garments. It helps a business user turn a customer's informal language into a confirmed brief, enterprise-resource match, visual prompt, pattern parameters, sample checks, and a traceable handoff ledger.

## Positioning

The product connects client conversation with the group's existing pattern, fabric, craft, and case assets. It supports private bespoke and corporate uniform scenarios, distinguishes confirmed facts from pending suggestions, and keeps every accepted choice traceable through design, fabric, pattern, sample review, and ledger export. Final pricing, pattern approval, delivery dates, and production decisions remain with the human business team.

## Operating Context

The normal workflow has six stages: requirement interview, design direction generation, fabric selection, pattern adjustment, sample confirmation, and delivery handoff. Users may move back to an earlier unlocked stage. AI chat is optional when the image service is unavailable; the workspace can fall back to static enterprise design assets. Handoff submissions are stored locally under `data/handoffs/`.

## Capabilities and Constraints

- Multi-turn requirement capture through DeepSeek chat, with explicit confirmed and pending field states.
- Private bespoke and corporate-uniform modes, with two built-in simulated business cases.
- Design direction selection and image generation through an OpenAI-compatible image service.
- Searchable enterprise assets covering pattern, fabric, craft, and historical case categories, with static fallback material.
- Fabric choice, pattern sliders, sample checklist, handoff form, download, and print actions.
- Self-contained Markdown ledger export with prompt, resource snapshots, sample status, and operation timeline.
- No user photo try-on, automated quotation, delivery promise, production order, or formal pattern approval.
- Existing Next.js 16, React 19, TypeScript, Motion, Lucide, and global CSS implementation must be preserved as the engineering base.

## Brand Commitments

- Existing product name: 海上衣笺 / HAISHANG YIJIAN.
- The requested redesign should use deep blue or deep purple as the primary atmosphere and preserve the Shanghai custom-tailoring context.
- The requested interface should reduce explanatory copy, improve typography, and make the workflow calmer and easier to scan.

## Evidence on Hand

- Product workflow and boundaries are documented in `README.md`.
- Enterprise design and process assets are available under `public/assets/catalog`, `public/assets/fabrics`, and `public/assets/process`.
- Existing rendered screenshots and layout checks under `qa/` show the current interface across desktop and mobile.
- No real customer testimonials, prices, delivery commitments, or production claims are available and must not be invented.

## Product Principles

1. Show the current design decision and the next action before explaining the system.
2. Keep every accepted choice traceable from conversation to handoff.
3. Use familiar, operable controls; the product should read as a working design tool rather than a marketing page.
4. Reduce prose that repeats a control label or a visible state.
5. Be explicit that human advisors own price, fit approval, scheduling, and production.

## Accessibility & Inclusion

Use semantic controls, visible labels, keyboard focus states, readable contrast, and responsive layouts. Preserve reduced-motion behavior and usable targets on touch screens.
