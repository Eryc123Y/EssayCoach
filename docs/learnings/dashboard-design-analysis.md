# Dashboard Design Analysis

**Date**: 2026-02-25
**Author**: ui-designer
**Status**: In Progress

---

## Overview

Design analysis for Dashboard Overview Refactor (PRD-04) based on pencil-shadcn.pen design file.

**Task**: Extract design specifications for Student, Lecturer, and Admin dashboards.

---

## Design Extracts from pencil-shadcn.pen

### Student Dashboard (EC-04A-Dashboard-Student)

**Design Reference**: Lines 90183-90700 in pencil-shadcn.pen

#### Layout Structure
- **Page Container**: Max-width 1400px, centered
- **Grid**: 4-column stat cards top, 7-column content below
- **Sidebar**: 240px fixed left (collapsible on mobile)

#### Stat Cards (4 columns)
| Card | Icon | Value | Label | Trend |
|------|------|-------|-------|-------|
| Current Grade | IconAward | 91% (A-) | Current Grade | Top 10% of class |
| Pending Tasks | IconListCheck | 2 | Pending Tasks | Due in 3 days |
| Writing Activity | IconPencil | 3.5k | Writing Activity | Words written this week |
| Recommended Practice | IconTarget | - | Recommended Practice | Skill to improve |

#### Color Tokens
```
$primary: #2563EB (Primary Blue)
$success: #16A34A (Success Green)
$warning: #D97706 (Warning Amber)
$destructive: #DC2626 (Error Red)
$muted-foreground: #64748B (Slate 500)
$background: #FFFFFF (White)
$secondary: #F1F5F9 (Slate 100)
```

#### Typography
```
H1: Inter, 600 weight, 32px
H2: Inter, 600 weight, 24px
H3: Inter, 500 weight, 18px
Body: Inter, 400 weight, 15px
Small: Inter, 400 weight, 13px
```

#### Spacing Scale (4px base)
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

---

### Lecturer Dashboard (EC-04B-Dashboard-Lecturer)

**Design Reference**: Lines 91927-92500 in pencil-shadcn.pen

#### Key Sections

**1. Grading Queue Section**
- List view with essay cards
- Each card shows: Student name, Essay title, Submission date, Status badge
- Status colors:
  - AI Graded: Blue badge
  - Pending Review: Amber badge
  - Overdue: Red badge
- Action: "Review" button (primary color)

**2. Class Overview Cards**
- Card grid (2-3 columns)
- Per card:
  - Class name (e.g., "English 101 - Section A")
  - Student count
  - Essays submitted count
  - Average score (with progress bar)
  - Pending reviews count

**3. Lecturer Stats**
| Stat | Value | Label |
|------|-------|-------|
| Essays Reviewed Today | 12 | Essays reviewed today |
| Pending Reviews | 8 | Pending reviews |
| Active Classes | 4 | Total classes |
| Avg Grading Time | 15min | Average grading time |

---

### Admin Dashboard (EC-04C-Dashboard-Admin)

**Design Reference**: Lines 93875-94500 in pencil-shadcn.pen

#### Key Sections

**1. Platform Stats**
- Total users (students, lecturers, admins)
- Active institutions
- Essays processed (today, week, month)
- Revenue metrics

**2. System Health**
- API response time
- Error rate
- Uptime percentage
- Database status

**3. Recent Activity**
- User registrations
- Essay submissions
- System events

---

## Component-to-Design Mapping

| Component | Design Frame | Status |
|-----------|--------------|--------|
| DashboardHeader | EC-04A-Header, EC-04B-Header, EC-04C-Header | Mapped |
| StatCard | EC-04A-StatCard-*, EC-04B-StatCard-* | Mapped |
| ActivityFeed | EC-04A-ActivityFeed | Mapped |
| GradingQueue | EC-04B-GradingQueue | Mapped |
| ClassOverviewCards | EC-04B-ClassCards | Mapped |
| MyEssaysList | EC-04A-EssayList | Mapped |
| ProgressTracker | EC-04A-ProgressChart | Mapped |

---

## State Designs

### Loading States
- **Pattern**: Skeleton screens matching content layout
- **Stat Cards**: Pulse animation on card content
- **Lists**: 3-5 skeleton items
- **Charts**: Skeleton container with aspect ratio

### Empty States
- **My Essays**: "No submissions yet. Start with your first task." + CTA button
- **Grading Queue**: "All caught up! No pending reviews." + Checkmark icon
- **Activity Feed**: "No recent activity." + Empty state illustration

### Error States
- **Pattern**: Error card with retry button
- **Message**: "Failed to load {section}: {error.message}"
- **Action**: "Retry" button + "Go to Dashboard" fallback

---

## Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | <768px | Bottom nav, single column, collapsed stats |
| Tablet | 768px-1199px | Collapsible sidebar, 2-column grid |
| Desktop | 1200px+ | Fixed sidebar, full grid layout |

---

## Design Compliance Checklist

| Checkpoint | Status | Verified |
|------------|--------|----------|
| Component mapping matches pencil-shadcn.pen | ✅ Complete | |
| Color tokens extracted | ✅ Complete | Matches $-- tokens |
| Spacing follows 4px scale | ✅ Complete | 4px, 8px, 16px, 24px, 32px |
| Typography matches Inter specs | ✅ Complete | 400/500/600 weights |
| Loading states designed | ✅ Complete | Skeleton patterns |
| Empty states designed | ✅ Complete | With CTAs |
| Error states designed | ✅ Complete | With retry actions |
| Responsive layouts defined | ✅ Complete | Mobile/Tablet/Desktop |

---

## Next Steps for Implementation

1. **Type Definitions**: Use extracted design tokens in TypeScript types
2. **Component Implementation**: Follow mapped design frames
3. **State Implementation**: Implement loading/empty/error states as designed
4. **Responsive Testing**: Test at all 3 breakpoints

---

## References

- Design File: `docs/prd/pencil-shadcn.pen`
- PRD-04: `docs/prd/04-dashboard-overview.md`
- Implementation Plan: `docs/learnings/dashboard-frontend-implementation-plan.md`
