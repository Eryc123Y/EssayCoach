"""Versioned, bilingual help content shipped with the local application."""

# ruff: noqa: E501 -- Keep each translated paragraph intact for editors.


ARTICLES = [
    {
        "slug": "getting-started",
        "category": "getting_started",
        "roles": ["student", "lecturer", "admin"],
        "tags": ["account", "onboarding"],
        "title": {"en": "Getting started", "zh": "开始使用"},
        "content": {
            "en": "EssayCoach is an invitation-only writing workspace. Open the invitation from your teacher or administrator, activate your account, then sign in. Your dashboard shows the classes and assignments you can access. If a class is missing, ask the course team to check your enrollment.",
            "zh": "EssayCoach 是邀请制写作平台。请打开教师或管理员发出的邀请，激活账号并登录。首页会显示你有权访问的班级与作业。如果缺少班级，请联系课程团队核对选课记录。",
        },
    },
    {
        "slug": "student-first-steps", "category": "getting_started", "roles": ["student"],
        "tags": ["student", "onboarding"],
        "title": {"en": "Your first steps as a student", "zh": "学生快速入门"},
        "content": {"en": "Open your class from the dashboard, read the assignment requirements and rubric, then draft and review your essay before submitting. After submission, wait for your teacher to release the result.", "zh": "从首页打开班级，阅读作业要求和评分量规，再起草并检查作文后提交。提交后请等待教师发布结果。"},
    },
    {
        "slug": "lecturer-first-steps", "category": "getting_started", "roles": ["lecturer"],
        "tags": ["lecturer", "onboarding"],
        "title": {"en": "Your first steps as a lecturer", "zh": "讲师快速入门"},
        "content": {"en": "Open one of your assigned classes, prepare a rubric, publish an assignment, invite enrolled students, then review submissions and save your grading recommendations.", "zh": "打开所负责的班级，准备评分量规并发布作业，邀请已选课学生，然后复核提交并保存评分建议。"},
    },
    {
        "slug": "admin-first-steps", "category": "getting_started", "roles": ["admin"],
        "tags": ["admin", "onboarding"],
        "title": {"en": "Your first steps as an administrator", "zh": "管理员快速入门"},
        "content": {"en": "Invite teaching staff, check their roles and class assignments, and help users resolve access issues. Public registration is disabled.", "zh": "邀请教职员工，核对角色和班级分配，并协助用户解决访问问题。公开注册已关闭。"},
    },
    {
        "slug": "practice-and-sources",
        "category": "essays",
        "roles": ["student", "lecturer", "admin"],
        "tags": ["practice", "ai", "sources"],
        "title": {"en": "Practice feedback and source checks", "zh": "练习反馈与来源核查"},
        "content": {
            "en": "Use Essay Analysis to save a draft or import a TXT, Markdown, PDF, or DOCX file. Run feedback for suggestions, then ask follow-up questions and revise. Source checks show evidence only when a public page and matching passage were verified; unresolved claims need your own review. Practice feedback never becomes a formal course grade.",
            "zh": "在“作文分析”中保存草稿，或导入 TXT、Markdown、PDF、DOCX 文件。运行反馈后可追问并修改。仅当公开网页和对应原文得到核实，来源核查才会显示证据；标记为“未解决”的主张需要你自行核对。练习反馈不会自动成为课程正式成绩。",
        },
    },
    {
        "slug": "submit-an-assignment",
        "category": "essays",
        "roles": ["student", "lecturer", "admin"],
        "tags": ["assignment", "submission", "grade"],
        "title": {"en": "Submit an assignment and view a grade", "zh": "提交作业与查看成绩"},
        "content": {
            "en": "Open an assignment to read its instructions, deadline, and assessment rubric. Your text is saved in this browser while you draft. Review it before formal submission: the submitted essay is locked. The AI creates a private scoring proposal. A lecturer reviews it and the course lead confirms publication before the final result appears to you.",
            "zh": "打开作业查看说明、截止时间与评分量规。写作时文本暂存在当前浏览器。正式提交前请再次检查；提交后作文会锁定。AI 的建议评分仅供教师查看，讲师复核、课程负责人确认发布后，你才能看到最终结果。",
        },
    },
    {
        "slug": "set-up-a-course",
        "category": "rubrics",
        "roles": ["lecturer", "admin"],
        "tags": ["class", "rubric", "assignment"],
        "title": {"en": "Set up a class and assignment", "zh": "设置班级与作业"},
        "content": {
            "en": "Create or open a class in Classes. Add students through invitations. Build a rubric with criteria and score levels before publishing an assignment. Publishing freezes the rubric students see. Later edits to the source rubric do not change that version; unpublish and republish deliberately to make a new version for future submissions.",
            "zh": "在“班级”中创建或打开班级，并通过邀请加入学生。发布作业前，先建立包含评分细项与分数区间的量规。发布时会冻结学生看到的量规版本；之后编辑原量规不会改变该版本。若要让后续提交使用新版，请明确取消发布并重新发布。",
        },
    },
    {
        "slug": "review-and-release-grades",
        "category": "rubrics",
        "roles": ["lecturer", "admin"],
        "tags": ["grading", "review", "publication"],
        "title": {"en": "Review and release grades", "zh": "复核与发布成绩"},
        "content": {
            "en": "Open a submission from the review queue. Wait for the AI proposal or retry a failed job, then inspect every criterion and edit scores or comments as needed. Save the lecturer review. The course lead then confirms and publishes the final result. One person may perform both steps, but each action is recorded separately.",
            "zh": "从复核队列打开提交。等待 AI 建议评分，失败时可重试；逐项核对并修改分数或评语，然后保存讲师复核。课程负责人再确认并发布最终成绩。同一人可以完成两步，但系统会分别记录操作。",
        },
    },
    {
        "slug": "invite-and-manage-people",
        "category": "account",
        "roles": ["admin"],
        "tags": ["invitation", "users", "access"],
        "title": {"en": "Invite and manage people", "zh": "邀请与管理用户"},
        "content": {
            "en": "Administrators invite staff; authorized teaching staff invite students into their classes. Public registration is disabled. Check role, class membership, and course lead assignments when someone cannot access a page. Suspended users cannot sign in until an administrator restores access.",
            "zh": "管理员邀请教职员工；有权限的教师邀请学生加入所授班级。公开注册已关闭。若用户无法访问页面，请检查角色、班级成员资格和课程负责人分配。账号被停用后须由管理员恢复，才能再次登录。",
        },
    },
    {
        "slug": "common-problems",
        "category": "faq",
        "roles": ["student", "lecturer", "admin"],
        "tags": ["troubleshooting", "faq"],
        "title": {"en": "Common problems", "zh": "常见问题"},
        "content": {
            "en": "Missing assignment: confirm that it is published and that you are enrolled in the correct class. Missing grade: a teacher must review and the course lead must publish it. AI job failed: teaching staff can retry from the review page. Imported document is empty: use a selectable-text PDF or a TXT, Markdown, or DOCX file. If the problem persists, send a support ticket below.",
            "zh": "看不到作业：确认作业已发布，并且你已加入正确班级。看不到成绩：需要讲师复核及课程负责人发布。AI 任务失败：教师可在复核页重试。导入文档为空：请使用可选取文字的 PDF，或 TXT、Markdown、DOCX 文件。如仍无法解决，请在下方提交支持工单。",
        },
    },
]


def visible_articles(role: str, language: str, *, query: str = "", category: str | None = None) -> list[dict]:
    language = language if language in ("en", "zh") else "en"
    needle = query.strip().casefold()
    results = []
    for number, item in enumerate(ARTICLES, start=1):
        if role not in item["roles"] or (category and category != item["category"]):
            continue
        title = item["title"][language]
        content = item["content"][language]
        if needle and needle not in " ".join([title, content, *item["tags"]]).casefold():
            continue
        results.append({
            "id": number,
            "slug": item["slug"],
            "category": item["category"],
            "roles": item["roles"],
            "tags": item["tags"],
            "language": language,
            "title": title,
            "content": content,
        })
    return results
