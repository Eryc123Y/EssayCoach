# Essay Practice

> **Status:** UI/UX Defined
> **Last Updated:** 2026-02-15

---

## 1. Overview

### Purpose
The Essay Practice feature is a student-centric tool designed for self-directed learning and skill improvement. It provides a low-stakes environment where students can practice writing, submit existing work for review, and receive comprehensive, constructive feedback from an AI-powered "Essay Review Agent."

### Product Context
- **Target User:** Students (Self-learners)
- **Role:** Personal practice and skill development (Independent of formal assignments)
- **Parent Feature:** Student Dashboard

---

## 2. Target Users & User Stories

### Primary Users

| Persona | Role | Goals |
|---------|------|-------|
| **Aspiring Writer** | Student | Improve essay structure and flow through repeated practice |
| **Exam Candidate** | Student | Practice writing under specific rubrics to prepare for assessments |
| **Self-Learner** | Independent | Get constructive, non-judgmental feedback on their writing |

### User Stories

```
As a student,
I want to provide my writing question or goal along with my essay,
So that the AI feedback is tailored to my specific objective.

As a student,
I want to choose how I submit my essay (writing in-app, uploading a file, or pasting text),
So that I can get feedback on work I've already started elsewhere or start fresh.

As a student,
I want to receive a detailed AI feedback report that covers more than just a grade,
So that I can understand the "why" behind the feedback and how to improve my writing process.

As a student,
I want to chat with an AI coach about my feedback,
So that I can ask clarifying questions and get specific examples for improvement.

As a student,
I want to see how my writing has improved compared to my previous drafts,
So that I can track my progress and stay motivated.

As a student,
I want to see a visual map of my writing skills (e.g., Grammar, Logic, Tone),
So that I can identify which areas need the most focus.
```

---

## 3. Functional Requirements: Submission & Feedback UI

### 3.1 Submission & Personalization (UI Elements)

| Element | Description |
|---------|-------------|
| **Submission Selector** | A segmented control or tab bar to toggle between: **Write**, **Upload**, and **Paste**. |
| **Writing Question/Goal** | A mandatory text field (or large input) where the student defines the prompt, question, or specific goal they are addressing. |
| **Audience & Tone Settings** | Optional dropdowns to set the **Target Audience** (e.g., Academic, Professional) and **Desired Tone** (e.g., Persuasive, Analytical). |
| **Rich Text Editor** | A WYSIWYG writing area with a formatting toolbar. Includes a sticky footer with real-time word count and "Last Saved" timestamp. |
| **Rubric Selector** | A searchable list of rubrics. Includes a "Recommended" tag for students based on their skill level. |

### 3.2 The Feedback Report (UI Elements)

The final report is composed of the following visual sections:

| UI Section | Element | Description |
|------------|---------|-------------|
| **Summary Banner** | **Overall Grade & Mastery** | A prominent score (0-100%) alongside a **Skill Radar Chart** showing mastery in Grammar, Logic, Tone, etc. |
| | **Action Buttons** | Includes **Export Report (PDF)**, **Revise Essay**, and **Practice Again**. |
| | **Encouragement Headline** | A short, positive headline (e.g., "Excellent Progress on Structure!"). |
| **Marked Submission** | **Annotated Essay View** | A full-text view of the student's essay with inline highlights. Different colors represent different issue types: **Grammar** (Red), **Word Choice** (Blue), **Logic/Flow** (Purple), and **Misinformation/Facts** (Orange). Clicking a highlight reveals a tooltip with the explanation and suggestion. |
| **Holistic View** | **General Feedback** | A multi-paragraph card providing a broad overview of the essay's strengths and core areas for growth. |
| | **Progress Diff** | A "What's Improved" callout comparing the current submission to the previous draft (if applicable). |
| **The "Engine"** | **Logic & Structure** | A dedicated card focusing on the "inner workings" of the essay: **Logic**, **Structure**, and **Argumentation**. |
| **Rubric Breakdown** | **Criterion Cards** | A list of cards (one per rubric criterion). Each shows the score, level, justification, and a link to a **"High-Scoring Exemplar"**. |
| **Technical Check** | **Grammar & Style List** | A categorized list of technical suggestions with "Original vs. Suggested" comparisons. |
| **Interactive Coach** | **AI Feedback Chat** | A persistent chat interface allowing students to ask questions specifically about the generated report. |

---

## 4. UI/UX Requirements

### 4.1 Page 1: Essay Submission (Practice Mode)
- **Layout**: Split view on desktop. Left (Submission Area), Right (Personalization & Rubric Selection).
- **Personalization**: Students can select their "Goal" for the session (e.g., "Improve my logic" or "Fix my grammar") to tailor the AI's focus.
- **Action**: Primary "Get AI Feedback" button.

