# EssayCoach Design Philosophy: "Academic Precision"

## Core Values

1. **Straightforward & Purposeful**
   Every UI element must serve a functional purpose. Avoid decorative "fluff" like excessive gradients, pulsing blobs, or complex background patterns.

2. **Clean Typography**
   Prioritize legibility. Use semantic text colors (`text-foreground` for headings, `text-muted-foreground` for labels).

3. **Subtle Depth**
   Use minimalist borders (`border-slate-200` in light mode) and light shadows (`shadow-sm`) instead of high-contrast gradients to define containers.

4. **Strategic Accents**
   Gradients are high-leverage tools. They should ONLY be used for primary Call-to-Action (CTA) buttons to draw the user's attention to the main workflow.

5. **Universal Consistency**
   Dashboard, Rubrics, and Analysis pages must feel like a single cohesive tool. Components (Cards, Inputs, Banners) should be identical across routes.

## Implementation Rules

- **Banners**: Solid `bg-slate-50` or very subtle `bg-indigo-500/5`. No rainbow gradients.
- **Cards**: `bg-white` (Light) / `bg-slate-950` (Dark). No multi-layer transparency unless it's a floating modal.
- **Buttons**:
  - *Primary*: Premium Indigo/Violet gradient (User-approved).
  - *Secondary*: `variant="outline"` with standard borders.
- **Charts**: Use semantic academic colors (Indigo for scores, Slate for averages).
