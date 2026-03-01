# Dashboard UI Design Review Notes

**Document Created**: 2026-02-25
**UI Designer**: Claude (UI Designer Agent)
**Design Source**: pencil-shadcn.pen (EC-04A-Dashboard-Student, EC-04B-Dashboard-Lecturer, EC-04C-Dashboard-Admin)
**PRD Reference**: docs/prd/04-dashboard-overview.md

---

## Design Compliance Audit Summary

### Current Implementation Status: PARTIAL COMPLIANCE

The current dashboard implementation shows **significant deviations** from the pencil-shadcn.pen design specifications. Below is a detailed breakdown of issues found and required fixes.

---

## Component-by-Component Design Review

### 1. Page Container (`/frontend/src/components/layout/page-container.tsx`)

**Design Spec (from pencil-shadcn.pen):**
- Main content padding: 32px
- Gap between sections: 24px
- Max content width: 1400px (fluid)

**Current Implementation:**
```tsx
// Line 14-18
<ScrollArea className='h-[calc(100dvh-52px)]'>
  <div className='flex flex-1 p-4 md:px-6'>{children}</div>
</ScrollArea>
```

**Issues Found:**
- [ ] **CRITICAL**: Padding is `p-4 md:px-6` (16px/24px) instead of 32px per design spec
- [ ] **CRITICAL**: Missing explicit max-width constraint (1400px)
- [ ] ScrollArea height calculation may not account for header properly

**Required Fix:**
```tsx
<ScrollArea className='h-[calc(100dvh-52px)]'>
  <div className='flex flex-1 flex-col p-8 md:px-8 max-w-[1400px] mx-auto w-full'>
    {children}
  </div>
</ScrollArea>
```

**Compliance Score**: 40%

---

### 2. Header Component (`/frontend/src/components/layout/header.tsx`)

**Design Spec:**
- Header height: 64px (16 * 4 = h-16) ✓
- Left: Sidebar trigger + separator + breadcrumbs
- Right: Notification bell + user menu
- Gap between elements: 12px

**Current Implementation:**
```tsx
<header className='flex h-16 shrink-0 items-center justify-between gap-2 ...'>
  <div className='flex items-center gap-2 px-4'>
    <SidebarTrigger className='-ml-1' />
    <Separator orientation='vertical' className='mr-2 h-4' />
    <Breadcrumbs />
  </div>
  <div className='flex items-center gap-2 px-4'>
    <UserNav />
    <ModeToggle />
  </div>
</header>
```

**Issues Found:**
- [ ] **MINOR**: Gap is `gap-2` (8px) instead of `gap-3` (12px) per design
- [ ] **MAJOR**: Missing notification bell component in header
- [ ] User menu structure doesn't match design (missing avatar + name + chevron layout)

**Required Fix:**
- Add notification bell with badge count
- Update user menu to match design spec (avatar + name "Mia Johnson" + chevron-down)
- Increase gap to 12px

**Compliance Score**: 60%

---

### 3. App Sidebar (`/frontend/src/components/layout/app-sidebar.tsx`)

**Design Spec (ref: 4hLrz - Sidebar/Student):**
- Width: 256px (collapsible to icon-only)
- Logo/brand at top
- Navigation items with icons
- User profile footer with dropdown

**Current Implementation Analysis:**
- Uses `collapsible='icon'` ✓
- Has OrgSwitcher for class selection ✓
- Navigation items from `navItems` array ✓
- User dropdown in footer ✓

**Issues Found:**
- [ ] **MINOR**: Sidebar width not explicitly set to 256px (uses shadcn default)
- [ ] Navigation items limited (Dashboard, Essay Analysis, Rubrics only) - missing planned items
- [ ] Class selector (OrgSwitcher) may not align with PRD-10 Class module design

**Compliance Score**: 75%

---

### 4. Dashboard Overview Layout (`/frontend/src/app/dashboard/overview/layout.tsx`)

