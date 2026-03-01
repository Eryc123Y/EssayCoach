# Landing Page (Home)

> **Status:** Planned
> **Last Updated:** 2026-02-14

---

## 1. Overview

### Purpose
The Landing Page serves as the public-facing website for EssayCoach, designed to showcase the product's value proposition to prospective institutional buyers (universities and international high schools) and drive demo requests or sales conversations.

### Product Positioning
- **Target Audience:** University administrators, department heads, high school principals, IT directors at educational institutions
- **Product Type:** B2B SaaS platform for educational institutions
- **Deployment Model:** School-specific instances with organizational email-based isolation
- **Primary Language:** English (with i18n support planned for future)

### Value Proposition
EssayCoach is an AI-powered essay education platform that revolutionizes traditional writing instruction through instant AI feedback, deep learning analytics, and intelligent grading assistance—differentiating itself from traditional Learning Management Systems (LMS).

---

## 2. Target Users & User Stories

### Primary Users (Visitors)

| Persona | Role | Goals |
|---------|------|-------|
| **University Administrator** | Dean, Department Head, Provost | Evaluate platforms for campus-wide writing program improvement |
| **High School Principal** | School Leadership | Find tools to enhance English writing instruction |
| **IT Director** | Technical Decision Maker | Assess technical feasibility, security, and integration capabilities |
| **Faculty Member** | Professor, Writing Instructor | Understand how platform reduces grading workload |

### User Stories

```
As a university administrator,
I want to understand how EssayCoach can improve student writing outcomes,
So that I can justify the investment to senior leadership.

As an IT director,
I want to know about security, data privacy, and integration options,
So that I can assess whether this meets our institution's compliance requirements.

As a high school principal,
I want to see evidence of improved student engagement and writing quality,
So that I can make informed decisions about adopting new technology.

As a faculty member,
I want to understand how much time EssayCoach can save on grading,
So that I can focus more on teaching and less on repetitive feedback.
```

---

## 3. Functional Requirements

### 3.1 Page Sections

| Section | Required | Description |
|---------|----------|-------------|
| **Navigation Bar** | Yes | Logo, Features, Solutions, Pricing, About, Contact, Login CTA |
| **Hero Section** | Yes | Primary value proposition, CTA buttons, hero image/video |
| **Social Proof** | Yes | Partner logos, testimonials, case study previews |
| **Features Overview** | Yes | Key platform capabilities with visuals |
| **How It Works** | Yes | Step-by-step explanation of the workflow |
| **AI Analytics Demo** | Yes | Interactive or video demonstration of analytics |
| **Security & Compliance** | Yes | Data protection, privacy, SOC2/GDPR mentions |
| **Pricing Preview** | No | "Contact Sales" or tiered pricing indication |
| **Footer** | Yes | Links, contact info, social media, legal |

### 3.2 Key Content Elements

#### Hero Section
- **Headline:** Clear value proposition (e.g., "AI-Powered Writing Education for Modern Institutions")
- **Subheadline:** Specific benefit for target users
- **Primary CTA:** "Request Demo" or "Schedule Consultation"
- **Secondary CTA:** "Watch Video" or "Learn More"
- **Visual:** Product screenshot, dashboard preview, or abstract education-themed imagery

#### Features Section
Each feature should include:
- Icon or illustration
- Feature title (3-5 words)
- Brief description (1-2 sentences)
- "Learn more" link

**Recommended Features to Showcase:**
1. **AI Instant Feedback** - Automated scoring and detailed feedback within minutes
2. **Fact Verification** - Source citation validation and credibility checking
3. **Learning Analytics** - Deep insights into student progress and薄弱环节
4. **Smart Rubric Management** - Create and manage customizable grading criteria
5. **Reduced Grading Workload** - AI-assisted grading with teacher oversight

#### Testimonials/Case Studies
- University or school name (anonymized if needed)
- Role of the person quoted
- Key metric or outcome (e.g., "40% reduction in grading time")
- Brief quote (2-3 sentences max)

### 3.3 Interactive Elements

| Element | Behavior |
|---------|----------|
| **Navigation** | Smooth scroll to page sections |
| **CTA Buttons** | Open contact form modal or redirect to contact page |
| **Video Player** | Embedded or modal video for product demo |
| **Analytics Preview** | Hover or click to see sample dashboard views |
| **Partner Logos** | Static display, optionally clickable to case studies |

### 3.4 SEO & Performance

| Requirement | Specification |
|-------------|---------------|
| **Meta Title** | EssayCoach - AI-Powered Writing Education Platform |
| **Meta Description** | Transform writing instruction with AI feedback, deep analytics, and intelligent grading for universities and high schools. |
| **OG Tags** | Complete Open Graph metadata for social sharing |
| **Loading Speed** | First Contentful Paint < 1.5s |
| **Mobile Responsive** | Fully responsive from 320px to 1920px+ |

