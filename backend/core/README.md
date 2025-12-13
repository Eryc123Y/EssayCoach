# Core App

## Overview
The core app serves as the central repository for all database models in the EssayCoach platform. This app consolidates all entities that were previously spread across multiple apps into a single, cohesive location.

## Purpose
- Centralizes all database models
- Eliminates circular dependencies between apps
- Provides a single source of truth for data structures
- Simplifies database migrations and management

## Models
This app contains the following entities:

### User Management
- **User**: Extended Django user model for students, lecturers, and admins

### Academic Structure
- **Unit**: Academic units/courses
- **Class**: Class sections within units
- **Enrollment**: Student enrollments in classes
- **TeachingAssignment**: Teacher assignments to classes

### Assessment Framework
- **MarkingRubric**: Rubrics created by lecturers for assessment
- **RubricItem**: Individual criteria within rubrics
- **RubricLevelDesc**: Score level descriptions for rubric items

### Task and Submission
- **Task**: Assignment tasks created for units
- **Submission**: Student essay submissions
- **Feedback**: Feedback given on submissions
- **FeedbackItem**: Individual feedback items per rubric criteria

## Usage
All models can be imported directly from the core app:

```python
from core.models import User, Unit, Class, Task, Submission
```

## Dependencies
- Django's built-in authentication system
- Django ORM for database operations