**Design Spec:**
- Welcome section with personalized greeting
- 4 KPI cards in a row
- Main content area with charts and lists
- Quick action buttons

**Current Implementation:**
```tsx
<h2>Academic Command Center</h2>
// 4 stat cards in grid
// Charts grid layout
```

**Issues Found:**
- [ ] **CRITICAL**: Missing personalized welcome ("Welcome back, [Name]")
- [ ] **CRITICAL**: Missing timestamp ("Sunday, February 15, 2026 · 9:41 AM")
- [ ] **CRITICAL**: Card titles don't match design:
  - Current: "Current Grade", "Pending Tasks", "Writing Activity", "Recommended Practice"
  - Design: "Essays Submitted", "Average Score", "Feedback Received", "Improvement Trend"
- [ ] **CRITICAL**: Card values don't match design specs
- [ ] **MAJOR**: Layout structure differs significantly from design

**Design Spec Cards:**
```
Card 1: Essays Submitted - 24
Card 2: Average Score - 82/100
Card 3: Feedback Received - 18
Card 4: Improvement Trend - +9%
```

**Current Cards:**
```
Card 1: Current Grade - 91% (A-)
Card 2: Pending Tasks - 2
Card 3: Writing Activity - 3.5k
Card 4: Recommended Practice (CTA card)
```

**Required Fix**: Complete refactor of stat cards to match design

**Compliance Score**: 30%

---

### 5. Stat Cards Design Analysis

**Design Spec (from pencil-shadcn.pen lines 90349-90524):**
- Card variant: `pcGlv` (Card component)
- Title: muted-foreground, 14px, normal weight
- Value: foreground, 32px, 600 weight, tabular-nums
- Layout: vertical stack with proper spacing

**Current Implementation:**
```tsx
<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
  <CardTitle className='text-muted-foreground text-sm font-medium'>
    Current Grade
  </CardTitle>
  <IconAward className='h-4 w-4 text-emerald-500' />
</CardHeader>
```

**Issues Found:**
- [ ] **MAJOR**: Icons in card headers not in design spec
- [ ] **MAJOR**: Title font size is `text-sm` (14px) but font weight is `font-medium` instead of `font-normal`
- [ ] **MAJOR**: Value font size should be 32px (text-3xl) ✓ but missing `tabular-nums`
- [ ] **MAJOR**: Missing trend indicators/badges per design

**Required Fix:**
```tsx
<Card>
  <CardHeader className='pb-2'>
    <CardDescription className='text-muted-foreground text-sm font-normal'>
      Essays Submitted
    </CardDescription>
    <CardTitle className='text-3xl font-semibold text-foreground tabular-nums'>
      24
    </CardTitle>
  </CardHeader>
  <CardFooter>
    <Badge variant='outline'>+3 this week</Badge>
  </CardFooter>
</Card>
```

**Compliance Score**: 35%

---

### 6. Bar Graph Component (`/frontend/src/features/overview/components/bar-graph.tsx`)

**Design Spec:**
- Title: "Writing Dimensions"
- Chart type: Horizontal bar chart
- Dimensions: Evidence, Analysis, Organization, Language, Thesis
- Comparison: Your Score vs Class Avg
- Height: 280px

**Current Implementation:**
```tsx
const chartData = [
  { dimension: 'Evidence', score: 92, avg: 85 },
  { dimension: 'Analysis', score: 88, avg: 82 },
  // ...
];
```

**Analysis:**
- Data structure matches design ✓
- Chart type correct (horizontal bars) ✓
- Height: 280px ✓
- Colors: violet-500 for score, indigo-500 for avg ✓
- Design uses gradient fill ✓

**Issues Found:**
- [ ] **MINOR**: Card border should be `border-indigo-100` ✓ (matches)
- [ ] **MINOR**: Title color should be `text-indigo-950` ✓ (matches)