### 4.2 Page 2: AI Feedback Report
- **Visual Hierarchy**:
    1. **Top Section**: Summary Banner (Grade + Skill Radar Chart + **Export Report Button**).
    2. **Primary Content**: **Annotated Essay View** (The student's essay with inline marks and comments).
    3. **Secondary Content (Grid)**: Holistic View (General Feedback + Progress Diff) and The "Engine" (Logic/Structure) side-by-side.
    4. **Bottom Section**: Rubric Breakdown (Full width) with inline "See Example" links.
    5. **Floating/Sidebar**: **AI Coach Chat** for immediate follow-up questions.
- **Action Bar (Sticky Footer)**:
    - **Revise Essay**: Navigates back to the Editor with the original content.
    - **Export Report**: Triggers a PDF generation of the full report and annotated essay.
    - **Practice Again**: Clears content and returns to Page 1.

---

## 5. Data Model (UI-Centric)

```typescript
interface AIReviewReportUI {
  id: string;
  submissionId: string;
  writingGoal: string; // The prompt or question being addressed
  
  // Summary Section
  overallScore: number; 
  headline: string;
  skillMastery: { // For Radar Chart
    grammar: number;
    logic: number;
    tone: number;
    structure: number;
    vocabulary: number;
  };
  
  // Progress Tracking
  improvementNotes?: string; // "Your logic score increased by 15%!"
  
  // Holistic Section
  generalFeedback: string;
  bestFeature: string;
  
  // Engine Section
  engineComments: {
    logic: string;
    structure: string;
    argumentation: string;
  };
  
  // Rubric Section
  rubricResults: {
    criterionName: string;
    score: number;
    maxScore: number;
    levelName: string;
    justification: string;
    exemplarLink?: string; // Link to a high-scoring example
  }[];
  
  // Technical Section
  technicalSuggestions: {
    type: 'grammar' | 'spelling' | 'style' | 'logic' | 'fact';
    original: string;
    suggested: string;
    explanation: string;
    startIndex: number; // For inline highlighting
    endIndex: number;   // For inline highlighting
  }[];
  
  // Chat History
  chatSessionId?: string;
  
  generatedAt: Date;
}
```

---

## 6. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v2/practice/submit` | Submit essay with Tone/Audience settings. |
| GET | `/api/v2/practice/report/{id}` | Retrieve the full report including Skill Mastery data. |
| POST | `/api/v2/practice/chat` | Send a message to the AI Coach about a specific report. |
| GET | `/api/v2/practice/mastery` | Get the student's historical Skill Mastery data for the Radar Chart. |

---

## 7. Acceptance Criteria (UI Focus)

- [ ] Students can set Target Audience and Tone before submitting.
- [ ] Students must provide a Writing Question/Goal before the submission button is enabled.
- [ ] The **Annotated Essay View** correctly displays color-coded highlights for different issue types.
- [ ] Clicking an inline highlight reveals a tooltip with a detailed explanation and suggestion.
- [ ] The **Export Report** button generates a comprehensive PDF including the summary, rubric breakdown, and annotated essay.
- [ ] The Skill Radar Chart correctly visualizes the student's performance across categories.
- [ ] The "Progress Diff" only appears if the student has a previous submission for the same rubric.
- [ ] The AI Coach Chat is context-aware (it knows the content of the current report).
- [ ] "High-Scoring Exemplars" are accessible directly from the rubric criterion cards.

---

## MVP Boundary

### In Scope (MVP)
- Multi-step essay practice flow (input -> analysis -> feedback)
- AI analysis trigger with rubric/task context and actionable feedback rendering
- Core revision support and progress visibility in the same workflow

### Out of Scope (Post-MVP)
- Real-time collaborative editing
- Voice-driven coaching interactions
- Auto-generated weekly writing plans

### Current Implementation Alignment
- Implemented at dashboard essay-analysis routes with tested analyzing/loading/error branches.

## Edge, Loading, and Error States

### Loading States
| Scenario | UI Pattern |
|----------|------------|
| AI analysis in progress | Step-level loading state with progress messaging |
| Feedback panels render | Section skeleton placeholders |

### Error States
| Scenario | User Message | Recovery |
|----------|--------------|----------|
| Missing rubric/context | Please select a rubric before analysis. | Return to input step |
| AI workflow failure | Analysis failed. Please try again. | Retry analysis |
| API/network failure | Unable to analyze essay right now. | Retry with preserved draft |

### Empty States
| Scenario | User Message | Action |
|----------|--------------|--------|
| No essay input | Start by writing or pasting your essay. | Focus textarea |
| No feedback generated | No analysis yet. Submit essay to get feedback. | Analyze button |

