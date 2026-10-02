# Database ERD Diagram
Generated: 2026-10-01 11:04:54
---

## 📊 Visual Schema Representation

The complete entity-relationship diagram for the EssayCoach database system is generated from the Django models.

> **Note**: This ERD is automatically generated from Django models during documentation build. Run `make docs-erd` or `make docs-generate` to regenerate.

## 🖼️ Database Schema Diagram

```mermaid
erDiagram
    %% django.contrib.admin - LogEntry
    LogEntry {
        id AutoField PK
        action_time DateTimeField
        user ForeignKey FK "User.id"
        content_type ForeignKey FK "ContentType.id"
        object_id TextField NULL
        object_repr CharField
        action_flag PositiveSmallIntegerField
        change_message TextField
    }

    %% django.contrib.auth - Permission
    Permission {
        id AutoField PK
        name CharField
        content_type ForeignKey FK "ContentType.id"
        codename CharField
    }

    %% django.contrib.auth - Group
    Group {
        id AutoField PK
        name CharField
    }

    %% django.contrib.contenttypes - ContentType
    ContentType {
        id AutoField PK
        logentry ForeignKey FK "LogEntry.id"
        permission ForeignKey FK "Permission.id"
        app_label CharField
        model CharField
    }

    %% django.contrib.sessions - Session
    Session {
        session_key CharField PK
        session_data TextField
        expire_date DateTimeField
    }

    %% core - Class
    Class {
        class_id SmallAutoField PK
        enrollment ForeignKey FK "Enrollment.id"
        leave_requests ForeignKey FK "ClassLeaveRequest.id"
        task ForeignKey FK "Task.id"
        teachingassn ForeignKey FK "TeachingAssn.id"
        shared_essays ForeignKey FK "SharedEssay.id"
        posting_bans ForeignKey FK "SocialPostingBan.id"
        invitation ForeignKey FK "Invitation.id"
        unit_id_unit ForeignKey FK "Unit.id"
        class_name CharField
        class_desc TextField NULL
        class_join_code CharField
        class_term CharField
        class_year PositiveSmallIntegerField
        class_status CharField
        class_archived_at DateTimeField NULL
        class_size SmallIntegerField
    }

    %% core - Enrollment
    Enrollment {
        enrollment_id AutoField PK
        user_id_user ForeignKey FK "User.id"
        class_id_class ForeignKey FK "Class.id"
        unit_id_unit ForeignKey FK "Unit.id"
        enrollment_time DateTimeField
    }

    %% core - ClassLeaveRequest
    ClassLeaveRequest {
        id BigAutoField PK
        student ForeignKey FK "User.id"
        class_obj ForeignKey FK "Class.id"
        status CharField
        reason TextField
        requested_at DateTimeField
        decided_at DateTimeField NULL
        decided_by ForeignKey FK "User.id"
    }

    %% core - Feedback
    Feedback {
        feedback_id AutoField PK
        audit_events ForeignKey FK "AssessmentAuditEvent.id"
        feedbackitem ForeignKey FK "FeedbackItem.id"
        submission_id_submission OneToOneField FK "Submission.id"
        user_id_user ForeignKey FK "User.id"
        status CharField
        ai_proposal JSONField NULL
        rubric_snapshot JSONField NULL
        reviewed_by ForeignKey FK "User.id"
        reviewed_at DateTimeField NULL
        published_by ForeignKey FK "User.id"
        published_at DateTimeField NULL
        final_score DecimalField NULL
        version PositiveIntegerField
    }

    %% core - AssessmentAuditEvent
    AssessmentAuditEvent {
        event_id BigAutoField PK
        feedback ForeignKey FK "Feedback.id"
        actor ForeignKey FK "User.id"
        action CharField
        created_at DateTimeField
        details JSONField
    }

    %% core - SupportTicket
    SupportTicket {
        ticket_id BigAutoField PK
        user ForeignKey FK "User.id"
        subject CharField
        description TextField
        status CharField
        priority CharField
        staff_reply TextField
        handled_by ForeignKey FK "User.id"
        created_at DateTimeField
        updated_at DateTimeField
    }

    %% core - Notification
    Notification {
        notification_id BigAutoField PK
        user ForeignKey FK "User.id"
        event_key CharField
        kind CharField
        title_en CharField
        title_zh CharField
        body_en CharField
        body_zh CharField
        link CharField
        in_app_visible BooleanField
        read_at DateTimeField NULL
        created_at DateTimeField
    }

    %% core - HelpArticleVote
    HelpArticleVote {
        vote_id BigAutoField PK
        user ForeignKey FK "User.id"
        article_slug CharField
        helpful BooleanField
        updated_at DateTimeField
    }

    %% core - AdminAuditEvent
    AdminAuditEvent {
        event_id BigAutoField PK
        actor ForeignKey FK "User.id"
        target ForeignKey FK "User.id"
        target_email CharField
        action CharField
        reason TextField
        created_at DateTimeField
    }

    %% core - PasswordResetGrant
    PasswordResetGrant {
        grant_id BigAutoField PK
        user ForeignKey FK "User.id"
        issued_by ForeignKey FK "User.id"
        token_hash CharField
        created_at DateTimeField
        expires_at DateTimeField
        used_at DateTimeField NULL
    }

    %% core - EmailChangeGrant
    EmailChangeGrant {
        grant_id BigAutoField PK
        user ForeignKey FK "User.id"
        old_email CharField
        new_email CharField
        token_hash CharField
        created_at DateTimeField
        expires_at DateTimeField
        used_at DateTimeField NULL
    }

    %% core - AIJob
    AIJob {
        job_id UUIDField PK
        submission OneToOneField FK "Submission.id"
        status CharField
        provider CharField
        model CharField
        attempts PositiveSmallIntegerField
        lease_expires_at DateTimeField NULL
        created_at DateTimeField
        started_at DateTimeField NULL
        finished_at DateTimeField NULL
        result JSONField NULL
        usage JSONField NULL
        provider_thread_id CharField
        error_category CharField
        error_message TextField
    }

    %% core - PracticeEssay
    PracticeEssay {
        essay_id UUIDField PK
        revisions ForeignKey FK "PracticeRevision.id"
        student ForeignKey FK "User.id"
        goal TextField
        content TextField
        language CharField
        audience CharField
        tone CharField
        rubric ForeignKey FK "MarkingRubric.id"
        version PositiveIntegerField
        created_at DateTimeField
        updated_at DateTimeField
    }

    %% core - PracticeRevision
    PracticeRevision {
        revision_id UUIDField PK
        run OneToOneField FK "PracticeRun.id"
        essay ForeignKey FK "PracticeEssay.id"
        number PositiveIntegerField
        goal TextField
        content TextField
        language CharField
        audience CharField
        tone CharField
        rubric_snapshot JSONField NULL
        created_at DateTimeField
    }

    %% core - PracticeRun
    PracticeRun {
        run_id UUIDField PK
        evidence ForeignKey FK "PracticeEvidence.id"
        chat_turns ForeignKey FK "PracticeChatTurn.id"
        revision OneToOneField FK "PracticeRevision.id"
        status CharField
        provider CharField
        model CharField
        attempts PositiveSmallIntegerField
        lease_expires_at DateTimeField NULL
        created_at DateTimeField
        started_at DateTimeField NULL
        finished_at DateTimeField NULL
        report JSONField NULL
        usage JSONField NULL
        provider_thread_id CharField
        error_category CharField
        error_message TextField
    }

    %% core - PracticeEvidence
    PracticeEvidence {
        evidence_id BigAutoField PK
        run ForeignKey FK "PracticeRun.id"
        claim TextField
        query CharField
        verdict CharField
        rationale TextField
        source_title CharField
        source_url CharField
        source_excerpt TextField
        supporting_quote TextField
        retrieved_at DateTimeField NULL
    }

    %% core - PracticeChatTurn
    PracticeChatTurn {
        turn_id UUIDField PK
        run ForeignKey FK "PracticeRun.id"
        question TextField
        answer TextField
        status CharField
        model CharField
        attempts PositiveSmallIntegerField
        lease_expires_at DateTimeField NULL
        created_at DateTimeField
        started_at DateTimeField NULL
        finished_at DateTimeField NULL
        usage JSONField NULL
        provider_thread_id CharField
        error_category CharField
        error_message TextField
    }

    %% core - FeedbackItem
    FeedbackItem {
        feedback_item_id AutoField PK
        feedback_id_feedback ForeignKey FK "Feedback.id"
        rubric_item_id_rubric_item ForeignKey FK "RubricItem.id"
        feedback_item_score SmallIntegerField
        feedback_item_comment TextField NULL
        feedback_item_source CharField
    }

    %% core - MarkingRubric
    MarkingRubric {
        rubric_id AutoField PK
        practiceessay ForeignKey FK "PracticeEssay.id"
        rubric_items ForeignKey FK "RubricItem.id"
        task ForeignKey FK "Task.id"
        user_id_user ForeignKey FK "User.id"
        rubric_create_time DateTimeField
        rubric_desc CharField NULL
        visibility CharField
    }

    %% core - RubricItem
    RubricItem {
        rubric_item_id AutoField PK
        feedbackitem ForeignKey FK "FeedbackItem.id"
        level_descriptions ForeignKey FK "RubricLevelDesc.id"
        rubric_id_marking_rubric ForeignKey FK "MarkingRubric.id"
        rubric_item_name CharField
        rubric_item_weight DecimalField
        exemplar_text TextField
    }

    %% core - RubricLevelDesc
    RubricLevelDesc {
        level_desc_id AutoField PK
        rubric_item_id_rubric_item ForeignKey FK "RubricItem.id"
        level_min_score SmallIntegerField
        level_max_score SmallIntegerField
        level_desc TextField
    }

    %% core - DeadlineExtension
    DeadlineExtension {
        extension_id AutoField PK
        task_id_task ForeignKey FK "Task.id"
        user_id_user ForeignKey FK "User.id"
        original_deadline DateTimeField
        extended_deadline DateTimeField
        reason TextField
        granted_by ForeignKey FK "User.id"
        created_at DateTimeField
    }

    %% core - Submission
    Submission {
        submission_id AutoField PK
        feedback OneToOneField FK "Feedback.id"
        ai_job OneToOneField FK "AIJob.id"
        social_share OneToOneField FK "SharedEssay.id"
        submission_time DateTimeField
        task_id_task ForeignKey FK "Task.id"
        user_id_user ForeignKey FK "User.id"
        submission_txt TextField
    }

    %% core - Task
    Task {
        task_id AutoField PK
        deadline_extensions ForeignKey FK "DeadlineExtension.id"
        submission ForeignKey FK "Submission.id"
        unit_id_unit ForeignKey FK "Unit.id"
        rubric_id_marking_rubric ForeignKey FK "MarkingRubric.id"
        rubric_snapshot JSONField NULL
        rubric_version PositiveIntegerField
        task_publish_datetime DateTimeField
        task_due_datetime DateTimeField
        task_title CharField
        task_desc TextField NULL
        task_instructions TextField
        class_id_class ForeignKey FK "Class.id"
        task_status CharField
        task_allow_late_submission BooleanField
        task_allow_resubmission BooleanField
    }

    %% core - TeachingAssn
    TeachingAssn {
        teaching_assn_id SmallAutoField PK
        user_id_user ForeignKey FK "User.id"
        class_id_class ForeignKey FK "Class.id"
    }

    %% core - Unit
    Unit {
        unit_id CharField PK
        class ForeignKey FK "Class.id"
        enrollment ForeignKey FK "Enrollment.id"
        task ForeignKey FK "Task.id"
        course_lead_assignments ForeignKey FK "CourseLeadAssignment.id"
        invitation ForeignKey FK "Invitation.id"
        unit_name CharField
        unit_desc TextField NULL
    }

    %% core - User
    User {
        user_id AutoField PK
        logentry ForeignKey FK "LogEntry.id"
        enrollment ForeignKey FK "Enrollment.id"
        class_leave_requests ForeignKey FK "ClassLeaveRequest.id"
        leave_decisions ForeignKey FK "ClassLeaveRequest.id"
        feedback ForeignKey FK "Feedback.id"
        reviewed_feedbacks ForeignKey FK "Feedback.id"
        published_feedbacks ForeignKey FK "Feedback.id"
        assessmentauditevent ForeignKey FK "AssessmentAuditEvent.id"
        support_tickets ForeignKey FK "SupportTicket.id"
        handled_tickets ForeignKey FK "SupportTicket.id"
        notifications ForeignKey FK "Notification.id"
        help_article_votes ForeignKey FK "HelpArticleVote.id"
        admin_actions ForeignKey FK "AdminAuditEvent.id"
        admin_history ForeignKey FK "AdminAuditEvent.id"
        password_reset_grants ForeignKey FK "PasswordResetGrant.id"
        issued_password_resets ForeignKey FK "PasswordResetGrant.id"
        email_change_grants ForeignKey FK "EmailChangeGrant.id"
        practice_essays ForeignKey FK "PracticeEssay.id"
        markingrubric ForeignKey FK "MarkingRubric.id"
        deadline_extensions ForeignKey FK "DeadlineExtension.id"
        granted_extensions ForeignKey FK "DeadlineExtension.id"
        submission ForeignKey FK "Submission.id"
        teachingassn ForeignKey FK "TeachingAssn.id"
        shared_essays ForeignKey FK "SharedEssay.id"
        social_interactions ForeignKey FK "SocialInteraction.id"
        social_reports ForeignKey FK "ContentReport.id"
        resolved_social_reports ForeignKey FK "ContentReport.id"
        posting_bans ForeignKey FK "SocialPostingBan.id"
        issued_posting_bans ForeignKey FK "SocialPostingBan.id"
        organizationsettings ForeignKey FK "OrganizationSettings.id"
        auth_sessions ForeignKey FK "AuthSession.id"
        login_events ForeignKey FK "LoginEvent.id"
        course_lead_assignments ForeignKey FK "CourseLeadAssignment.id"
        assigned_course_leads ForeignKey FK "CourseLeadAssignment.id"
        issued_invitations ForeignKey FK "Invitation.id"
        userbadge ForeignKey FK "UserBadge.id"
        last_login DateTimeField NULL
        is_superuser BooleanField
        user_email CharField
        user_fname CharField NULL
        user_lname CharField NULL
        user_role CharField
        user_status CharField
        auth_version PositiveIntegerField
        password CharField
        is_active BooleanField
        is_staff BooleanField
        date_joined DateTimeField
        bio CharField
        avatar_url CharField
        profile_visibility CharField
        profile_show_essays BooleanField
        profile_show_scores BooleanField
        preferences JSONField
    }

    %% core - SharedEssay
    SharedEssay {
        share_id BigAutoField PK
        interactions ForeignKey FK "SocialInteraction.id"
        reports ForeignKey FK "ContentReport.id"
        submission OneToOneField FK "Submission.id"
        owner ForeignKey FK "User.id"
        class_obj ForeignKey FK "Class.id"
        visibility CharField
        caption CharField
        tags JSONField
        status CharField
        created_at DateTimeField
        updated_at DateTimeField
    }

    %% core - SocialInteraction
    SocialInteraction {
        interaction_id BigAutoField PK
        contentreport ForeignKey FK "ContentReport.id"
        share ForeignKey FK "SharedEssay.id"
        user ForeignKey FK "User.id"
        interaction_type CharField
        content TextField
        created_at DateTimeField
        updated_at DateTimeField
    }

    %% core - ContentReport
    ContentReport {
        report_id BigAutoField PK
        share ForeignKey FK "SharedEssay.id"
        interaction ForeignKey FK "SocialInteraction.id"
        reporter ForeignKey FK "User.id"
        reason CharField
        description TextField
        status CharField
        decision CharField
        resolved_by ForeignKey FK "User.id"
        resolved_at DateTimeField NULL
        created_at DateTimeField
        updated_at DateTimeField
    }

    %% core - SocialPostingBan
    SocialPostingBan {
        ban_id BigAutoField PK
        user ForeignKey FK "User.id"
        class_obj ForeignKey FK "Class.id"
        expires_at DateTimeField
        reason CharField
        created_by ForeignKey FK "User.id"
        created_at DateTimeField
    }

    %% core - OrganizationSettings
    OrganizationSettings {
        setting_id PositiveSmallIntegerField PK
        name CharField
        logo_url CharField
        primary_color CharField
        updated_at DateTimeField
        updated_by ForeignKey FK "User.id"
    }

    %% core - AuthSession
    AuthSession {
        session_id UUIDField PK
        user ForeignKey FK "User.id"
        refresh_jti CharField
        device CharField
        ip_address GenericIPAddressField NULL
        created_at DateTimeField
        last_activity DateTimeField
        expires_at DateTimeField
        revoked_at DateTimeField NULL
    }

    %% core - LoginEvent
    LoginEvent {
        event_id BigAutoField PK
        user ForeignKey FK "User.id"
        created_at DateTimeField
    }

    %% core - LoginRateLimit
    LoginRateLimit {
        id BigAutoField PK
        account_hash CharField
        failure_count PositiveSmallIntegerField
        window_started_at DateTimeField
        locked_until DateTimeField NULL
    }

    %% core - WorkerHeartbeat
    WorkerHeartbeat {
        worker_id PositiveSmallIntegerField PK
        last_seen_at DateTimeField
        processed_jobs PositiveIntegerField
    }

    %% core - CourseLeadAssignment
    CourseLeadAssignment {
        id BigAutoField PK
        user_id_user ForeignKey FK "User.id"
        unit_id_unit ForeignKey FK "Unit.id"
        assigned_at DateTimeField
        assigned_by ForeignKey FK "User.id"
    }

    %% core - Invitation
    Invitation {
        id BigAutoField PK
        token_hash CharField
        email CharField
        role CharField
        class_id_class ForeignKey FK "Class.id"
        lead_unit ForeignKey FK "Unit.id"
        invited_by ForeignKey FK "User.id"
        created_at DateTimeField
        expires_at DateTimeField
        accepted_at DateTimeField NULL
        revoked_at DateTimeField NULL
    }

    %% core - Badge
    Badge {
        badge_id AutoField PK
        userbadge ForeignKey FK "UserBadge.id"
        name CharField
        description CharField
        icon CharField
        criteria JSONField
        created_at DateTimeField
    }

    %% core - UserBadge
    UserBadge {
        user_badge_id AutoField PK
        user_id_user ForeignKey FK "User.id"
        badge_id_badge ForeignKey FK "Badge.id"
        earned_at DateTimeField
    }

    %% Relationships
    LogEntry }o--{ User : "user"
    LogEntry }o--{ ContentType : "content_type"
    Permission }o--{ ContentType : "content_type"
    ContentType }o--{ LogEntry : "logentry"
    ContentType }o--{ Permission : "permission"
    Class }o--{ Enrollment : "enrollment"
    Class }o--|| ClassLeaveRequest : "leave_requests"
    Class }o--{ Task : "task"
    Class }o--{ TeachingAssn : "teachingassn"
    Class }o--|| SharedEssay : "shared_essays"
    Class }o--|| SocialPostingBan : "posting_bans"
    Class }o--{ Invitation : "invitation"
    Class }o--{ Unit : "unit_id_unit"
    Enrollment }o--{ User : "user_id_user"
    Enrollment }o--{ Class : "class_id_class"
    Enrollment }o--{ Unit : "unit_id_unit"
    ClassLeaveRequest }o--{ User : "student"
    ClassLeaveRequest }o--{ Class : "class_obj"
    ClassLeaveRequest }o--{ User : "decided_by"
    Feedback }o--|| AssessmentAuditEvent : "audit_events"
    Feedback }o--{ FeedbackItem : "feedbackitem"
    Feedback ||--|| Submission : "submission_id_submission"
    Feedback }o--{ User : "user_id_user"
    Feedback }o--{ User : "reviewed_by"
    Feedback }o--{ User : "published_by"
    AssessmentAuditEvent }o--{ Feedback : "feedback"
    AssessmentAuditEvent }o--{ User : "actor"
    SupportTicket }o--{ User : "user"
    SupportTicket }o--{ User : "handled_by"
    Notification }o--{ User : "user"
    HelpArticleVote }o--{ User : "user"
    AdminAuditEvent }o--{ User : "actor"
    AdminAuditEvent }o--{ User : "target"
    PasswordResetGrant }o--{ User : "user"
    PasswordResetGrant }o--{ User : "issued_by"
    EmailChangeGrant }o--{ User : "user"
    AIJob ||--|| Submission : "submission"
    PracticeEssay }o--|| PracticeRevision : "revisions"
    PracticeEssay }o--{ User : "student"
    PracticeEssay }o--{ MarkingRubric : "rubric"
    PracticeRevision ||--|| PracticeRun : "run"
    PracticeRevision }o--{ PracticeEssay : "essay"
    PracticeRun }o--|| PracticeEvidence : "evidence"
    PracticeRun }o--|| PracticeChatTurn : "chat_turns"
    PracticeRun ||--|| PracticeRevision : "revision"
    PracticeEvidence }o--{ PracticeRun : "run"
    PracticeChatTurn }o--{ PracticeRun : "run"
    FeedbackItem }o--{ Feedback : "feedback_id_feedback"
    FeedbackItem }o--{ RubricItem : "rubric_item_id_rubric_item"
    MarkingRubric }o--{ PracticeEssay : "practiceessay"
    MarkingRubric }o--|| RubricItem : "rubric_items"
    MarkingRubric }o--{ Task : "task"
    MarkingRubric }o--{ User : "user_id_user"
    RubricItem }o--{ FeedbackItem : "feedbackitem"
    RubricItem }o--|| RubricLevelDesc : "level_descriptions"
    RubricItem }o--{ MarkingRubric : "rubric_id_marking_rubric"
    RubricLevelDesc }o--{ RubricItem : "rubric_item_id_rubric_item"
    DeadlineExtension }o--{ Task : "task_id_task"
    DeadlineExtension }o--{ User : "user_id_user"
    DeadlineExtension }o--{ User : "granted_by"
    Submission ||--|| Feedback : "feedback"
    Submission ||--|| AIJob : "ai_job"
    Submission ||--|| SharedEssay : "social_share"
    Submission }o--{ Task : "task_id_task"
    Submission }o--{ User : "user_id_user"
    Task }o--|| DeadlineExtension : "deadline_extensions"
    Task }o--{ Submission : "submission"
    Task }o--{ Unit : "unit_id_unit"
    Task }o--{ MarkingRubric : "rubric_id_marking_rubric"
    Task }o--{ Class : "class_id_class"
    TeachingAssn }o--{ User : "user_id_user"
    TeachingAssn }o--{ Class : "class_id_class"
    Unit }o--{ Class : "class"
    Unit }o--{ Enrollment : "enrollment"
    Unit }o--{ Task : "task"
    Unit }o--|| CourseLeadAssignment : "course_lead_assignments"
    Unit }o--{ Invitation : "invitation"
    User }o--{ LogEntry : "logentry"
    User }o--{ Enrollment : "enrollment"
    User }o--|| ClassLeaveRequest : "class_leave_requests"
    User }o--|| ClassLeaveRequest : "leave_decisions"
    User }o--{ Feedback : "feedback"
    User }o--|| Feedback : "reviewed_feedbacks"
    User }o--|| Feedback : "published_feedbacks"
    User }o--{ AssessmentAuditEvent : "assessmentauditevent"
    User }o--|| SupportTicket : "support_tickets"
    User }o--|| SupportTicket : "handled_tickets"
    User }o--|| Notification : "notifications"
    User }o--|| HelpArticleVote : "help_article_votes"
    User }o--|| AdminAuditEvent : "admin_actions"
    User }o--|| AdminAuditEvent : "admin_history"
    User }o--|| PasswordResetGrant : "password_reset_grants"
    User }o--|| PasswordResetGrant : "issued_password_resets"
    User }o--|| EmailChangeGrant : "email_change_grants"
    User }o--|| PracticeEssay : "practice_essays"
    User }o--{ MarkingRubric : "markingrubric"
    User }o--|| DeadlineExtension : "deadline_extensions"
    User }o--|| DeadlineExtension : "granted_extensions"
    User }o--{ Submission : "submission"
    User }o--{ TeachingAssn : "teachingassn"
    User }o--|| SharedEssay : "shared_essays"
    User }o--|| SocialInteraction : "social_interactions"
    User }o--|| ContentReport : "social_reports"
    User }o--|| ContentReport : "resolved_social_reports"
    User }o--|| SocialPostingBan : "posting_bans"
    User }o--|| SocialPostingBan : "issued_posting_bans"
    User }o--{ OrganizationSettings : "organizationsettings"
    User }o--|| AuthSession : "auth_sessions"
    User }o--|| LoginEvent : "login_events"
    User }o--|| CourseLeadAssignment : "course_lead_assignments"
    User }o--|| CourseLeadAssignment : "assigned_course_leads"
    User }o--|| Invitation : "issued_invitations"
    User }o--{ UserBadge : "userbadge"
    SharedEssay }o--|| SocialInteraction : "interactions"
    SharedEssay }o--|| ContentReport : "reports"
    SharedEssay ||--|| Submission : "submission"
    SharedEssay }o--{ User : "owner"
    SharedEssay }o--{ Class : "class_obj"
    SocialInteraction }o--{ ContentReport : "contentreport"
    SocialInteraction }o--{ SharedEssay : "share"
    SocialInteraction }o--{ User : "user"
    ContentReport }o--{ SharedEssay : "share"
    ContentReport }o--{ SocialInteraction : "interaction"
    ContentReport }o--{ User : "reporter"
    ContentReport }o--{ User : "resolved_by"
    SocialPostingBan }o--{ User : "user"
    SocialPostingBan }o--{ Class : "class_obj"
    SocialPostingBan }o--{ User : "created_by"
    OrganizationSettings }o--{ User : "updated_by"
    AuthSession }o--{ User : "user"
    LoginEvent }o--{ User : "user"
    CourseLeadAssignment }o--{ User : "user_id_user"
    CourseLeadAssignment }o--{ Unit : "unit_id_unit"
    CourseLeadAssignment }o--{ User : "assigned_by"
    Invitation }o--{ Class : "class_id_class"
    Invitation }o--{ Unit : "lead_unit"
    Invitation }o--{ User : "invited_by"
    Badge }o--{ UserBadge : "userbadge"
    UserBadge }o--{ User : "user_id_user"
    UserBadge }o--{ Badge : "badge_id_badge"
```

## 🔄 Regenerating the ERD

To regenerate this diagram:

```bash
# Option 1: Generate ERD only
make docs-erd

# Option 2: Generate all documentation including ERD
make docs-generate
```

This will run the documentation generator to create an updated ERD from the current Django models.