**Compliance Score**: 95%

---

### 7. Area Graph Component (`/frontend/src/features/overview/components/area-graph.tsx`)

**Design Spec:**
- Title: "Score Improvement"
- Description: "Tracking performance across the semester"
- Chart type: Area chart with stacked layers
- Footer: Improvement trend indicator

**Current Implementation:**
- Title: "Score Improvement" ✓
- Data: 7 assignments showing progression ✓
- Colors: violet-500 for score, indigo-500 for avg ✓
- Footer with trend indicator ✓

**Compliance Score**: 90%

---

### 8. Pie Graph Component (`/frontend/src/features/overview/components/pie-graph.tsx`)

**Design Spec:**
- Title: "Common Error Categories"
- Categories: Grammar, Citations, Structure, Thesis, Style
- Center label: Total count

**Current Implementation:**
- Categories match design ✓
- Donut chart with center label ✓
- Total: 50 issues ✓

**Issues Found:**
- [ ] **MINOR**: Card variant should be `@container/card` for responsive ✓ (matches)

**Compliance Score**: 95%

---

### 9. Recent Submissions Component (`/frontend/src/features/overview/components/recent-submissions.tsx`)

**Design Spec:**
- List of submissions with:
  - Avatar (student)
  - Name + status badge
  - Assignment name
  - Score + AI status badge
- Status badges: Graded (emerald), Pending (amber), Late (red)
- AI badges: Feedback Ready (indigo), Processing (pulsing), Draft (secondary)

**Current Implementation:**
- Avatar with initials ✓
- Status badges with correct colors ✓
- AI status badges ✓
- Hover states ✓

**Issues Found:**
- [ ] **MINOR**: Card should have `border-none bg-transparent shadow-none` per design ✓ (matches)
- [ ] **MINOR**: Avatar should have `ring-2 ring-indigo-100` ✓ (matches)

**Compliance Score**: 90%

---

### 10. Overview Page (`/frontend/src/features/overview/components/overview.tsx`)

**Design Spec:**
- Welcome banner with greeting
- Action buttons: "View Rubrics" (outline), "Submit New Essay" (primary gradient)
- Tabs: Overview (active), Analytics (disabled)

**Current Implementation:**
```tsx
<h2>Academic Command Center</h2>
<p>Ready to elevate your writing? You have 2 assignments pending...</p>
<Button variant='outline'>View Rubrics</Button>
<Button className='bg-gradient-to-r from-indigo-600 to-violet-600'>
  Submit New Essay
</Button>
```

**Issues Found:**
- [ ] **MAJOR**: Welcome section says "Academic Command Center" instead of "Welcome back, [Name]"
- [ ] **MAJOR**: Missing timestamp subtitle
- [ ] **MAJOR**: Tab design uses indigo styling instead of standard shadcn tabs
- [ ] **MAJOR**: Card layout in this file differs from the overview/layout.tsx version

**Note**: There appear to be TWO dashboard overview implementations:
1. `/frontend/src/app/dashboard/overview/layout.tsx` - Has stat cards with icons
2. `/frontend/src/features/overview/components/overview.tsx` - Has different stat cards

**This is a critical architecture issue** - only ONE should exist.

**Compliance Score**: 50%

---

## Critical Architecture Issues

### Issue 1: Duplicate Dashboard Implementations

**Problem**: Two different dashboard overview implementations exist:
- `frontend/src/app/dashboard/overview/layout.tsx`
- `frontend/src/features/overview/components/overview.tsx`

**Impact**: Inconsistent UI, maintenance burden, design compliance impossible

**Resolution Required**:
1. Determine which implementation to keep
2. Delete the other
3. Ensure parallel loading slots work correctly

### Issue 2: Missing Role-Based Dashboards

**Problem**: PRD specifies three distinct dashboards (Student/Lecturer/Admin), but current implementation shows only student-like view