---

## 4. UI/UX Requirements

> **⚠️ UI Design Placeholder**
>
> All UI/UX design will be created using Pencil (.pen file).
>
> **Design File:** `/docs/prd/ui.pen`
>
> - Wireframes, visual design mockups, component designs
> - Responsive layouts for mobile/tablet/desktop
> - Hero section, features grid, testimonials, footer designs

### 4.1 Design Direction

| Aspect | Guideline |
|--------|-----------|
| **Style** | Modern Minimal, Professional, Trust-building |
| **Color Scheme** | TBD (coordinate with overall EssayCoach brand) |
| **Typography** | Clean, readable, professional sans-serif |
| **Imagery** | High-quality education-themed photos, abstract tech illustrations |
| **Whitespace** | Generous spacing for premium feel |

### 4.2 Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | < 640px | Single column, stacked sections, hamburger menu |
| Tablet | 640-1024px | Two-column grids, condensed navigation |
| Desktop | > 1024px | Full layout, maximum content width 1200-1400px |

---

## 5. Technical Requirements

### 5.1 Implementation

| Aspect | Requirement |
|--------|-------------|
| **Framework** | Next.js (existing stack) |
| **Styling** | Tailwind CSS (existing stack) |
| **Deployment** | Vercel or similar static/SSR hosting |
| **Analytics** | Page view tracking, CTA click tracking |

### 5.2 Integration Points

| Integration | Purpose |
|-------------|---------|
| **Contact Form** | Submit leads to CRM or email |
| **Demo Booking** | Calendar integration (Cal.com or similar) |
| **Analytics** | Google Analytics or alternative |
| **Chat Widget** | Intercom, Drift, or similar for visitor support |

---

## 6. Out of Scope (Phase 1)

The following are intentionally excluded from the initial Landing Page:

- User authentication (handled by auth app)
- Product documentation access
- Free trial signup
- Direct payment/checkout
- Blog or content hub
- Multi-language support (Phase 2)

---

## 7. Success Metrics

### Key Performance Indicators

| Metric | Target (Launch) | Target (6 months) |
|--------|-----------------|-------------------|
| **Monthly Unique Visitors** | 1,000 | 5,000 |
| **Demo Request Conversion** | 2% | 4% |
| **Average Session Duration** | 2 minutes | 3 minutes |
| **Bounce Rate** | < 50% | < 40% |

### Tracking Requirements

- Google Analytics 4 or equivalent
- UTM parameter tracking for all campaign links
- Form submission tracking
- Video engagement tracking

---

## 8. Acceptance Criteria

### Functional Criteria

- [ ] Page loads without errors on all major browsers (Chrome, Firefox, Safari, Edge)
- [ ] All navigation links work correctly
- [ ] CTA buttons open contact form or external links
- [ ] Form submission captures required fields and sends to backend
- [ ] Mobile responsive design works at all breakpoints
- [ ] All images have proper alt text for accessibility
- [ ] Page passes basic accessibility audit (WCAG 2.1 A level)

### Performance Criteria

- [ ] Lighthouse Performance score > 80
- [ ] First Contentful Paint < 1.5 seconds
- [ ] No layout shift (CLS < 0.1)

### Content Criteria

- [ ] All text is in English
- [ ] No placeholder or lorem ipsum text
- [ ] All external links are valid
- [ ] Legal pages (Privacy Policy, Terms) linked in footer

---

## 9. Related Documentation

- [EssayCoach Platform Summary](../EssayCoach%20Platform%20Summary.md)
- [Design Philosophy](../DESIGN_PHILOSOPHY.md)
- [API Endpoints](../API_ENDPOINTS.md)

---

## MVP Boundary

### In Scope (MVP)
- Hero section, value proposition, and primary CTA to Sign In/Sign Up
- Feature highlights, social proof/testimonials, and pricing preview
- Footer with legal links and basic SEO metadata

### Out of Scope (Post-MVP)
- CMS-driven landing content management
- A/B testing and personalization
- Multi-language landing variants

### Current Implementation Alignment
- Current frontend implementation is focused on dashboard/auth pages; this page remains planned.

## Edge, Loading, and Error States

### Loading States
| Scenario | UI Pattern |
|----------|------------|
| Initial page render | Lightweight skeleton for hero and feature cards |
| CTA prefetch | Button loading state when navigation prefetch fails |

### Error States
| Scenario | User Message | Recovery |
|----------|--------------|----------|
| Content fetch failure (if dynamic content enabled later) | Failed to load page content. | Retry button and fallback static copy |
| Broken external link | This link is currently unavailable. | Open in new tab or return to home |

### Empty States
| Scenario | User Message | Action |
|----------|--------------|--------|
| No testimonials configured | More student success stories coming soon. | Continue to features/pricing |

