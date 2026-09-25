'use client';

import { FormEvent, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  GraduationCap,
  MessageCircle,
  PenLine,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  UsersRound
} from 'lucide-react';
import { usePrototype, useT, type Role } from './prototype-context';
import {
  Action,
  Badge,
  Field,
  MockLabel,
  Note,
  PageHeading,
  Panel,
  SectionHeading,
  TextLink
} from './prototype-ui';

export function LandingView() {
  const { go } = usePrototype();
  const t = useT();
  const [enquiring, setEnquiring] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);
  const [institution, setInstitution] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  function sendEnquiry(event: FormEvent) {
    event.preventDefault();
    if (institution.trim() && contactEmail.includes('@')) setEnquirySent(true);
  }
  return (
    <>
      <div className='ecp-landing-hero'>
        <div className='ecp-landing-copy'>
          <h1>
            {t(
              'Better writing grows in the margins.',
              '好文章，写在每一次修改之间。'
            )}
          </h1>
          <p>
            {t(
              'In invited classes, students revise with feedback beside the draft. Lecturers refine AI suggestions; course leads confirm every formal grade.',
              '在受邀班级中，学生对照正文旁的反馈修改草稿。讲师复核 AI 建议，课程负责人确认每一份正式成绩。'
            )}
          </p>
          <div className='ecp-hero-actions'>
            <Action
              onClick={() => go('signin')}
              icon={<ArrowRight size={17} />}
            >
              {t('Explore the workspace', '探索工作空间')}
            </Action>
            <Action variant='secondary' onClick={() => go('invite')}>
              {t('Accept an invitation', '接受邀请')}
            </Action>
          </div>
          <div className='ecp-hero-for-schools'>
            <span>{t('For school teams:', '面向学校团队：')}</span>
            <button onClick={() => setEnquiring(true)}>
              {t('Ask about EssayCoach', '咨询机构使用方式')}
            </button>
          </div>
        </div>
        <div
          className='ecp-hero-editor'
          aria-label={t('Example annotated essay', '作文批注示例')}
        >
          <div className='ecp-editor-toolbar'>
            <span className='ecp-file-indicator'>
              <FileText size={16} />
              {t('Draft 02', '草稿 02')}
            </span>
            <span>{t('Argument essay', '议论文')}</span>
          </div>
          <div className='ecp-editor-paper'>
            <span className='ecp-paper-chapter'>
              {t('Learning to think with AI', '与 AI 一起学习思考')}
            </span>
            <h2>{t('Who owns the final judgment?', '谁来作出最终判断？')}</h2>
            <p>
              {t(
                'AI can make feedback faster, but good writing still depends on a conversation between a student and a teacher.',
                'AI 可以让反馈更及时，但好的写作仍离不开学生与教师之间的对话。'
              )}
            </p>
            <p>
              <mark>
                {t(
                  'A score alone rarely explains how an argument can improve.',
                  '仅有分数，很难说明论证该如何进步。'
                )}
              </mark>{' '}
              {t(
                'Writers need to see the reasoning behind each suggestion.',
                '写作者需要理解每一条建议背后的理由。'
              )}
            </p>
            <div className='ecp-margin-note'>
              <span className='ecp-margin-pin'>1</span>
              <strong>{t('Make the claim specific', '让论点更具体')}</strong>
              <small>
                {t('What evidence could support this?', '可以用什么证据支持？')}
              </small>
            </div>
          </div>
          <div className='ecp-editor-footer'>
            <span>
              <span className='ecp-live-dot' />
              {t('Feedback ready to review', '反馈可供查看')}
            </span>
            <span>{t('Writing studio', '写作空间')}</span>
          </div>
        </div>
      </div>
      <div className='ecp-landing-band'>
        <span>{t('From draft to decision', '从草稿到最终决定')}</span>
        <div>
          <span>
            <PenLine size={18} />
            {t('Draft with purpose', '有目标地写作')}
          </span>
          <span>
            <SearchCheck size={18} />
            {t('Check claims', '核实论断')}
          </span>
          <span>
            <MessageCircle size={18} />
            {t('Discuss feedback', '讨论反馈')}
          </span>
          <span>
            <ShieldCheck size={18} />
            {t('Course lead confirms', '课程负责人确认')}
          </span>
        </div>
      </div>
      <div className='ecp-landing-sections'>
        <div className='ecp-landing-section-intro'>
          <h2>
            {t(
              'Every step gives the writer a next move.',
              '每一步，都让写作者知道下一步怎么做。'
            )}
          </h2>
        </div>
        <div className='ecp-feature-list'>
          <div>
            <span className='ecp-feature-icon'>
              <BookOpen size={22} />
            </span>
            <h3>{t('Start with the brief', '先看清写作要求')}</h3>
            <p>
              {t(
                'The prompt and rubric stay close to the draft, so students know what the course asks of them.',
                '题目和评分标准就在草稿旁，学生动笔前就知道课程要求。'
              )}
            </p>
          </div>
          <div>
            <span className='ecp-feature-icon'>
              <Sparkles size={22} />
            </span>
            <h3>{t('Notes beside the sentence', '批注紧贴原句')}</h3>
            <p>
              {t(
                'A comment points to a claim, asks for evidence, and gives the writer a concrete revision task.',
                '反馈指向具体论断，提醒学生补充证据，并给出明确的修改任务。'
              )}
            </p>
          </div>
          <div>
            <span className='ecp-feature-icon'>
              <GraduationCap size={22} />
            </span>
            <h3>{t('A grade has a reviewer', '正式成绩有人复核')}</h3>
            <p>
              {t(
                'AI drafts a score, a lecturer edits it, and the course lead decides when it is published.',
                'AI 起草分数，讲师修改，课程负责人确认后才会发布。'
              )}
            </p>
          </div>
        </div>
      </div>
      <footer className='ecp-public-footer'>
        <span>essaycoach.</span>
        <p>
          {t(
            'A local interactive preview for one institution.',
            '单机构本地交互预览。'
          )}
        </p>
        <button onClick={() => go('help')}>
          {t('Help centre', '帮助中心')}
        </button>
      </footer>
      {enquiring && (
        <div className='ecp-modal-backdrop' onClick={() => setEnquiring(false)}>
          <div
            className='ecp-modal ecp-modal--small'
            role='dialog'
            aria-modal='true'
            aria-label={t('Institution enquiry', '机构咨询')}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className='ecp-modal-close'
              onClick={() => setEnquiring(false)}
              aria-label={t('Close', '关闭')}
            >
              ×
            </button>
            {enquirySent ? (
              <>
                <h2>{t('Enquiry drafted', '咨询草稿已记录')}</h2>
                <p>
                  {t(
                    'This preview has not sent a message. The full product will connect this form to your institution contact workflow.',
                    '此预览未发送消息。正式产品会将此表单连接到机构联系流程。'
                  )}
                </p>
                <Action onClick={() => setEnquiring(false)}>
                  {t('Close', '关闭')}
                </Action>
              </>
            ) : (
              <form onSubmit={sendEnquiry}>
                <span className='ecp-context'>
                  {t('For institutions', '面向机构')}
                </span>
                <h2>{t('Talk to us about EssayCoach', '了解 EssayCoach')}</h2>
                <p>
                  {t(
                    'Leave a school name and email to preview the enquiry flow.',
                    '填写学校名称和邮箱，预览咨询流程。'
                  )}
                </p>
                <Field label={t('Institution', '机构名称')}>
                  <input
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    required
                  />
                </Field>
                <Field label={t('Work email', '工作邮箱')}>
                  <input
                    type='email'
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                  />
                </Field>
                <div className='ecp-modal-actions'>
                  <Action
                    variant='quiet'
                    type='button'
                    onClick={() => setEnquiring(false)}
                  >
                    {t('Cancel', '取消')}
                  </Action>
                  <Action type='submit'>
                    {t('Create preview enquiry', '创建预览咨询')}
                  </Action>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function SignInView() {
  const { go, role, setRole } = usePrototype();
  const t = useT();
  const [selectedRole, setSelectedRole] = useState<Role>(role);
  const [email, setEmail] = useState('student@northbridge.edu');
  const [password, setPassword] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    setRole(selectedRole);
  }
  return (
    <div className='ecp-auth-layout'>
      <div className='ecp-auth-story'>
        <span className='ecp-context'>{t('Welcome back', '欢迎回来')}</span>
        <h1>{t('Your next draft starts here.', '下一稿，从这里开始。')}</h1>
        <p>
          {t(
            'Open a course, continue a draft, or review feedback with the full context in view.',
            '打开课程、继续写作，或在完整上下文中查看反馈。'
          )}
        </p>
        <div className='ecp-auth-quote'>
          <span>“</span>
          <p>
            {t(
              'The most useful feedback tells me what to try next.',
              '最有帮助的反馈，是让我知道下一步怎么改。'
            )}
          </p>
          <small>{t('Student writing journal', '学生写作日志')}</small>
        </div>
      </div>
      <form className='ecp-auth-form' onSubmit={submit}>
        <Badge tone='blue'>{t('Interactive preview', '交互预览')}</Badge>
        <h2>{t('Sign in to EssayCoach', '登录 EssayCoach')}</h2>
        <p>
          {t(
            'Choose a role to explore the matching workspace. No account is needed in this preview.',
            '选择角色查看对应工作区。此预览无需真实账号。'
          )}
        </p>
        <Field label={t('School email', '学校邮箱')}>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label={t('Password', '密码')}>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('Any password for preview', '预览可输入任意密码')}
            required
          />
        </Field>
        <div
          className='ecp-role-cards'
          role='group'
          aria-label={t('Preview role', '预览角色')}
        >
          {(['student', 'lecturer', 'course_lead', 'admin'] as Role[]).map(
            (item) => (
              <button
                type='button'
                key={item}
                className={
                  selectedRole === item
                    ? 'ecp-role-card selected'
                    : 'ecp-role-card'
                }
                onClick={() => setSelectedRole(item)}
              >
                <span>
                  {item === 'student'
                    ? t('Student', '学生')
                    : item === 'lecturer'
                      ? t('Lecturer', '讲师')
                      : item === 'course_lead'
                        ? t('Course lead', '课程负责人')
                        : t('Admin', '管理员')}
                </span>
                {selectedRole === item && <Check size={16} />}
              </button>
            )
          )}
        </div>
        <Action type='submit' icon={<ArrowRight size={17} />}>
          {t('Enter preview workspace', '进入预览工作区')}
        </Action>
        <button
          type='button'
          className='ecp-subtle-link'
          onClick={() => setRecovering(true)}
        >
          {t('Forgot password?', '忘记密码？')}
        </button>
        <button
          type='button'
          className='ecp-subtle-link'
          onClick={() => go('invite')}
        >
          {t('Have an invitation? Activate access', '收到邀请？激活账号')}
        </button>
      </form>
      {recovering && (
        <div
          className='ecp-modal-backdrop'
          onClick={() => setRecovering(false)}
        >
          <div
            className='ecp-modal ecp-modal--small'
            role='dialog'
            aria-modal='true'
            aria-label={t('Password recovery', '找回密码')}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className='ecp-modal-close'
              onClick={() => setRecovering(false)}
              aria-label={t('Close', '关闭')}
            >
              ×
            </button>
            <h2>{t('Reset your password', '重置密码')}</h2>
            <p>
              {recoverySent
                ? t(
                    'A preview request was recorded. No email was sent.',
                    '预览请求已记录，但未发送邮件。'
                  )
                : t(
                    'Enter your school email to preview the recovery flow.',
                    '输入学校邮箱，预览找回密码流程。'
                  )}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setRecoverySent(true);
              }}
            >
              <Field label={t('School email', '学校邮箱')}>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <div className='ecp-modal-actions'>
                <Action
                  variant='quiet'
                  type='button'
                  onClick={() => setRecovering(false)}
                >
                  {t('Close', '关闭')}
                </Action>
                <Action type='submit'>
                  {t('Create preview request', '创建预览请求')}
                </Action>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function InviteView() {
  const { go, setRole } = usePrototype();
  const t = useT();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim() && email.includes('@')) setAccepted(true);
  }
  return (
    <div className='ecp-auth-layout'>
      <div className='ecp-auth-story'>
        <span className='ecp-context'>
          {t('By invitation', '仅限受邀加入')}
        </span>
        <h1>{t('A place in the conversation.', '加入这场写作对话。')}</h1>
        <p>
          {t(
            'Lecturers invite students into a course. Every draft and feedback note stays connected to that class.',
            '讲师邀请学生加入课程。每篇文章和每条反馈都与班级相连。'
          )}
        </p>
        <div className='ecp-invite-ticket'>
          <span>{t('Invitation from', '邀请来自')}</span>
          <strong>Northbridge Academy</strong>
          <small>ENG 201 · {t('Argument & Evidence', '论证与证据')}</small>
        </div>
      </div>
      <div className='ecp-auth-form'>
        <Badge tone='amber'>{t('Sample invitation', '示例邀请')}</Badge>
        {accepted ? (
          <>
            <div className='ecp-success-symbol'>
              <Check size={27} />
            </div>
            <h2>{t('Your preview is ready', '预览账号已准备好')}</h2>
            <p>
              {t(
                'In the real product, this would activate the lecturer-issued invitation. Here you can explore the student workspace.',
                '正式产品会在此激活讲师发出的邀请。现在可进入学生工作区预览。'
              )}
            </p>
            <Action
              onClick={() => setRole('student')}
              icon={<ArrowRight size={17} />}
            >
              {t('Open student workspace', '打开学生工作区')}
            </Action>
          </>
        ) : (
          <form onSubmit={submit}>
            <h2>{t('Accept your invitation', '接受课程邀请')}</h2>
            <p>
              {t(
                'Students join through a lecturer invitation. Open registration is unavailable.',
                '学生通过讲师邀请加入，不提供开放注册。'
              )}
            </p>
            <Field label={t('Invitation code', '邀请码')}>
              <input defaultValue='ENG-2026-8F2C' required />
            </Field>
            <Field label={t('Your name', '姓名')}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('Your full name', '填写姓名')}
                required
              />
            </Field>
            <Field label={t('School email', '学校邮箱')}>
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='you@school.edu'
                required
              />
            </Field>
            <Action type='submit' icon={<ArrowRight size={17} />}>
              {t('Activate preview invitation', '激活预览邀请')}
            </Action>
            <button
              type='button'
              className='ecp-subtle-link'
              onClick={() => go('signin')}
            >
              {t('Already have access? Sign in', '已有账号？登录')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function DashboardView() {
  const { go, role, gradePublished, lecturerReviewed, invitedUsers, essay } =
    usePrototype();
  const t = useT();
  if (role === 'student')
    return (
      <>
        <PageHeading
          eyebrow={t('Friday, 25 September', '9 月 25 日，星期五')}
          title={t('Good morning, Alex.', '早上好，Alex。')}
          description={t(
            'Your writing is moving forward. Pick up where you left off.',
            '你的写作正在进步，从上次停下的地方继续吧。'
          )}
          action={
            <Action onClick={() => go('practice')} icon={<PenLine size={17} />}>
              {t('Continue writing', '继续写作')}
            </Action>
          }
        />
        <div className='ecp-overview-grid'>
          <Panel className='ecp-featured-panel'>
            <div className='ecp-featured-top'>
              <Badge tone='blue'>{t('In progress', '写作中')}</Badge>
              <span>ENG 201</span>
            </div>
            <h2>
              {t('Argument essay: learning with AI', '议论文：与 AI 一起学习')}
            </h2>
            <p>
              {t(
                'Explore whether AI feedback can strengthen critical thinking in secondary education.',
                '探讨 AI 反馈能否促进中学阶段的批判性思维。'
              )}
            </p>
            <div className='ecp-progress'>
              <span style={{ width: '62%' }} />
            </div>
            <div className='ecp-featured-foot'>
              <span>
                {t(
                  `Draft saved · ${essay.trim() ? essay.trim().split(/\s+/).length : 0} words`,
                  `草稿已保存 · ${essay.trim() ? essay.trim().split(/\s+/).length : 0} 词`
                )}
              </span>
              <TextLink onClick={() => go('practice')}>
                {t('Open draft', '打开草稿')}
              </TextLink>
            </div>
          </Panel>
          <Panel className='ecp-overview-side'>
            <SectionHeading title={t('Your next steps', '接下来')} />
            <div className='ecp-timeline'>
              <button onClick={() => go('assignments')}>
                <span className='ecp-step-dot blue' />
                <span>
                  <strong>
                    {t('Read the assignment brief', '阅读作业要求')}
                  </strong>
                  <small>{t('Due 2 October', '10 月 2 日截止')}</small>
                </span>
                <ChevronRight size={16} />
              </button>
              <button onClick={() => go('feedback')}>
                <span className='ecp-step-dot green' />
                <span>
                  <strong>
                    {t('Review practice feedback', '查看练习反馈')}
                  </strong>
                  <small>
                    {t('Specific notes on your argument', '查看论证的具体建议')}
                  </small>
                </span>
                <ChevronRight size={16} />
              </button>
              <button onClick={() => go('classes')}>
                <span className='ecp-step-dot amber' />
                <span>
                  <strong>
                    {t('Explore class resources', '浏览班级资源')}
                  </strong>
                  <small>ENG 201</small>
                </span>
                <ChevronRight size={16} />
              </button>
            </div>
          </Panel>
        </div>
        <div className='ecp-two-col'>
          <Panel>
            <SectionHeading
              title={t('Recent writing', '最近的写作')}
              action={
                <TextLink onClick={() => go('feedback')}>
                  {t('View all feedback', '查看全部反馈')}
                </TextLink>
              }
            />
            <div className='ecp-list-row'>
              <span className='ecp-list-icon'>
                <FileText size={19} />
              </span>
              <span>
                <strong>
                  {t('The value of a second draft', '第二稿的价值')}
                </strong>
                <small>
                  {t('Practice · 18 September', '练习 · 9 月 18 日')}
                </small>
              </span>
              <Badge tone='green'>{t('Feedback ready', '反馈已生成')}</Badge>
            </div>
            <div className='ecp-list-row'>
              <span className='ecp-list-icon'>
                <FileText size={19} />
              </span>
              <span>
                <strong>
                  {t('Evidence in public debate', '公共讨论中的证据')}
                </strong>
                <small>
                  {t('Assignment · 12 September', '作业 · 9 月 12 日')}
                </small>
              </span>
              <Badge tone={gradePublished ? 'green' : 'amber'}>
                {gradePublished
                  ? t('Published', '已发布')
                  : t('Awaiting teacher', '等待教师复核')}
              </Badge>
            </div>
          </Panel>
          <Panel>
            <SectionHeading title={t('Writing progress', '写作进展')} />
            <div className='ecp-big-number'>
              4{' '}
              <span>{t('drafts revised this month', '篇本月修改的草稿')}</span>
            </div>
            <div className='ecp-mini-bars'>
              <i style={{ height: '40%' }} />
              <i style={{ height: '60%' }} />
              <i style={{ height: '52%' }} />
              <i style={{ height: '76%' }} />
              <i style={{ height: '88%' }} />
            </div>
            <p className='ecp-muted'>
              {t(
                'Your strongest improvement: clearer topic sentences.',
                '进步最明显：段首主题句更加清晰。'
              )}
            </p>
          </Panel>
        </div>
      </>
    );
  if (role === 'lecturer' || role === 'course_lead')
    return (
      <>
        <PageHeading
          eyebrow={t('ENG 201 · Course workspace', 'ENG 201 · 课程工作区')}
          title={t('Good morning, Dr. Lin.', '早上好，林老师。')}
          description={
            role === 'lecturer'
              ? t(
                  'Review the AI draft, then send your changes to the course lead.',
                  '复核 AI 草稿，并将修改提交给课程负责人。'
                )
              : t(
                  'Confirm teacher-reviewed feedback before the grade is released.',
                  '成绩发布前，请确认讲师已复核的反馈。'
                )
          }
          action={
            <Action
              onClick={() => go('review')}
              icon={<ClipboardCheck size={17} />}
            >
              {t('Open review queue', '打开复核队列')}
            </Action>
          }
        />
        <div className='ecp-stats-grid'>
          <div>
            <span>{t('Awaiting review', '待复核')}</span>
            <strong>{gradePublished ? '2' : '3'}</strong>
            <small>{t('Across two assignments', '涉及两项作业')}</small>
          </div>
          <div>
            <span>{t('Active classes', '活跃班级')}</span>
            <strong>3</strong>
            <small>{t('This term', '本学期')}</small>
          </div>
          <div>
            <span>{t('Submitted this week', '本周已提交')}</span>
            <strong>24</strong>
            <small>{t('8 need a first response', '8 篇需要首次反馈')}</small>
          </div>
        </div>
        <div className='ecp-two-col ecp-two-col--wide'>
          <Panel>
            <SectionHeading
              title={t('Ready for your judgment', '等待你作出判断')}
              action={
                <TextLink onClick={() => go('review')}>
                  {t('View queue', '查看队列')}
                </TextLink>
              }
            />
            <div className='ecp-review-row'>
              <span className='ecp-review-avatar'>AM</span>
              <span>
                <strong>Alex Morgan</strong>
                <small>
                  {t(
                    'Argument essay: learning with AI',
                    '议论文：与 AI 一起学习'
                  )}{' '}
                  · ENG 201
                </small>
              </span>
              <Badge tone={gradePublished ? 'green' : 'amber'}>
                {gradePublished
                  ? t('Published', '已发布')
                  : lecturerReviewed
                    ? t('Awaiting course lead', '等待课程负责人')
                    : t('AI draft ready', 'AI 草稿待审')}
              </Badge>
              <button
                onClick={() => go('review')}
                aria-label={t('Review Alex Morgan', '复核 Alex Morgan')}
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className='ecp-review-row'>
              <span className='ecp-review-avatar violet'>LC</span>
              <span>
                <strong>Lin Chen</strong>
                <small>
                  {t('Public debate and evidence', '公共讨论与证据')} · ENG 201
                </small>
              </span>
              <Badge tone='amber'>{t('AI draft ready', 'AI 草稿待审')}</Badge>
              <button
                onClick={() => go('review')}
                aria-label={t('Review Lin Chen', '复核 Lin Chen')}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </Panel>
          <Panel>
            <SectionHeading title={t('Course rhythm', '课程进度')} />
            <div className='ecp-course-rhythm'>
              <div>
                <span>
                  <Clock3 size={18} />
                </span>
                <p>
                  <strong>{t('Assignment due soon', '作业即将截止')}</strong>
                  <small>
                    {t('Argument essay · 2 October', '议论文 · 10 月 2 日')}
                  </small>
                </p>
              </div>
              <div>
                <span>
                  <BookOpen size={18} />
                </span>
                <p>
                  <strong>{t('Rubric in use', '正在使用的评分标准')}</strong>
                  <small>
                    {t(
                      'Argument & evidence · version 2',
                      '论证与证据 · 第 2 版'
                    )}
                  </small>
                </p>
              </div>
            </div>
            <TextLink onClick={() => go('assignments')}>
              {t('Manage assignments', '管理作业')}
            </TextLink>
          </Panel>
        </div>
      </>
    );
  return (
    <>
      <PageHeading
        eyebrow={t('Northbridge Academy', 'Northbridge 学院')}
        title={t('Institution overview', '机构总览')}
        description={t(
          'Keep classes, people, and learning activity in one view.',
          '在同一个界面查看班级、人员与学习活动。'
        )}
        action={
          <Action onClick={() => go('users')} icon={<ArrowRight size={17} />}>
            {t('Manage people', '管理人员')}
          </Action>
        }
      />
      <div className='ecp-stats-grid'>
        <div>
          <span>{t('Active students', '活跃学生')}</span>
          <strong>128</strong>
          <small>{t('Across 6 classes', '分布于 6 个班级')}</small>
        </div>
        <div>
          <span>{t('Course leads', '课程负责人')}</span>
          <strong>{8 + invitedUsers.length}</strong>
          <small>{t('Teaching this term', '本学期任教')}</small>
        </div>
        <div>
          <span>{t('Essays submitted', '已提交文章')}</span>
          <strong>342</strong>
          <small>{t('This term', '本学期')}</small>
        </div>
      </div>
      <div className='ecp-two-col'>
        <Panel>
          <SectionHeading title={t('Institution activity', '机构动态')} />
          <div className='ecp-list-row'>
            <span className='ecp-list-icon'>
              <GraduationCap size={18} />
            </span>
            <span>
              <strong>
                {t('ENG 201 received 18 submissions', 'ENG 201 收到 18 篇投稿')}
              </strong>
              <small>{t('Today', '今天')}</small>
            </span>
          </div>
          <div className='ecp-list-row'>
            <span className='ecp-list-icon'>
              <ShieldCheck size={18} />
            </span>
            <span>
              <strong>
                {t(
                  '7 grades approved by course leads',
                  '课程负责人确认了 7 份成绩'
                )}
              </strong>
              <small>{t('This week', '本周')}</small>
            </span>
          </div>
          <TextLink onClick={() => go('analytics')}>
            {t('Open analytics', '打开数据分析')}
          </TextLink>
        </Panel>
        <Panel>
          <SectionHeading title={t('People and access', '人员与权限')} />
          <p className='ecp-muted'>
            {t(
              'Students enter through a lecturer invitation. Admins manage course leads and oversee access.',
              '学生通过讲师邀请加入。管理员负责课程负责人账号与访问权限。'
            )}
          </p>
          <div className='ecp-quick-actions'>
            <button onClick={() => go('users')}>
              <UsersRoundIcon />
              {t('Invite a lecturer', '邀请讲师')}
            </button>
            <button onClick={() => go('classes')}>
              <GraduationCap size={18} />
              {t('View classes', '查看班级')}
            </button>
          </div>
        </Panel>
      </div>
    </>
  );
}

function UsersRoundIcon() {
  return <UsersRound size={18} />;
}

export function PracticeView() {
  const {
    go,
    essay,
    setEssay,
    goal,
    setGoal,
    rubric,
    setRubric,
    setFeedbackReady
  } = usePrototype();
  const t = useT();
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'write' | 'brief'>('write');
  const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
  function getFeedback() {
    if (wordCount < 30) {
      setError(
        t(
          'Write at least 30 words to preview feedback.',
          '请至少写 30 个词，再预览反馈。'
        )
      );
      return;
    }
    setError('');
    setFeedbackReady(true);
    go('feedback');
  }
  return (
    <>
      <PageHeading
        eyebrow={t('ENG 201 / Practice', 'ENG 201 / 写作练习')}
        title={t('Writing studio', '写作空间')}
        description={t(
          'Explore an idea, then ask for focused feedback when you are ready.',
          '探索想法，准备好后获取有针对性的反馈。'
        )}
        action={
          <Badge tone='blue'>{t('Practice · private', '练习 · 私密')}</Badge>
        }
      />
      <div className='ecp-workspace-grid'>
        <div className='ecp-writing-main'>
          <Panel className='ecp-writing-brief'>
            <div className='ecp-tabs'>
              <button
                className={tab === 'write' ? 'active' : ''}
                onClick={() => setTab('write')}
              >
                {t('Write', '写作')}
              </button>
              <button
                className={tab === 'brief' ? 'active' : ''}
                onClick={() => setTab('brief')}
              >
                {t('Assignment brief', '作业说明')}
              </button>
            </div>
            {tab === 'write' ? (
              <div className='ecp-writing-prompt'>
                <span>{t('Your prompt', '写作题目')}</span>
                <h2>
                  {t(
                    'Can AI feedback strengthen critical thinking?',
                    'AI 反馈能促进批判性思维吗？'
                  )}
                </h2>
                <p>
                  {t(
                    'Take a position and support it with examples from education. Consider one counterargument.',
                    '请选择立场，并结合教育领域的例子论证；同时回应一个反方观点。'
                  )}
                </p>
              </div>
            ) : (
              <div className='ecp-writing-prompt'>
                <span>{t('Assignment brief', '作业说明')}</span>
                <h2>
                  {t(
                    'Argument essay: learning with AI',
                    '议论文：与 AI 一起学习'
                  )}
                </h2>
                <p>
                  {t(
                    'Suggested length: 600–800 words. Use at least two credible sources and address a counterargument. Practice feedback does not become a formal grade.',
                    '建议篇幅：600–800 词。至少使用两个可信来源，并回应一个反方观点。练习反馈不会自动成为正式成绩。'
                  )}
                </p>
              </div>
            )}
          </Panel>
          <div className='ecp-writing-paper'>
            <div className='ecp-writing-paper-head'>
              <span>
                <FileText size={16} />
                {t('Untitled draft', '未命名草稿')}
              </span>
              <span>
                {wordCount} {t('words', '词')}
              </span>
            </div>
            <textarea
              aria-label={t('Essay draft', '文章草稿')}
              value={essay}
              onChange={(e) => {
                setEssay(e.target.value);
                setError('');
              }}
              placeholder={t(
                'Start with a thought worth testing…',
                '从一个值得探究的想法开始……'
              )}
            />
            <div className='ecp-writing-paper-foot'>
              <span>
                <span className='ecp-live-dot' />
                {t('Local preview draft', '本地预览草稿')}
              </span>
              <span>{t('Your voice comes first', '先写出你的观点')}</span>
            </div>
          </div>
          {error && (
            <div className='ecp-form-error' role='alert'>
              {error}
            </div>
          )}
          <div className='ecp-writing-actions'>
            <Action variant='secondary' onClick={() => setEssay('')}>
              {t('Clear draft', '清空草稿')}
            </Action>
            <Action onClick={getFeedback} icon={<Sparkles size={18} />}>
              {t('Preview AI feedback', '预览 AI 反馈')}
            </Action>
          </div>
        </div>
        <aside className='ecp-writing-rail'>
          <Panel>
            <SectionHeading
              title={t('Focus for this session', '本次练习重点')}
              detail={t(
                'Choose what you want to improve.',
                '选择最想提升的一点。'
              )}
            />
            <div className='ecp-option-list'>
              {[
                ['argument', t('Strengthen my argument', '加强论证')],
                ['structure', t('Improve structure', '改善结构')],
                ['language', t('Polish language', '润色语言')]
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={goal === key ? 'selected' : ''}
                  onClick={() => setGoal(key)}
                >
                  <span className='ecp-radio' />
                  {label}
                </button>
              ))}
            </div>
          </Panel>
          <Panel>
            <SectionHeading title={t('Rubric', '评分标准')} />
            <Field label={t('Use a rubric', '选择评分标准')}>
              <select
                value={rubric}
                onChange={(e) => setRubric(e.target.value)}
              >
                <option>Argument & evidence</option>
                <option>Reflective writing</option>
                <option>Research essay</option>
              </select>
            </Field>
            <div className='ecp-rubric-summary'>
              <div>
                <span>{t('Argument', '论点')}</span>
                <strong>30%</strong>
              </div>
              <div>
                <span>{t('Evidence', '证据')}</span>
                <strong>30%</strong>
              </div>
              <div>
                <span>{t('Structure', '结构')}</span>
                <strong>25%</strong>
              </div>
              <div>
                <span>{t('Style', '表达')}</span>
                <strong>15%</strong>
              </div>
            </div>
            <TextLink onClick={() => go('rubrics')}>
              {t('Explore rubrics', '查看评分标准')}
            </TextLink>
          </Panel>
          <Note>
            {t(
              'This preview uses sample feedback. No essay is sent to an AI model.',
              '此预览展示示例反馈，不会将文章发送给 AI 模型。'
            )}
          </Note>
        </aside>
      </div>
    </>
  );
}

export function FeedbackView() {
  const {
    go,
    essay,
    setEssay,
    feedbackReady,
    setFeedbackReady,
    gradePublished,
    reviewScore
  } = usePrototype();
  const t = useT();
  const [chatInput, setChatInput] = useState('');
  const [chat, setChat] = useState<{ by: 'student' | 'coach'; text: string }[]>(
    []
  );
  const paragraphs = essay.split(/\n\s*\n/).filter(Boolean);
  function ask(event: FormEvent) {
    event.preventDefault();
    if (!chatInput.trim()) return;
    setChat((current) => [
      ...current,
      { by: 'student', text: chatInput.trim() },
      {
        by: 'coach',
        text: t(
          'Try adding one concrete example after your main claim, then explain how it supports your conclusion.',
          '试着在主要论点后加入一个具体例子，再说明它如何支持结论。'
        )
      }
    ]);
    setChatInput('');
  }
  return (
    <>
      <PageHeading
        eyebrow={t('Practice / Feedback', '练习 / 反馈')}
        title={t('A clearer path for your next draft.', '下一稿，可以更清晰。')}
        description={t(
          'Read the notes beside your writing, then choose one change to make first.',
          '结合正文旁的批注，先选一处开始修改。'
        )}
        action={
          <div className='ecp-heading-actions'>
            <MockLabel />
            <Action variant='secondary' onClick={() => window.print()}>
              {t('Print report', '打印报告')}
            </Action>
          </div>
        }
      />
      <div className='ecp-feedback-summary'>
        <div>
          <span>{t('Practice score', '练习参考分')}</span>
          <strong>
            78<span>/100</span>
          </strong>
          <small>
            {t(
              'Indicative only · not a formal grade',
              '仅供练习参考 · 非正式成绩'
            )}
          </small>
        </div>
        <div>
          <span>{t('What works', '写得好的地方')}</span>
          <strong>{t('Clear position', '立场清晰')}</strong>
          <small>
            {t('Your central idea is easy to follow.', '中心观点容易理解。')}
          </small>
        </div>
        <div>
          <span>{t('Next focus', '下次重点')}</span>
          <strong>{t('Evidence', '证据')}</strong>
          <small>
            {t(
              'Support the second paragraph with a source.',
              '用来源支持第二段。'
            )}
          </small>
        </div>
      </div>
      <div className='ecp-feedback-layout'>
        <div>
          <Panel className='ecp-annotated-paper'>
            <SectionHeading
              title={t('Your essay, with notes', '文章与批注')}
              detail={t(
                'Notes refer to the sample essay in this preview.',
                '批注针对当前预览示例。'
              )}
            />
            <div className='ecp-annotated-body'>
              {paragraphs.length ? (
                paragraphs.map((paragraph, index) => (
                  <div className='ecp-annotated-paragraph' key={index}>
                    <span className='ecp-annotation-marker'>{index + 1}</span>
                    <p>{paragraph}</p>
                    <aside>
                      <strong>
                        {index === 0
                          ? t('Strong opening', '开头有力')
                          : t('Add a source', '补充来源')}
                      </strong>
                      <small>
                        {index === 0
                          ? t(
                              'Your position is clear. Link it to the essay question more directly.',
                              '立场清晰，可与题目建立更直接的联系。'
                            )
                          : t(
                              'Which reading or study supports this claim?',
                              '哪篇阅读材料或研究能支持这一点？'
                            )}
                      </small>
                    </aside>
                  </div>
                ))
              ) : (
                <p>
                  {t(
                    'Your draft is empty. Return to the studio to begin writing.',
                    '草稿为空。返回写作空间开始写作。'
                  )}
                </p>
              )}
            </div>
          </Panel>
          <Panel className='ecp-feedback-section'>
            <SectionHeading title={t('Rubric breakdown', '评分标准细项')} />
            <div className='ecp-score-list'>
              {[
                [t('Argument', '论点'), 25, 30],
                [t('Evidence', '证据'), 20, 30],
                [t('Structure', '结构'), 20, 25],
                [t('Style', '表达'), 13, 15]
              ].map(([label, score, total]) => (
                <div key={label}>
                  <div>
                    <strong>{label}</strong>
                    <span>
                      {score} / {total}
                    </span>
                  </div>
                  <div className='ecp-score-track'>
                    <span
                      style={{
                        width: `${(Number(score) / Number(total)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <aside className='ecp-feedback-rail'>
          <Panel>
            <SectionHeading title={t('Fact-check preview', '事实核查预览')} />
            <div className='ecp-fact-item'>
              <Badge tone='amber'>{t('Source needed', '需要来源')}</Badge>
              <p>
                {t(
                  '“AI feedback can strengthen critical thinking.”',
                  '“AI 反馈能促进批判性思维。”'
                )}
              </p>
              <small>
                {t(
                  'A real run will show retrieved sources and a claim-by-claim judgment here.',
                  '真实运行会在这里展示检索到的来源与逐条判断。'
                )}
              </small>
            </div>
            <div className='ecp-fact-item'>
              <Badge tone='blue'>{t('Context check', '语境核对')}</Badge>
              <p>
                {t(
                  '“Teachers keep the final decision.”',
                  '“教师保留最终决定权。”'
                )}
              </p>
              <small>
                {t(
                  'Compare this statement with the course brief.',
                  '请与课程说明核对这一说法。'
                )}
              </small>
            </div>
          </Panel>
          <Panel className='ecp-coach'>
            <SectionHeading
              title={t('Ask your writing coach', '问问写作教练')}
            />
            <div className='ecp-coach-messages'>
              <div className='ecp-coach-message'>
                {t(
                  'Want to make a claim more convincing? Ask about a passage.',
                  '想让论点更有说服力？可以针对某个段落提问。'
                )}
              </div>
              {chat.map((message, index) => (
                <div
                  key={index}
                  className={`ecp-coach-message ${message.by === 'student' ? 'from-student' : ''}`}
                >
                  {message.text}
                </div>
              ))}
            </div>
            <form onSubmit={ask}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t('Ask about your feedback…', '针对反馈提问……')}
                aria-label={t('Ask writing coach', '向写作教练提问')}
              />
              <button type='submit' aria-label={t('Send question', '发送问题')}>
                <ArrowRight size={17} />
              </button>
            </form>
            <small>
              {t('Sample conversation in this preview', '此预览为示例对话')}
            </small>
          </Panel>
          <Note>
            {gradePublished
              ? t(
                  `Your formal grade of ${reviewScore}/100 was published by the course lead.`,
                  `课程负责人已发布你的正式成绩：${reviewScore}/100。`
                )
              : t(
                  'Formal grades appear only after the course lead reviews and publishes them.',
                  '正式成绩仅在课程负责人复核并发布后显示。'
                )}
          </Note>
        </aside>
      </div>
      <div className='ecp-sticky-actions'>
        <span>
          {feedbackReady
            ? t('Practice feedback ready', '练习反馈已准备好')
            : t('Showing a sample feedback report', '正在展示示例反馈报告')}
        </span>
        <Action variant='secondary' onClick={() => go('practice')}>
          {t('Revise essay', '修改文章')}
        </Action>
        <Action
          onClick={() => {
            setEssay('');
            setFeedbackReady(false);
            go('practice');
          }}
        >
          {t('Practice again', '再次练习')}
        </Action>
      </div>
    </>
  );
}

export function ReviewView() {
  const {
    go,
    role,
    essay,
    reviewScore,
    setReviewScore,
    reviewComment,
    setReviewComment,
    lecturerReviewed,
    setLecturerReviewed,
    reviewed,
    setReviewed,
    gradePublished,
    setGradePublished
  } = usePrototype();
  const t = useT();
  const [error, setError] = useState('');
  function approve() {
    if (
      !Number.isFinite(reviewScore) ||
      reviewScore < 0 ||
      reviewScore > 100 ||
      !reviewComment.trim()
    ) {
      setError(
        t(
          'Enter a score from 0 to 100 and a review comment.',
          '请输入 0–100 的分数及复核意见。'
        )
      );
      return;
    }
    setError('');
    if (role === 'lecturer') {
      setLecturerReviewed(true);
    } else if (lecturerReviewed) {
      setReviewed(true);
    } else {
      setError(
        t(
          'The lecturer must submit their review first.',
          '讲师需要先提交复核意见。'
        )
      );
    }
  }
  return (
    <>
      <PageHeading
        eyebrow={t('ENG 201 / Review queue', 'ENG 201 / 复核队列')}
        title={t('Your judgment, before release.', '发布之前，由你判断。')}
        description={
          role === 'lecturer'
            ? t(
                'Edit the AI proposal and send your review to the course lead.',
                '修改 AI 建议，并把复核意见提交给课程负责人。'
              )
            : t(
                'Confirm the lecturer review, then release the final grade.',
                '确认讲师的复核意见，然后发布最终成绩。'
              )
        }
        action={
          <Badge tone={gradePublished ? 'green' : reviewed ? 'blue' : 'amber'}>
            {gradePublished
              ? t('Published', '已发布')
              : reviewed
                ? t('Approved for release', '已确认待发布')
                : lecturerReviewed
                  ? t('Awaiting course lead', '等待课程负责人')
                  : t('Needs lecturer review', '待讲师复核')}
          </Badge>
        }
      />
      <div className='ecp-review-layout'>
        <div>
          <Panel className='ecp-review-submission'>
            <div className='ecp-review-submission-head'>
              <span className='ecp-review-avatar'>AM</span>
              <div>
                <strong>Alex Morgan</strong>
                <small>
                  {t(
                    'Argument essay: learning with AI',
                    '议论文：与 AI 一起学习'
                  )}{' '}
                  · ENG 201
                </small>
              </div>
              <span className='ecp-muted'>
                {t('Submitted 24 September', '9 月 24 日提交')}
              </span>
            </div>
            <div className='ecp-review-paper'>
              <h2>{t('Who owns the final judgment?', '谁来作出最终判断？')}</h2>
              {essay
                .split(/\n\s*\n/)
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>
          </Panel>
          <Panel className='ecp-feedback-section'>
            <SectionHeading title={t('Evidence to inspect', '待查看的证据')} />
            <div className='ecp-evidence-row'>
              <span>
                <SearchCheck size={19} />
              </span>
              <div>
                <strong>{t('Claim needs a source', '论断需要来源')}</strong>
                <p>
                  {t(
                    'The statement about critical thinking has no cited study in the draft.',
                    '关于批判性思维的论断在草稿中未引用研究。'
                  )}
                </p>
                <small>
                  {t(
                    'Sample fact-check result · no live search performed',
                    '示例核查结果 · 未进行实时搜索'
                  )}
                </small>
              </div>
            </div>
            <div className='ecp-evidence-row'>
              <span>
                <FileText size={19} />
              </span>
              <div>
                <strong>{t('Rubric version', '评分标准版本')}</strong>
                <p>
                  {t(
                    'Argument & evidence · version 2 · 100 points',
                    '论证与证据 · 第 2 版 · 100 分'
                  )}
                </p>
              </div>
            </div>
          </Panel>
        </div>
        <aside className='ecp-review-rail'>
          <Panel>
            <SectionHeading
              title={t('AI draft score', 'AI 评分草稿')}
              detail={t(
                'Proposed score is never published automatically.',
                '建议分数不会自动发布。'
              )}
            />
            <div className='ecp-ai-score'>
              74<span>/100</span>
            </div>
            <div className='ecp-score-compare'>
              <span>{t('Argument', '论点')} 24/30</span>
              <span>{t('Evidence', '证据')} 18/30</span>
              <span>{t('Structure', '结构')} 19/25</span>
              <span>{t('Style', '表达')} 13/15</span>
            </div>
          </Panel>
          <Panel>
            <SectionHeading
              title={
                role === 'lecturer'
                  ? t('Lecturer review', '讲师复核')
                  : t('Course-lead decision', '课程负责人决定')
              }
            />
            <Field
              label={t('Final score', '最终分数')}
              hint={t('0–100 points', '0–100 分')}
            >
              <input
                type='number'
                min='0'
                max='100'
                disabled={gradePublished}
                value={reviewScore}
                onChange={(e) => {
                  setReviewScore(Number(e.target.value));
                  if (role === 'lecturer') setLecturerReviewed(false);
                  setReviewed(false);
                  setGradePublished(false);
                }}
              />
            </Field>
            <Field label={t('Feedback to student', '给学生的反馈')}>
              <textarea
                rows={5}
                disabled={gradePublished}
                value={reviewComment}
                onChange={(e) => {
                  setReviewComment(e.target.value);
                  if (role === 'lecturer') setLecturerReviewed(false);
                  setReviewed(false);
                  setGradePublished(false);
                }}
              />
            </Field>
            {error && (
              <div className='ecp-form-error' role='alert'>
                {error}
              </div>
            )}
            <div className='ecp-review-actions'>
              <Action
                variant='secondary'
                disabled={gradePublished}
                onClick={approve}
              >
                {role === 'lecturer'
                  ? lecturerReviewed
                    ? t('Update teacher review', '更新讲师复核')
                    : t('Send to course lead', '提交给课程负责人')
                  : reviewed
                    ? t('Update approval', '更新确认')
                    : t('Approve draft', '确认草稿')}
              </Action>
              {role === 'course_lead' && (
                <Action
                  disabled={!reviewed || gradePublished}
                  onClick={() => setGradePublished(true)}
                  icon={<CheckCircle2 size={17} />}
                >
                  {gradePublished
                    ? t('Published in preview', '预览中已发布')
                    : t('Publish grade', '发布成绩')}
                </Action>
              )}
            </div>
            <small className='ecp-muted'>
              {t(
                'Preview state only. No real grade is changed.',
                '仅更改预览状态，不会修改真实成绩。'
              )}
            </small>
          </Panel>
          <button className='ecp-subtle-link' onClick={() => go('dashboard')}>
            {t('Back to overview', '返回总览')}
          </button>
        </aside>
      </div>
    </>
  );
}