**Required**:
- Separate dashboard layouts per role
- Role-specific KPI cards
- Role-specific navigation items

### Issue 3: Missing Welcome/Personalization

**Problem**: Design shows "Welcome back, Mia" with timestamp, but implementation shows "Academic Command Center"

**Required**:
- Fetch user data from auth context
- Display personalized greeting
- Show current date/time

---

## Design Compliance Checklist (Per Component)

### Layout Components

| Component | Structure | Styling | Typography | States | Responsive | Score |
|-----------|-----------|---------|------------|--------|------------|-------|
| PageContainer | 40% | 50% | 100% | N/A | 60% | 50% |
| Header | 70% | 80% | 100% | N/A | 80% | 76% |
| AppSidebar | 80% | 75% | 100% | 80% | 80% | 83% |

### Feature Components

| Component | Structure | Styling | Typography | States | Responsive | Score |
|-----------|-----------|---------|------------|--------|------------|-------|
| StatCards | 30% | 35% | 40% | 30% | 80% | 43% |
| BarGraph | 95% | 95% | 95% | 90% | 90% | 93% |
| AreaGraph | 90% | 90% | 90% | 85% | 90% | 89% |
| PieGraph | 95% | 95% | 95% | 90% | 95% | 94% |
| RecentSubmissions | 90% | 90% | 90% | 85% | 85% | 88% |
| Overview | 50% | 60% | 70% | 40% | 70% | 58% |

---

## Priority Fixes

### P0 - Critical (Breaks Design System)
1. **Resolve duplicate dashboard implementations** - Choose one, delete other
2. **Fix stat cards to match design** - Wrong labels, values, structure
3. **Add personalized welcome section** - Missing user name, timestamp
4. **Fix page container padding** - 32px per design, not 16px

### P1 - High (Visual Inconsistency)
1. **Add notification bell to header**
2. **Update user menu structure**
3. **Fix tab styling to match design**
4. **Add role-based dashboard routing**

### P2 - Medium (Polish)
1. **Add trend badges to all stat cards**
2. **Fix hover states on cards**
3. **Add skeleton loaders**
4. **Improve responsive behavior**

---

## Next Steps

1. **Immediate**: Resolve duplicate implementation issue
2. **Short-term**: Refactor stat cards and welcome section
3. **Medium-term**: Implement role-based dashboards (lecturer/admin)
4. **Long-term**: Add missing PRD features (grading queue, class overview)

---

## Design Token Reference

From pencil-shadcn.pen design:

**Colors:**
- Primary: `$primary` (#2563EB)
- Success: `$success` (#16A34A)
- Warning: `$warning` (#D97706)
- Error: `$destructive` (#DC2626)
- Background: `$background` (#FFFFFF)
- Surface: `$secondary` (#F1F5F9)

**Typography:**
- Headings: Inter, 600-700 weight
- Body: Inter, 400-500 weight
- H1: 32px, H2: 24px, H3: 18px
- Body: 15px, Small: 13px

**Spacing:**
- Base unit: 4px
- Card padding: 24px
- Section gaps: 32px
- Component gaps: 16px

---

## Appendix: Design-to-Code Mapping

| Design Element | Code Component | Status |
|----------------|----------------|--------|
| Sidebar/Student (4hLrz) | AppSidebar | 75% |
| Card (pcGlv) | Card | 90% |
| Button/Default (VSnC2) | Button | 95% |
| Badge/Default (UjXug) | Badge | 95% |
| Badge/Secondary (WuUMk) | Badge | 95% |
| Badge/Destructive (YvyLD) | Badge | 95% |
| Badge/Outline (3IiAS) | Badge | 95% |
| Avatar/Text (DpPVg) | Avatar | 90% |
| SearchInput (O0rdg) | SearchInput | Pending |
| DataTable (iFQEu) | DataTableSection | Pending |

---

**Last Updated**: 2026-02-25
**Next Review**: After P0 fixes completed
