'use client';

import { FormEvent, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  Download,
  GraduationCap,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  X
} from 'lucide-react';
import { usePrototype, useT } from './prototype-context';
import {
  Action,
  Badge,
  EmptyState,
  Field,
  MockLabel,
  Note,
  PageHeading,
  Panel,
  SectionHeading,
  TextLink
} from './prototype-ui';

export function AnalyticsView() {
  const { role } = usePrototype();
  const t = useT();
  const [range, setRange] = useState('term');
  const [sortHigh, setSortHigh] = useState(true);
  const bars = range === 'month' ? [42, 56, 51, 70] : [33, 41, 53, 58, 67, 73];
  const rows = [
    { name: 'ENG 201', drafts: 48, average: 78 },
    { name: 'ENG 101', drafts: 36, average: 74 },
    { name: 'HUM 330', drafts: 29, average: 82 }
  ].sort((a, b) => (sortHigh ? b.average - a.average : a.average - b.average));
  function exportCsv() {
    const csv =
      role === 'student'
        ? [
            'metric,value',
            'drafts_completed,12',
            'revisions_made,8',
            'writing_streak_weeks,4'
          ].join('\n')
        : [
            'class,drafts,approved_average',
            ...rows.map((row) => `${row.name},${row.drafts},${row.average}`)
          ].join('\n');
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8' })
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'essaycoach-preview-analytics.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageHeading
        eyebrow={t('Learning signals', '学习信号')}
        title={t('Analytics', '数据分析')}
        description={
          role === 'student'
            ? t(
                'See how your writing habits are changing over time.',
                '看看自己的写作习惯如何随时间变化。'
              )
            : role === 'lecturer'
              ? t(
                  'Spot patterns across your classes and decide where to help next.',
                  '发现班级中的规律，决定下一步重点帮助哪里。'
                )
              : role === 'course_lead'
                ? t(
                    'Review activity and approved outcomes across your courses.',
                    '查看所负责课程的写作活动与已确认结果。'
                  )
                : t(
                    'Understand writing activity across the institution.',
                    '了解整个机构的写作活动。'
                  )
        }
        action={
          <div className='ecp-heading-actions'>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              aria-label={t('Time range', '时间范围')}
            >
              <option value='term'>{t('This term', '本学期')}</option>
              <option value='month'>{t('This month', '本月')}</option>
            </select>
            <Action
              variant='secondary'
              onClick={exportCsv}
              icon={<Download size={17} />}
            >
              {t('Export sample CSV', '导出示例 CSV')}
            </Action>
          </div>
        }
      />
      <div className='ecp-stats-grid'>
        <div>
          <span>
            {role === 'student'
              ? t('Drafts completed', '完成的草稿')
              : t('Essays submitted', '已提交文章')}
          </span>
          <strong>
            {role === 'student' ? '12' : role === 'admin' ? '342' : '113'}
          </strong>
          <small>{t('In selected period', '所选时间范围内')}</small>
        </div>
        <div>
          <span>
            {role === 'student'
              ? t('Revisions made', '已完成修改')
              : role === 'lecturer'
                ? t('Reviews submitted', '已提交复核')
                : t('Grades approved', '已确认成绩')}
          </span>
          <strong>
            {role === 'student' ? '8' : role === 'admin' ? '266' : '87'}
          </strong>
          <small>{t('Course-led process', '由课程负责人把关')}</small>
        </div>
        <div>
          <span>
            {role === 'student'
              ? t('Writing streak', '连续写作')
              : t('Classes represented', '涉及班级')}
          </span>
          <strong>
            {role === 'student' ? '4' : role === 'admin' ? '6' : '3'}
          </strong>
          <small>
            {role === 'student'
              ? t('Weeks', '周')
              : t('Active this term', '本学期活跃')}
          </small>
        </div>
      </div>
      <div className='ecp-two-col ecp-two-col--wide'>
        <Panel>
          <SectionHeading
            title={
              role === 'student'
                ? t('Your progress', '你的进步')
                : t('Submission rhythm', '提交节奏')
            }
            detail={t(
              'Illustrative values for the selected period.',
              '所选时间范围的示例数值。'
            )}
          />
          <div
            className='ecp-chart'
            role='img'
            aria-label={t('Illustrative upward bar chart', '示例上升柱状图')}
          >
            {bars.map((height, index) => (
              <div key={index}>
                <span style={{ height: `${height}%` }} />
                <small>
                  {range === 'month' ? `W${index + 1}` : `${index + 1}`}
                </small>
              </div>
            ))}
          </div>
          <div className='ecp-chart-caption'>
            <TrendingUp size={16} />
            {t(
              'More students are revising before submission.',
              '越来越多学生在提交前进行修改。'
            )}
          </div>
        </Panel>
        <Panel>
          <SectionHeading title={t('Common writing focus', '常见写作重点')} />
          <div className='ecp-insight-list'>
            <div>
              <span>{t('Evidence and citation', '证据与引用')}</span>
              <strong>42%</strong>
              <i style={{ width: '42%' }} />
            </div>
            <div>
              <span>{t('Argument clarity', '论点清晰度')}</span>
              <strong>31%</strong>
              <i style={{ width: '31%' }} />
            </div>
            <div>
              <span>{t('Paragraph structure', '段落结构')}</span>
              <strong>27%</strong>
              <i style={{ width: '27%' }} />
            </div>
          </div>
          <Note>
            {t(
              'Insights are illustrative and based on sample records.',
              '这些分析来自示例记录，仅用于预览。'
            )}
          </Note>
        </Panel>
      </div>
      {role !== 'student' && (
        <Panel className='ecp-analytics-table'>
          <SectionHeading
            title={
              role === 'admin'
                ? t('Classes across the institution', '机构班级表现')
                : t('My classes', '我的班级')
            }
          />
          <div className='ecp-table'>
            <div className='ecp-table-head'>
              <span>{t('Class', '班级')}</span>
              <span>{t('Drafts', '草稿')}</span>
              <button onClick={() => setSortHigh((value) => !value)}>
                {t('Approved average', '已确认成绩均分')}{' '}
                <ChevronDown size={15} />
              </button>
            </div>
            {rows.map((row) => (
              <div className='ecp-table-row' key={row.name}>
                <strong>{row.name}</strong>
                <span>{row.drafts}</span>
                <span>{row.average}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}

export function UsersView() {
  const { invitedUsers, setInvitedUsers } = usePrototype();
  const t = useT();
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'lecturer' | 'course_lead'>(
    'lecturer'
  );
  const [selectedUser, setSelectedUser] = useState<{
    name: string;
    email: string;
    role: string;
    status: string;
  } | null>(null);
  const [disabledEmails, setDisabledEmails] = useState<string[]>([]);
  const users = [
    {
      name: 'Dr. Lin',
      email: 'lin@northbridge.edu',
      role: 'course_lead',
      status: 'active'
    },
    {
      name: 'Prof. Chen',
      email: 'chen@northbridge.edu',
      role: 'lecturer',
      status: 'active'
    },
    {
      name: 'Alex Morgan',
      email: 'alex@northbridge.edu',
      role: 'student',
      status: 'active'
    },
    {
      name: 'Maya Patel',
      email: 'maya@northbridge.edu',
      role: 'student',
      status: 'active'
    },
    ...invitedUsers.map((value) => ({
      name: value.split('|')[0],
      email: value.split('|')[1],
      role: value.split('|')[2] || 'lecturer',
      status: 'invited'
    }))
  ].map((user) => ({
    ...user,
    status: disabledEmails.includes(user.email) ? 'disabled' : user.status
  }));
  const visible = users.filter(
    (user) =>
      (roleFilter === 'all' || user.role === roleFilter) &&
      `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())
  );
  function invite(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.includes('@')) return;
    setInvitedUsers([
      ...invitedUsers,
      `${name.trim()}|${email.trim()}|${inviteRole}`
    ]);
    setCreating(false);
    setName('');
    setEmail('');
  }
  return (
    <>
      <PageHeading
        eyebrow={t('Institution access', '机构访问权限')}
        title={t('People', '人员管理')}
        description={t(
          'Manage teaching staff here. Students join through a lecturer invitation to a class.',
          '在这里管理教学人员；学生由讲师邀请加入班级。'
        )}
        action={
          <Action onClick={() => setCreating(true)} icon={<Plus size={17} />}>
            {t('Invite teaching staff', '邀请教学人员')}
          </Action>
        }
      />
      <div className='ecp-toolbar'>
        <label className='ecp-search'>
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Search name or email', '搜索姓名或邮箱')}
          />
        </label>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label={t('Role filter', '角色筛选')}
        >
          <option value='all'>{t('All roles', '全部角色')}</option>
          <option value='lecturer'>{t('Lecturers', '讲师')}</option>
          <option value='course_lead'>{t('Course leads', '课程负责人')}</option>
          <option value='student'>{t('Students', '学生')}</option>
        </select>
      </div>
      <Panel className='ecp-people-panel'>
        <div className='ecp-table'>
          <div className='ecp-table-head ecp-table-head--people'>
            <span>{t('Person', '人员')}</span>
            <span>{t('Role', '角色')}</span>
            <span>{t('Status', '状态')}</span>
          </div>
          {visible.length ? (
            visible.map((user) => (
              <button
                className='ecp-table-row ecp-table-row--people ecp-person-button'
                key={user.email}
                onClick={() => setSelectedUser(user)}
              >
                <span className='ecp-person-cell'>
                  <span className='ecp-review-avatar'>
                    {user.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <span>
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </span>
                </span>
                <span>
                  {user.role === 'lecturer'
                    ? t('Lecturer', '讲师')
                    : user.role === 'course_lead'
                      ? t('Course lead', '课程负责人')
                      : t('Student', '学生')}
                </span>
                <Badge
                  tone={
                    user.status === 'active'
                      ? 'green'
                      : user.status === 'disabled'
                        ? 'neutral'
                        : 'amber'
                  }
                >
                  {user.status === 'active'
                    ? t('Active', '活跃')
                    : user.status === 'disabled'
                      ? t('Disabled', '已停用')
                      : t('Invited', '已邀请')}
                </Badge>
              </button>
            ))
          ) : (
            <EmptyState
              title={t('No people found', '没有找到人员')}
              body={t(
                'Try another search or role filter.',
                '换个关键词或角色筛选试试。'
              )}
            />
          )}
        </div>
      </Panel>
      <Note>
        {t(
          'Invitations and status changes affect this preview only. No email is sent.',
          '邀请与状态修改仅更改预览数据，不会发送邮件。'
        )}
      </Note>
      {creating && (
        <div className='ecp-modal-backdrop' onClick={() => setCreating(false)}>
          <div
            className='ecp-modal ecp-modal--small'
            role='dialog'
            aria-modal='true'
            aria-label={t('Invite teaching staff', '邀请教学人员')}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className='ecp-modal-close'
              onClick={() => setCreating(false)}
              aria-label={t('Close', '关闭')}
            >
              <X size={20} />
            </button>
            <span className='ecp-context'>
              {t('Institution invitation', '机构邀请')}
            </span>
            <h2>{t('Invite teaching staff', '邀请教学人员')}</h2>
            <p>
              {t(
                'They can create classes and invite their students.',
                '受邀者可以创建班级并邀请学生。'
              )}
            </p>
            <form onSubmit={invite}>
              <Field label={t('Name', '姓名')}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
              <Field label={t('School email', '学校邮箱')}>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>
              <Field label={t('Role', '角色')}>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as 'lecturer' | 'course_lead')
                  }
                >
                  <option value='lecturer'>{t('Lecturer', '讲师')}</option>
                  <option value='course_lead'>
                    {t('Course lead', '课程负责人')}
                  </option>
                </select>
              </Field>
              <div className='ecp-modal-actions'>
                <Action
                  type='button'
                  variant='quiet'
                  onClick={() => setCreating(false)}
                >
                  {t('Cancel', '取消')}
                </Action>
                <Action type='submit'>
                  {t('Add preview invitation', '添加预览邀请')}
                </Action>
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedUser && (
        <div
          className='ecp-modal-backdrop'
          onClick={() => setSelectedUser(null)}
        >
          <div
            className='ecp-modal ecp-modal--small'
            role='dialog'
            aria-modal='true'
            aria-label={t('Person details', '人员详情')}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className='ecp-modal-close'
              onClick={() => setSelectedUser(null)}
              aria-label={t('Close', '关闭')}
            >
              <X size={20} />
            </button>
            <span className='ecp-context'>
              {t('Institution directory', '机构人员目录')}
            </span>
            <h2>{selectedUser.name}</h2>
            <p>{selectedUser.email}</p>
            <div className='ecp-person-details'>
              <span>
                {t('Role', '角色')}
                <strong>
                  {selectedUser.role === 'course_lead'
                    ? t('Course lead', '课程负责人')
                    : selectedUser.role === 'lecturer'
                      ? t('Lecturer', '讲师')
                      : t('Student', '学生')}
                </strong>
              </span>
              <span>
                {t('Status', '状态')}
                <strong>
                  {disabledEmails.includes(selectedUser.email)
                    ? t('Disabled', '已停用')
                    : selectedUser.status === 'invited'
                      ? t('Invited', '已邀请')
                      : t('Active', '活跃')}
                </strong>
              </span>
            </div>
            {selectedUser.role === 'student' ? (
              <Note>
                {t(
                  'Student access is managed through the class lecturer.',
                  '学生访问权限由班级讲师管理。'
                )}
              </Note>
            ) : (
              <div className='ecp-modal-actions'>
                <Action
                  variant='secondary'
                  onClick={() => {
                    setDisabledEmails((items) =>
                      items.includes(selectedUser.email)
                        ? items.filter((email) => email !== selectedUser.email)
                        : [...items, selectedUser.email]
                    );
                    setSelectedUser(null);
                  }}
                >
                  {disabledEmails.includes(selectedUser.email)
                    ? t('Restore preview access', '恢复预览权限')
                    : t('Disable preview access', '停用预览权限')}
                </Action>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function ProfileView() {
  const { role, go, gradePublished } = usePrototype();
  const t = useT();
  const [tab, setTab] = useState<'overview' | 'activity'>('overview');
  const [publicProfile, setPublicProfile] = useState(false);
  const [showScores, setShowScores] = useState(false);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const name =
    role === 'student'
      ? 'Alex Morgan'
      : role === 'admin'
        ? 'Morgan Ellis'
        : 'Dr. Lin';
  return (
    <>
      <PageHeading
        eyebrow={t('Your workspace', '你的工作区')}
        title={t('Profile', '个人资料')}
        description={
          role === 'student'
            ? t('A record of your writing journey.', '记录你的写作历程。')
            : role === 'admin'
              ? t('Your work across the institution.', '记录你的机构管理工作。')
              : t('A record of your teaching journey.', '记录你的教学历程。')
        }
        action={
          <Action variant='secondary' onClick={() => setEditing(true)}>
            {t('Edit profile', '编辑资料')}
          </Action>
        }
      />
      <Panel className='ecp-profile-hero'>
        <div className='ecp-profile-avatar'>
          {name
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)}
        </div>
        <div>
          <Badge tone='blue'>
            {role === 'student'
              ? t('Student', '学生')
              : role === 'lecturer'
                ? t('Lecturer', '讲师')
                : role === 'course_lead'
                  ? t('Course lead', '课程负责人')
                  : t('Administrator', '管理员')}
          </Badge>
          <h2>{name}</h2>
          <p>
            Northbridge Academy ·{' '}
            {t('Joined September 2026', '2026 年 9 月加入')}
          </p>
          {bio && <p className='ecp-profile-bio'>{bio}</p>}
        </div>
      </Panel>
      <div className='ecp-tabs ecp-tabs--page'>
        <button
          className={tab === 'overview' ? 'active' : ''}
          onClick={() => setTab('overview')}
        >
          {t('Overview', '概览')}
        </button>
        <button
          className={tab === 'activity' ? 'active' : ''}
          onClick={() => setTab('activity')}
        >
          {role === 'student'
            ? t('Writing history', '写作记录')
            : t('Activity', '活动记录')}
        </button>
      </div>
      {tab === 'overview' ? (
        <div className='ecp-two-col'>
          <Panel>
            <SectionHeading
              title={
                role === 'student'
                  ? t('Your writing at a glance', '写作概览')
                  : t('Your work at a glance', '工作概览')
              }
            />
            <div className='ecp-profile-stats'>
              <div>
                <strong>
                  {role === 'student' ? '12' : role === 'admin' ? '48' : '3'}
                </strong>
                <span>
                  {role === 'student'
                    ? t('Drafts', '草稿')
                    : role === 'admin'
                      ? t('People', '人员')
                      : t('Classes', '班级')}
                </span>
              </div>
              <div>
                <strong>
                  {role === 'student' ? '8' : role === 'admin' ? '3' : '24'}
                </strong>
                <span>
                  {role === 'student'
                    ? t('Revisions', '修改')
                    : role === 'admin'
                      ? t('Invitations', '邀请')
                      : t('Reviews', '复核')}
                </span>
              </div>
              <div>
                <strong>{role === 'student' ? '4' : '6'}</strong>
                <span>
                  {role === 'student'
                    ? t('Rubrics used', '使用标准')
                    : role === 'admin'
                      ? t('Classes', '班级')
                      : t('Rubrics', '评分标准')}
                </span>
              </div>
            </div>
            <TextLink onClick={() => go('analytics')}>
              {t('View progress', '查看进展')}
            </TextLink>
          </Panel>
          <Panel>
            <SectionHeading title={t('Profile visibility', '资料可见范围')} />
            <label className='ecp-toggle-row'>
              <span>
                <strong>
                  {role === 'student'
                    ? t('Visible to classmates', '同学可见')
                    : t('Visible to colleagues', '同事可见')}
                </strong>
                <small>
                  {t(
                    'Choose whether your profile appears in class spaces.',
                    '决定资料是否显示在班级空间。'
                  )}
                </small>
              </span>
              <input
                type='checkbox'
                checked={publicProfile}
                onChange={(e) => setPublicProfile(e.target.checked)}
              />
            </label>
            {role === 'student' && (
              <label className='ecp-toggle-row'>
                <span>
                  <strong>
                    {t('Show scores on profile', '在资料中显示成绩')}
                  </strong>
                  <small>
                    {t(
                      'Only approved, published scores can be shown.',
                      '仅可显示已确认并发布的成绩。'
                    )}
                  </small>
                </span>
                <input
                  type='checkbox'
                  checked={showScores}
                  onChange={(e) => setShowScores(e.target.checked)}
                  disabled={!gradePublished}
                />
              </label>
            )}
          </Panel>
        </div>
      ) : (
        <Panel>
          <SectionHeading
            title={
              role === 'student'
                ? t('Recent essays', '近期文章')
                : t('Recent activity', '近期活动')
            }
          />
          <div className='ecp-list-row'>
            <span className='ecp-list-icon'>
              <BookOpen size={18} />
            </span>
            <span>
              <strong>
                {role === 'student'
                  ? t(
                      'Argument essay: learning with AI',
                      '议论文：与 AI 一起学习'
                    )
                  : role === 'admin'
                    ? t('Invited a course lead', '邀请了一位课程负责人')
                    : t('Reviewed ENG 201 feedback', '复核了 ENG 201 的反馈')}
              </strong>
              <small>{t('24 September 2026', '2026 年 9 月 24 日')}</small>
            </span>
            <Badge
              tone={role === 'admin' || gradePublished ? 'green' : 'amber'}
            >
              {role === 'admin'
                ? t('Recorded', '已记录')
                : gradePublished
                  ? t('Published', '已发布')
                  : t('In progress', '进行中')}
            </Badge>
          </div>
          <div className='ecp-list-row'>
            <span className='ecp-list-icon'>
              <BookOpen size={18} />
            </span>
            <span>
              <strong>
                {role === 'admin'
                  ? t('Updated institution access', '更新了机构访问权限')
                  : t('The value of a second draft', '第二稿的价值')}
              </strong>
              <small>{t('18 September 2026', '2026 年 9 月 18 日')}</small>
            </span>
            <Badge tone='green'>{t('Completed', '已完成')}</Badge>
          </div>
        </Panel>
      )}
      {editing && (
        <div className='ecp-modal-backdrop' onClick={() => setEditing(false)}>
          <div
            className='ecp-modal ecp-modal--small'
            role='dialog'
            aria-modal='true'
            aria-label={t('Edit profile', '编辑资料')}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className='ecp-modal-close'
              onClick={() => setEditing(false)}
              aria-label={t('Close', '关闭')}
            >
              <X size={20} />
            </button>
            <span className='ecp-context'>{t('Your profile', '个人资料')}</span>
            <h2>{t('Edit your introduction', '编辑个人简介')}</h2>
            <p>
              {t(
                'Share a little about your writing or teaching interests.',
                '介绍一下你的写作或教学兴趣。'
              )}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setEditing(false);
              }}
            >
              <Field label={t('Bio', '简介')}>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t(
                    'What are you working on?',
                    '你目前在探索什么？'
                  )}
                />
              </Field>
              <div className='ecp-modal-actions'>
                <Action
                  variant='quiet'
                  type='button'
                  onClick={() => setEditing(false)}
                >
                  {t('Cancel', '取消')}
                </Action>
                <Action type='submit'>
                  {t('Save preview profile', '保存预览资料')}
                </Action>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function SettingsView() {
  const { language, setLanguage, go } = usePrototype();
  const t = useT();
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [feedbackAlerts, setFeedbackAlerts] = useState(true);
  const [saved, setSaved] = useState(false);
  return (
    <>
      <PageHeading
        eyebrow={t('Your preferences', '个人偏好')}
        title={t('Settings', '设置')}
        description={t(
          'Make the workspace feel right for the way you learn or teach.',
          '让工作区更符合你的学习或教学方式。'
        )}
        action={
          <Action onClick={() => setSaved(true)} icon={<Check size={16} />}>
            {t('Save preferences', '保存偏好设置')}
          </Action>
        }
      />
      <div className='ecp-settings-stack'>
        <Panel>
          <SectionHeading
            title={t('Language & display', '语言与显示')}
            detail={t(
              'Available in English and Chinese for this preview.',
              '此预览支持英语和中文。'
            )}
          />
          <Field label={t('Interface language', '界面语言')}>
            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value as 'en' | 'zh');
                setSaved(false);
              }}
            >
              <option value='en'>English</option>
              <option value='zh'>简体中文</option>
            </select>
          </Field>
        </Panel>
        <Panel>
          <SectionHeading title={t('Notifications', '通知')} />
          <label className='ecp-toggle-row'>
            <span>
              <strong>{t('Email updates', '邮件更新')}</strong>
              <small>
                {t(
                  'Course notices and assignment reminders.',
                  '课程通知与作业提醒。'
                )}
              </small>
            </span>
            <input
              type='checkbox'
              checked={emailUpdates}
              onChange={(e) => {
                setEmailUpdates(e.target.checked);
                setSaved(false);
              }}
            />
          </label>
          <label className='ecp-toggle-row'>
            <span>
              <strong>{t('Feedback alerts', '反馈提醒')}</strong>
              <small>
                {t(
                  'Know when practice feedback or a formal grade is ready.',
                  '练习反馈或正式成绩可查看时提醒我。'
                )}
              </small>
            </span>
            <input
              type='checkbox'
              checked={feedbackAlerts}
              onChange={(e) => {
                setFeedbackAlerts(e.target.checked);
                setSaved(false);
              }}
            />
          </label>
        </Panel>
        <Panel>
          <SectionHeading title={t('Account', '账号')} />
          <div className='ecp-list-row'>
            <span className='ecp-list-icon'>
              <ShieldCheck size={18} />
            </span>
            <span>
              <strong>
                {t('Institution-managed access', '由机构管理的访问权限')}
              </strong>
              <small>
                {t(
                  'Your institution controls account invitations.',
                  '账号邀请由所属机构管理。'
                )}
              </small>
            </span>
          </div>
          <TextLink onClick={() => go('profile')}>
            {t('View profile', '查看个人资料')}
          </TextLink>
        </Panel>
        {saved && (
          <Note>
            {t(
              'Preferences saved in this preview session.',
              '偏好设置已在本次预览中保存。'
            )}
          </Note>
        )}
      </div>
    </>
  );
}

export function HelpView() {
  const { role } = usePrototype();
  const t = useT();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<number | null>(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const faqs = [
    {
      q: t('How do I join a class?', '如何加入班级？'),
      a: t(
        'Your lecturer sends an invitation. Open the link and activate your account with your school email.',
        '讲师会发送邀请。打开链接并使用学校邮箱激活账号。'
      )
    },
    {
      q: t('Is practice feedback my final grade?', '练习反馈是最终成绩吗？'),
      a: t(
        'No. Practice feedback helps you revise. A formal score is released only after the course lead reviews and confirms it.',
        '不是。练习反馈用于帮助修改。正式成绩须经课程负责人复核并确认后才会发布。'
      )
    },
    {
      q: t('Can I change my rubric?', '可以更换评分标准吗？'),
      a: t(
        'You can choose a rubric for private practice. Assignment rubrics are set by the course lead.',
        '私人练习可选择评分标准。正式作业的标准由课程负责人设置。'
      )
    },
    {
      q: t(
        'Where do the fact-check sources appear?',
        '事实核查的来源在哪里查看？'
      ),
      a: t(
        'Verified claims and their sources appear beside the feedback report for review.',
        '经过核对的论断及其来源会显示在反馈报告旁，供你查看。'
      )
    }
  ];
  const visible = faqs
    .map((faq, index) => ({ ...faq, index }))
    .filter((faq) =>
      `${faq.q} ${faq.a}`.toLowerCase().includes(query.toLowerCase())
    );
  function submit(event: FormEvent) {
    event.preventDefault();
    if (subject.trim() && message.trim()) setSent(true);
  }
  return (
    <>
      <PageHeading
        eyebrow={t('Guides and support', '指南与支持')}
        title={t('Help centre', '帮助中心')}
        description={t(
          'Find a quick answer or tell us what you need.',
          '查找答案，或告诉我们你需要什么帮助。'
        )}
        action={<MockLabel />}
      />
      <label className='ecp-help-search'>
        <Search size={22} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(
            'Search writing, feedback, classes…',
            '搜索写作、反馈、班级……'
          )}
          aria-label={t('Search help', '搜索帮助')}
        />
      </label>
      <div className='ecp-help-categories'>
        <div>
          <BookOpen size={22} />
          <strong>{t('Getting started', '开始使用')}</strong>
          <small>{t('Invitations and your workspace', '邀请与工作区')}</small>
        </div>
        <div>
          <GraduationCap size={22} />
          <strong>{t('Classes & work', '班级与作业')}</strong>
          <small>
            {t('Tasks, rubrics, and submissions', '任务、评分标准与提交')}
          </small>
        </div>
        <div>
          <SlidersHorizontal size={22} />
          <strong>{t('Feedback & grades', '反馈与成绩')}</strong>
          <small>{t('Practice and teacher review', '练习与教师复核')}</small>
        </div>
      </div>
      <div className='ecp-two-col ecp-two-col--wide'>
        <Panel>
          <SectionHeading title={t('Common questions', '常见问题')} />
          {visible.length ? (
            visible.map((faq) => (
              <div className='ecp-faq' key={faq.index}>
                <button
                  onClick={() => setOpen(open === faq.index ? null : faq.index)}
                  aria-expanded={open === faq.index}
                >
                  <strong>{faq.q}</strong>
                  <ChevronDown size={18} />
                </button>
                {open === faq.index && <p>{faq.a}</p>}
              </div>
            ))
          ) : (
            <EmptyState
              title={t('No matching articles', '没有找到匹配的文章')}
              body={t(
                'Try a shorter search or contact support.',
                '试试更短的关键词，或联系支持团队。'
              )}
            />
          )}
        </Panel>
        <Panel>
          <SectionHeading
            title={t('Need a hand?', '需要帮助？')}
            detail={t(
              'Tell us what happened. This preview keeps your message local.',
              '告诉我们遇到了什么。此预览不会发送消息。'
            )}
          />
          {sent ? (
            <div className='ecp-support-success'>
              <span>
                <Check size={24} />
              </span>
              <h3>{t('Request drafted', '请求草稿已记录')}</h3>
              <p>
                {t(
                  'In the full product, a support ticket would be created. No message was sent from this preview.',
                  '正式产品会创建支持工单。此预览未发送任何消息。'
                )}
              </p>
              <Action
                variant='secondary'
                onClick={() => {
                  setSent(false);
                  setSubject('');
                  setMessage('');
                }}
              >
                {t('Write another', '再写一条')}
              </Action>
            </div>
          ) : (
            <form onSubmit={submit}>
              <Field label={t('Topic', '主题')}>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={
                    role === 'student'
                      ? t('Question about feedback', '关于反馈的问题')
                      : t('Question about a class', '关于班级的问题')
                  }
                  required
                />
              </Field>
              <Field
                label={t('What do you need help with?', '你需要什么帮助？')}
              >
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </Field>
              <Action type='submit' icon={<ArrowRight size={17} />}>
                {t('Create preview request', '创建预览请求')}
              </Action>
            </form>
          )}
        </Panel>
      </div>
    </>
  );
}
