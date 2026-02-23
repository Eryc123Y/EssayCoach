# Learnings

This section documents the knowledge, insights, and reflections from the EssayCoach development team.

## Purpose

The Learnings section serves as a knowledge base for:

1. **Team Knowledge Transfer** - Document what was done and why
2. **Historical Context** - Understand decisions made during development
3. **Pattern Recognition** - Identify reusable solutions and patterns
4. **Continuous Improvement** - Reflect on what worked and what didn't

## How to Contribute

When completing a task, team members should document:

1. **What was done** - Technical implementation details
2. **Why it's correct** - Reasoning and verification
3. **Key insights** - Lessons learned and patterns discovered
4. **Areas for improvement** - What could be done better

## Template

When adding a new learning document, use this structure:

```markdown
# [Task Name] - Learning Document

## Summary
Brief description of what was accomplished.

## Implementation Details
Technical details of the implementation.

## Why It's Correct
Explanation of why this approach was chosen and how it was verified.

## Key Insights
Important learnings and patterns discovered during this work.

## Areas for Improvement
What could be done differently in the future.

## Related Files
- File 1
- File 2

## References
- External resources or documentation
```

## Recent Learnings

### 2026-02-24: Codex Security Review

A comprehensive security audit was conducted using OpenAI Codex, identifying 9 critical issues across the codebase.

- **Review Team**: reviewer, architect, explorer
- **Issues Found**: 9 (all confirmed)
- **Critical Issues**: RBAC permissions, Cookie security, API v1 cleanup
- **Status**: 3 fixed, 6 pending

See: [Codex Security Review Details](./codex-security-review-2026-02-24.md)
