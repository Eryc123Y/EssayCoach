'use client';

import { FormEvent, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CalendarDays,
  ChevronRight,
  FilePlus2,
  FileText,
  Flag,
  GraduationCap,
  Heart,
  LockKeyhole,
  MessageCircle,
  Plus,
  Search,
  Send,
  UploadCloud,
  UsersRound,
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

type Rubric = {
  name: string;
  course: string;
  visibility: 'class' | 'private';
  criteria: string[];
};

export function RubricsView() {
  const { role, notify } = usePrototype();
  const t = useT();
  const [rubrics, setRubrics] = useState<Rubric[]>([
    {
      name: 'Argument & evidence',
      course: 'ENG 201',
      visibility: 'class',
      criteria: ['Argument', 'Evidence', 'Structure', 'Style']
    },
    {
      name: 'Reflective writing',
      course: 'ENG 101',
      visibility: 'class',
      criteria: ['Insight', 'Reflection', 'Clarity']
    },
    {
      name: 'Research essay',
      course: 'Personal',
      visibility: 'private',
      criteria: ['Question', 'Sources', 'Analysis']
    }
  ]);
  const [filter, setFilter] = useState<'all' | 'class' | 'private'>('all');
  const [selected, setSelected] = useState(0);
  const [creating, setCreating] = useState(false);
  const [method, setMethod] = useState<'manual' | 'pdf'>('manual');
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'class' | 'private'>(
    role === 'student' ? 'private' : 'class'
  );
  const [criterion, setCriterion] = useState('Argument');
  const [secondCriterion, setSecondCriterion] = useState('Evidence');
  const filtered = rubrics
    .map((rubric, index) => ({ ...rubric, index }))
    .filter((rubric) => filter === 'all' || rubric.visibility === filter);
  function create(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    const next: Rubric = {
      name: name.trim(),
      course: role === 'student' ? 'Personal' : 'ENG 201',
      visibility: role === 'student' ? 'private' : visibility,
      criteria:
        method === 'pdf'
          ? ['Extracted criterion 1', 'Extracted criterion 2']
          : [criterion, secondCriterion].filter(Boolean)
    };
    setRubrics((current) => [...current, next]);
    setSelected(rubrics.length);
    setFilter('all');
    setCreating(false);
    setName('');
    notify(t('Rubric created in this preview.', '评分标准已在预览中创建。'));
  }
  const active = rubrics[selected] || rubrics[0];
  return (
    <>
      <PageHeading
        eyebrow={t('Teaching tools', '教学工具')}
        title={t('Rubric library', '评分标准库')}
        description={t(
          'Make expectations clear before a student starts writing.',
          '让学生在动笔前就明白评价标准。'
        )}
        action={
          role !== 'admin' && (
            <Action
              onClick={() => {
                setVisibility(role === 'student' ? 'private' : 'class');
                setCreating(true);
              }}
              icon={<Plus size={17} />}
            >
              {t('Create rubric', '创建评分标准')}
            </Action>
          )
        }
      />
      <div className='ecp-toolbar'>
        <div
          className='ecp-segmented'
          role='group'
          aria-label={t('Filter rubrics', '筛选评分标准')}
        >
          {(
            [
              ['all', t('All', '全部')],
              ['class', t('Shared with class', '班级共享')],
              ['private', t('Private', '私密')]
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              className={filter === key ? 'active' : ''}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <MockLabel />
      </div>
      <div className='ecp-library-layout'>
        <Panel className='ecp-library-list'>
          <div className='ecp-table-heading'>
            <span>{t('Rubric', '评分标准')}</span>
            <span>{t('Visibility', '可见范围')}</span>
          </div>
          {filtered.length ? (
            filtered.map((item) => (
              <button
                key={item.index}
                className={`ecp-library-row ${selected === item.index ? 'selected' : ''}`}
                onClick={() => setSelected(item.index)}
              >
                <span className='ecp-list-icon'>
                  <FileText size={18} />
                </span>
                <span className='ecp-library-name'>
                  <strong>{item.name}</strong>
                  <small>
                    {item.course} · {item.criteria.length}{' '}
                    {t('criteria', '项标准')}
                  </small>
                </span>
                <Badge tone={item.visibility === 'class' ? 'blue' : 'neutral'}>
                  {item.visibility === 'class'
                    ? t('Class', '班级')
                    : t('Private', '私密')}
                </Badge>
                <ChevronRight size={17} />
              </button>
            ))
          ) : (
            <EmptyState
              title={t('No rubrics in this view', '此分类下暂无评分标准')}
              body={t(
                'Choose another filter or create a rubric.',
                '请选择其他筛选条件，或创建新的评分标准。'
              )}
            />
          )}
        </Panel>
        <Panel className='ecp-library-detail'>
          <div className='ecp-detail-top'>
            <Badge tone={active.visibility === 'class' ? 'blue' : 'neutral'}>
              {active.visibility === 'class'
                ? t('Shared with class', '班级共享')
                : t('Private', '私密')}
            </Badge>
            <span>{active.course}</span>
          </div>
          <h2>{active.name}</h2>
          <p>
            {t(
              'Students can inspect these criteria while planning a draft.',
              '学生可以在规划草稿时查看这些标准。'
            )}
          </p>
          <div className='ecp-criteria-list'>
            {active.criteria.map((item, index) => (
              <div key={index}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{item}</strong>
                <small>{Math.round(100 / active.criteria.length)}%</small>
              </div>
            ))}
          </div>
          <Action
            variant='secondary'
            onClick={() =>
              notify(
                t(
                  'Student preview opened for this rubric.',
                  '已切换到该标准的学生视图预览。'
                )
              )
            }
          >
            {t('Preview student view', '预览学生视图')}
          </Action>
        </Panel>
      </div>
      {creating && (
        <div className='ecp-modal-backdrop' onClick={() => setCreating(false)}>
          <div
            className='ecp-modal'
            role='dialog'
            aria-modal='true'
            aria-label={t('Create rubric', '创建评分标准')}
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
              {t('Rubric builder', '评分标准构建器')}
            </span>
            <h2>{t('Create a rubric', '创建评分标准')}</h2>
            <p>
              {t(
                'Start from a few criteria or preview an imported PDF.',
                '从几项标准开始，或预览导入 PDF 的流程。'
              )}
            </p>
            <div className='ecp-method-row'>
              <button
                className={method === 'manual' ? 'selected' : ''}
                onClick={() => setMethod('manual')}
              >
                <FilePlus2 size={20} />
                {t('Build manually', '手动创建')}
              </button>
              <button
                className={method === 'pdf' ? 'selected' : ''}
                onClick={() => setMethod('pdf')}
              >
                <UploadCloud size={20} />
                {t('Import PDF', '导入 PDF')}
              </button>
            </div>
            <form onSubmit={create}>
              <Field label={t('Rubric name', '标准名称')}>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('e.g. Research argument', '例如：研究型论证')}
                  required
                />
              </Field>
              {method === 'manual' ? (
                <div className='ecp-form-grid'>
                  <Field label={t('First criterion', '第一项标准')}>
                    <input
                      value={criterion}
                      onChange={(e) => setCriterion(e.target.value)}
                    />
                  </Field>
                  <Field label={t('Second criterion', '第二项标准')}>
                    <input
                      value={secondCriterion}
                      onChange={(e) => setSecondCriterion(e.target.value)}
                    />
                  </Field>
                </div>
              ) : (
                <Field
                  label={t('Rubric PDF', '评分标准 PDF')}
                  hint={t(
                    'The preview adds sample extracted criteria; no file is processed.',
                    '预览只会加入示例标准，不会处理文件。'
                  )}
                >
                  <input type='file' accept='.pdf,application/pdf' />
                </Field>
              )}
              {role !== 'student' && (
                <Field label={t('Visibility', '可见范围')}>
                  <select
                    value={visibility}
                    onChange={(e) =>
                      setVisibility(e.target.value as 'class' | 'private')
                    }
                  >
                    <option value='class'>
                      {t('Share with class', '班级共享')}
                    </option>
                    <option value='private'>{t('Private', '私密')}</option>
                  </select>
                </Field>
              )}
              {role === 'student' && (
                <Note>
                  <LockKeyhole size={15} />
                  {t(
                    'Student-created rubrics remain private.',
                    '学生创建的评分标准仅自己可见。'
                  )}
                </Note>
              )}
              <div className='ecp-modal-actions'>
                <Action
                  type='button'
                  variant='quiet'
                  onClick={() => setCreating(false)}
                >
                  {t('Cancel', '取消')}
                </Action>
                <Action type='submit'>
                  {t('Create preview rubric', '创建预览评分标准')}
                </Action>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function AssignmentsView() {
  const {
    role,
    language,
    go,
    taskTitle,
    setTaskTitle,
    taskPublished,
    setTaskPublished
  } = usePrototype();
  const t = useT();
  const [showEditor, setShowEditor] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [due, setDue] = useState('2026-10-02');
  const [description, setDescription] = useState(
    'Take a position on the use of AI feedback in education. Support your claims with evidence.'
  );
  const [saved, setSaved] = useState(false);
  const formattedDue = new Intl.DateTimeFormat(
    language === 'zh' ? 'zh-CN' : 'en-GB',
    { day: 'numeric', month: 'short' }
  ).format(new Date(`${due}T00:00:00`));
  const tasks = [
    {
      title: taskTitle,
      course: 'ENG 201',
      due: formattedDue,
      description: t(
        'Can AI feedback strengthen critical thinking? Take a position and use credible evidence.',
        'AI 反馈能促进批判性思维吗？选择立场，并用可信证据论证。'
      ),
      rubric: t('Argument & evidence', '论证与证据'),
      status: taskPublished ? 'open' : role === 'student' ? 'open' : 'draft',
      editable: true
    },
    {
      title: t(
        'Reading response: who gets heard?',
        '阅读回应：谁的声音被听见？'
      ),
      course: 'ENG 101',
      due: t('9 Oct', '10 月 9 日'),
      description: t(
        'Read the brief and prepare a thoughtful response for your class.',
        '阅读要求，为课堂准备有思考的回应。'
      ),
      rubric: t('Reflective writing', '反思写作'),
      status: 'open',
      editable: false
    },
    {
      title: t('Reflection on revision', '修改过程反思'),
      course: 'ENG 201',
      due: t('15 Sep', '9 月 15 日'),
      description: t(
        'Reflect on how your evidence and structure changed across drafts.',
        '回顾你的证据与结构如何在多次修改中发生变化。'
      ),
      rubric: t('Reflective writing', '反思写作'),
      status: 'closed',
      editable: false
    }
  ];
  const filtered = tasks.filter(
    (task) => filter === 'all' || task.status === filter
  );
  return (
    <>
      <PageHeading
        eyebrow={t('Coursework', '课程学习')}
        title={
          role === 'student'
            ? t('My assignments', '我的作业')
            : t('Assignments', '作业管理')
        }
        description={
          role === 'student'
            ? t(
                'Find the brief, plan your writing, and return before the deadline.',
                '查看要求、规划写作，并在截止前回来继续。'
              )
            : t(
                'Set a clear prompt and rubric for each class.',
                '为每个班级设置明确的题目和评分标准。'
              )
        }
        action={
          role !== 'student' &&
          role !== 'admin' && (
            <Action
              onClick={() => setShowEditor(true)}
              icon={<Plus size={17} />}
            >
              {t('New assignment', '新建作业')}
            </Action>
          )
        }
      />
      <div className='ecp-toolbar'>
        <div className='ecp-segmented'>
          {(
            [
              ['all', t('All', '全部')],
              ['open', t('Open', '进行中')],
              ['closed', t('Closed', '已结束')]
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              className={filter === key ? 'active' : ''}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className='ecp-muted'>
          {filtered.length} {t('assignments', '项作业')}
        </span>
      </div>
      <div className='ecp-assignment-list'>
        {filtered.length ? (
          filtered.map((task) => (
            <Panel
              key={`${task.course}-${task.title}`}
              className='ecp-assignment-card'
            >
              <div className='ecp-assignment-meta'>
                <Badge
                  tone={
                    task.status === 'closed'
                      ? 'neutral'
                      : task.status === 'draft'
                        ? 'amber'
                        : 'blue'
                  }
                >
                  {task.status === 'closed'
                    ? t('Closed', '已结束')
                    : task.status === 'draft'
                      ? t('Draft', '草稿')
                      : t('Open', '进行中')}
                </Badge>
                <span>{task.course}</span>
                <span>
                  <CalendarDays size={15} />
                  {t('Due', '截止')} {task.due}
                </span>
              </div>
              <h2>{task.title}</h2>
              <p>{task.description}</p>
              <div className='ecp-assignment-bottom'>
                <span>
                  {t('Rubric:', '评分标准：')} {task.rubric}
                </span>
                {role !== 'admin' && (role === 'student' || task.editable) && (
                  <Action
                    variant='secondary'
                    disabled={task.status === 'closed'}
                    onClick={() =>
                      role === 'student' ? go('practice') : setShowEditor(true)
                    }
                  >
                    {role === 'student'
                      ? task.status === 'closed'
                        ? t('Closed', '已结束')
                        : t('Start writing', '开始写作')
                      : t('Edit assignment', '编辑作业')}
                    <ArrowRight size={16} />
                  </Action>
                )}
              </div>
            </Panel>
          ))
        ) : (
          <EmptyState
            title={t('No assignments here', '这里没有作业')}
            body={t('Try another status filter.', '试试其他状态筛选。')}
          />
        )}
      </div>
      {showEditor && (
        <div
          className='ecp-modal-backdrop'
          onClick={() => setShowEditor(false)}
        >
          <div
            className='ecp-modal ecp-modal--wide'
            role='dialog'
            aria-modal='true'
            aria-label={t('Assignment editor', '作业编辑器')}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className='ecp-modal-close'
              onClick={() => setShowEditor(false)}
              aria-label={t('Close', '关闭')}
            >
              <X size={20} />
            </button>
            <span className='ecp-context'>
              {t('ENG 201 / Assignment', 'ENG 201 / 作业')}
            </span>
            <h2>{t('Assignment editor', '作业编辑器')}</h2>
            <p>
              {t(
                'A clear brief helps students spend more time writing.',
                '清晰的要求，让学生把时间花在写作上。'
              )}
            </p>
            <div className='ecp-form-stack'>
              <Field label={t('Title', '标题')}>
                <input
                  value={taskTitle}
                  onChange={(e) => {
                    setTaskTitle(e.target.value);
                    setSaved(false);
                  }}
                />
              </Field>
              <Field label={t('Instructions', '作业要求')}>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>
              <div className='ecp-form-grid'>
                <Field label={t('Class', '班级')}>
                  <select defaultValue='ENG 201'>
                    <option>ENG 201</option>
                    <option>ENG 101</option>
                  </select>
                </Field>
                <Field label={t('Rubric', '评分标准')}>
                  <select defaultValue='Argument & evidence'>
                    <option>Argument & evidence</option>
                    <option>Reflective writing</option>
                  </select>
                </Field>
              </div>
              <Field label={t('Deadline', '截止日期')}>
                <input
                  type='date'
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
              </Field>
            </div>
            {saved && (
              <Note>
                {t('Draft saved in this preview.', '草稿已在预览中保存。')}
              </Note>
            )}
            <div className='ecp-modal-actions'>
              <Action
                variant='quiet'
                onClick={() => {
                  setSaved(true);
                  setTaskPublished(false);
                }}
              >
                {t('Save draft', '保存草稿')}
              </Action>
              <Action
                onClick={() => {
                  if (taskTitle.trim()) {
                    setTaskPublished(true);
                    setShowEditor(false);
                  }
                }}
                disabled={!taskTitle.trim()}
              >
                {t('Publish in preview', '在预览中发布')}
              </Action>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ClassesView() {
  const { role, go } = usePrototype();
  const t = useT();
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<
    'overview' | 'tasks' | 'students' | 'announcements'
  >('overview');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invites, setInvites] = useState<Record<string, string[]>>({});
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [createError, setCreateError] = useState('');
  const [customClasses, setCustomClasses] = useState<
    {
      code: string;
      title: string;
      teacher: string;
      students: number;
      tasks: number;
    }[]
  >([]);
  const classes = [
    {
      code: 'ENG 201',
      title: t('Argument & Evidence', '论证与证据'),
      teacher: 'Dr. Lin',
      students: 25,
      tasks: 4
    },
    {
      code: 'ENG 101',
      title: t('Writing Foundations', '写作基础'),
      teacher: 'Prof. Chen',
      students: 22,
      tasks: 3
    },
    {
      code: 'HUM 330',
      title: t('Ideas in Public Life', '公共生活中的思想'),
      teacher: 'Dr. Lee',
      students: 18,
      tasks: 5
    },
    ...customClasses
  ];
  const current = classes.find((item) => item.code === selected);
  function invite(event: FormEvent) {
    event.preventDefault();
    if (!selected || !inviteEmail.includes('@')) return;
    setInvites((items) => ({
      ...items,
      [selected]: [...(items[selected] || []), inviteEmail]
    }));
    setInviteEmail('');
  }
  function createClass(event: FormEvent) {
    event.preventDefault();
    if (!newCode.trim() || !newTitle.trim()) return;
    const code = newCode.trim().toUpperCase();
    if (classes.some((item) => item.code === code)) {
      setCreateError(
        t('That class code already exists.', '此班级代码已存在。')
      );
      return;
    }
    const created = {
      code,
      title: newTitle.trim(),
      teacher: 'Dr. Lin',
      students: 0,
      tasks: 0
    };
    setCustomClasses((items) => [...items, created]);
    setNewCode('');
    setNewTitle('');
    setCreateError('');
    setCreating(false);
    setSelected(created.code);
  }
  if (current)
    return (
      <>
        <button className='ecp-back-link' onClick={() => setSelected(null)}>
          <ArrowLeft size={16} />
          {t('All classes', '所有班级')}
        </button>
        <PageHeading
          eyebrow={current.code}
          title={current.title}
          description={`${current.teacher} · ${current.students} ${t('students', '名学生')} · ${current.tasks} ${t('assignments', '项作业')}`}
          action={<Badge tone='green'>{t('Active class', '活跃班级')}</Badge>}
        />
        <div className='ecp-class-hero'>
          <div>
            <span>{t('This term', '本学期')}</span>
            <strong>
              {t(
                'Write with purpose. Revise with evidence.',
                '带着目标写作，用证据修改。'
              )}
            </strong>
          </div>
          <div>
            <span>{t('Next deadline', '下次截止')}</span>
            <strong>
              {current.tasks ? '2 Oct 2026' : t('Not set', '未设置')}
            </strong>
          </div>
        </div>
        <div className='ecp-tabs ecp-tabs--page'>
          {(
            [
              ['overview', t('Overview', '概览')],
              ['tasks', t('Assignments', '作业')],
              ['students', t('Students', '学生')],
              ['announcements', t('Announcements', '公告')]
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? 'active' : ''}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 'overview' && (
          <div className='ecp-two-col'>
            <Panel>
              <SectionHeading title={t('About this class', '班级介绍')} />
              <p>
                {t(
                  'Students practise clear argument, responsible evidence, and revision through feedback. Every formal grade is reviewed by the course lead.',
                  '学生通过反馈练习清晰论证、负责任地使用证据并反复修改。每份正式成绩都由课程负责人复核。'
                )}
              </p>
              <div className='ecp-class-detail-grid'>
                <span>
                  {t('Class code', '班级代码')}
                  <strong>{current.code}</strong>
                </span>
                <span>
                  {t('Course lead', '课程负责人')}
                  <strong>{current.teacher}</strong>
                </span>
              </div>
            </Panel>
            <Panel>
              <SectionHeading title={t('Coming up', '近期安排')} />
              {current.tasks ? (
                <>
                  <div className='ecp-list-row'>
                    <span className='ecp-list-icon'>
                      <FileText size={18} />
                    </span>
                    <span>
                      <strong>
                        {t(
                          'Argument essay: learning with AI',
                          '议论文：与 AI 一起学习'
                        )}
                      </strong>
                      <small>{t('Due 2 October', '10 月 2 日截止')}</small>
                    </span>
                  </div>
                  <TextLink onClick={() => go('assignments')}>
                    {t('View assignments', '查看作业')}
                  </TextLink>
                </>
              ) : (
                <EmptyState
                  title={t('No assignment yet', '尚无作业')}
                  body={t(
                    'Create an assignment to set the first deadline.',
                    '创建作业后即可设置第一次截止日期。'
                  )}
                />
              )}
            </Panel>
          </div>
        )}
        {tab === 'tasks' && (
          <Panel>
            <SectionHeading
              title={t('Assignments for this class', '本班作业')}
            />
            {current.tasks ? (
              <div className='ecp-list-row'>
                <span className='ecp-list-icon'>
                  <FileText size={18} />
                </span>
                <span>
                  <strong>
                    {t(
                      'Argument essay: learning with AI',
                      '议论文：与 AI 一起学习'
                    )}
                  </strong>
                  <small>
                    {t(
                      'Due 2 October · Argument & evidence rubric',
                      '10 月 2 日截止 · 论证与证据评分标准'
                    )}
                  </small>
                </span>
                <Action
                  variant='secondary'
                  onClick={() =>
                    go(role === 'student' ? 'practice' : 'assignments')
                  }
                >
                  {t('Open', '打开')}
                </Action>
              </div>
            ) : (
              <EmptyState
                title={t('No assignments yet', '尚无作业')}
                body={t(
                  'Create the first task from Assignments.',
                  '从作业页面创建第一项任务。'
                )}
                action={
                  <Action variant='secondary' onClick={() => go('assignments')}>
                    {t('Open assignments', '打开作业')}
                  </Action>
                }
              />
            )}
          </Panel>
        )}
        {tab === 'students' && (
          <Panel>
            <SectionHeading
              title={t('Students', '学生')}
              detail={
                role === 'student'
                  ? t('See classmates in your course.', '查看课程中的同学。')
                  : t(
                      'Invite students by school email.',
                      '通过学校邮箱邀请学生。'
                    )
              }
            />
            {current.students > 0 && (
              <>
                <div className='ecp-list-row'>
                  <span className='ecp-review-avatar'>AM</span>
                  <span>
                    <strong>Alex Morgan</strong>
                    <small>alex@northbridge.edu</small>
                  </span>
                  <Badge tone='green'>{t('Active', '活跃')}</Badge>
                </div>
                <div className='ecp-list-row'>
                  <span className='ecp-review-avatar violet'>LC</span>
                  <span>
                    <strong>Lin Chen</strong>
                    <small>lin@northbridge.edu</small>
                  </span>
                  <Badge tone='green'>{t('Active', '活跃')}</Badge>
                </div>
              </>
            )}
            {current.students === 0 &&
              !(invites[current.code] || []).length && (
                <EmptyState
                  title={t('No students yet', '尚无学生')}
                  body={t(
                    'Invite students with their school email.',
                    '使用学校邮箱邀请学生加入。'
                  )}
                />
              )}
            {(invites[current.code] || []).map((email) => (
              <div className='ecp-list-row' key={email}>
                <span className='ecp-review-avatar'>✦</span>
                <span>
                  <strong>{email}</strong>
                  <small>{t('Preview invitation', '预览邀请')}</small>
                </span>
                <Badge tone='amber'>{t('Pending', '待接受')}</Badge>
              </div>
            ))}
            {(role === 'lecturer' || role === 'course_lead') && (
              <form className='ecp-inline-form' onSubmit={invite}>
                <input
                  type='email'
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t('student@school.edu', 'student@school.edu')}
                  aria-label={t('Student email', '学生邮箱')}
                  required
                />
                <Action type='submit' icon={<Send size={16} />}>
                  {t('Invite student', '邀请学生')}
                </Action>
              </form>
            )}
          </Panel>
        )}
        {tab === 'announcements' && (
          <Panel>
            <SectionHeading title={t('Announcements', '公告')} />
            <div className='ecp-announcement'>
              <Badge tone='blue'>{t('Course update', '课程通知')}</Badge>
              <h3>
                {t(
                  'Bring one source to next week’s workshop',
                  '下周工作坊请带来一条资料来源'
                )}
              </h3>
              <p>
                {t(
                  'We will practise checking claims and giving useful feedback on a first draft.',
                  '我们将练习核对论断，并为初稿提供有用的反馈。'
                )}
              </p>
              <small>
                {t(
                  'Posted by Dr. Lin · 22 September',
                  '林老师发布 · 9 月 22 日'
                )}
              </small>
            </div>
          </Panel>
        )}
      </>
    );
  return (
    <>
      <PageHeading
        eyebrow={t('Learning together', '一起学习')}
        title={
          role === 'student'
            ? t('My classes', '我的班级')
            : t('Classes', '课程班级')
        }
        description={t(
          'Keep writing, people, and assignments connected.',
          '让写作、人员与作业始终相连。'
        )}
        action={
          role !== 'student' && (
            <Action onClick={() => setCreating(true)} icon={<Plus size={17} />}>
              {t('Create class', '创建班级')}
            </Action>
          )
        }
      />
      <div className='ecp-toolbar'>
        <label className='ecp-search'>
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Find a class', '搜索班级')}
          />
        </label>
        <MockLabel />
      </div>
      <div className='ecp-class-grid'>
        {classes
          .filter((item) =>
            `${item.code} ${item.title}`
              .toLowerCase()
              .includes(query.toLowerCase())
          )
          .map((item) => (
            <button
              className='ecp-class-card'
              key={item.code}
              onClick={() => {
                setSelected(item.code);
                setTab('overview');
              }}
            >
              <div>
                <Badge tone='blue'>{item.code}</Badge>
                <ChevronRight size={18} />
              </div>
              <h2>{item.title}</h2>
              <p>{item.teacher}</p>
              <div>
                <span>
                  <UsersRound size={16} />
                  {item.students} {t('students', '名学生')}
                </span>
                <span>
                  <FileText size={16} />
                  {item.tasks} {t('tasks', '项作业')}
                </span>
              </div>
            </button>
          ))}
      </div>
      {creating && (
        <div className='ecp-modal-backdrop' onClick={() => setCreating(false)}>
          <div
            className='ecp-modal ecp-modal--small'
            role='dialog'
            aria-modal='true'
            aria-label={t('Create class', '创建班级')}
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
              {t('Course workspace', '课程工作区')}
            </span>
            <h2>{t('Create a class', '创建班级')}</h2>
            <p>
              {t(
                'Students will join through your invitation after the class is set up.',
                '班级设置完成后，学生通过你的邀请加入。'
              )}
            </p>
            <form onSubmit={createClass}>
              <Field label={t('Class code', '班级代码')}>
                <input
                  value={newCode}
                  onChange={(e) => {
                    setNewCode(e.target.value);
                    setCreateError('');
                  }}
                  placeholder='ENG 301'
                  required
                />
              </Field>
              <Field label={t('Class name', '班级名称')}>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={t('Advanced writing', '进阶写作')}
                  required
                />
              </Field>
              {createError && (
                <div className='ecp-form-error' role='alert'>
                  {createError}
                </div>
              )}
              <div className='ecp-modal-actions'>
                <Action
                  variant='quiet'
                  type='button'
                  onClick={() => setCreating(false)}
                >
                  {t('Cancel', '取消')}
                </Action>
                <Action type='submit'>
                  {t('Create preview class', '创建预览班级')}
                </Action>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export function SocialView() {
  const { role, notify } = usePrototype();
  const t = useT();
  const [filter, setFilter] = useState<'all' | 'class' | 'saved'>('all');
  const [liked, setLiked] = useState<number[]>([]);
  const [saved, setSaved] = useState<number[]>([]);
  const [comments, setComments] = useState<Record<number, string[]>>({});
  const [draft, setDraft] = useState<Record<number, string>>({});
  const [reporting, setReporting] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareTitle, setShareTitle] = useState('');
  const [shareExcerpt, setShareExcerpt] = useState('');
  const [shareVisibility, setShareVisibility] = useState<'class' | 'anonymous'>(
    'class'
  );
  const [sharedPosts, setSharedPosts] = useState<
    {
      id: number;
      author: string;
      course: string;
      title: string;
      excerpt: string;
      tag: string;
      classOnly: boolean;
    }[]
  >([]);
  const posts = [
    {
      id: 1,
      author: 'Maya Patel',
      course: 'ENG 201',
      title: t('What changed in my second draft', '第二稿，我改了什么'),
      excerpt: t(
        'I moved my strongest evidence to the opening and the argument finally felt connected. The margin note asking “why does this matter?” helped the most.',
        '我把最有力的证据移到了开头，论证终于连贯起来。页边那句“这为什么重要？”对我最有帮助。'
      ),
      tag: t('Revision', '修改'),
      classOnly: true
    },
    {
      id: 2,
      author: t('Anonymous student', '匿名学生'),
      course: 'ENG 101',
      title: t('Learning to disagree fairly', '学习公正地提出异议'),
      excerpt: t(
        'This paragraph is still a work in progress. I would value feedback on whether my counterargument sounds fair.',
        '这段还在修改中。我想知道自己对反方观点的表述是否公正。'
      ),
      tag: t('Argument', '论证'),
      classOnly: false
    },
    ...sharedPosts
  ];
  const visible = posts.filter(
    (post) =>
      filter === 'all' ||
      (filter === 'class' && post.classOnly) ||
      (filter === 'saved' && saved.includes(post.id))
  );
  function addComment(event: FormEvent, id: number) {
    event.preventDefault();
    const text = draft[id]?.trim();
    if (!text) return;
    setComments((current) => ({
      ...current,
      [id]: [...(current[id] || []), text]
    }));
    setDraft((current) => ({ ...current, [id]: '' }));
  }
  function share(event: FormEvent) {
    event.preventDefault();
    if (!shareTitle.trim() || !shareExcerpt.trim()) return;
    setSharedPosts((items) => [
      ...items,
      {
        id: Date.now(),
        author:
          shareVisibility === 'anonymous'
            ? t('Anonymous student', '匿名学生')
            : 'Alex Morgan',
        course: 'ENG 201',
        title: shareTitle.trim(),
        excerpt: shareExcerpt.trim(),
        tag: t('Revision', '修改'),
        classOnly: shareVisibility === 'class'
      }
    ]);
    setShareTitle('');
    setShareExcerpt('');
    setSharing(false);
    setFilter('all');
    notify(t('Post shared in this preview.', '文章已在预览中分享。'));
  }
  return (
    <>
      <PageHeading
        eyebrow={t('Shared learning', '共同学习')}
        title={t('Learning hub', '学习社区')}
        description={t(
          'Read how classmates revised an idea, and offer feedback that moves it forward.',
          '看看同学如何修改想法，也给出能帮助对方继续前进的反馈。'
        )}
        action={
          <div className='ecp-heading-actions'>
            <MockLabel />
            {role === 'student' && (
              <Action
                onClick={() => setSharing(true)}
                icon={<Plus size={17} />}
              >
                {t('Share a draft', '分享草稿')}
              </Action>
            )}
          </div>
        }
      />
      <div className='ecp-social-layout'>
        <div>
          <div className='ecp-toolbar'>
            <div className='ecp-segmented'>
              {(
                [
                  ['all', t('All posts', '全部内容')],
                  ['class', t('My class', '我的班级')],
                  ['saved', t('Saved', '已收藏')]
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  className={filter === key ? 'active' : ''}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {visible.length ? (
            visible.map((post) => (
              <Panel className='ecp-post' key={post.id}>
                <div className='ecp-post-author'>
                  <span className='ecp-review-avatar'>
                    {post.author === 'Maya Patel' ? 'MP' : 'A'}
                  </span>
                  <span>
                    <strong>{post.author}</strong>
                    <small>
                      {post.course} · {t('Yesterday', '昨天')}
                    </small>
                  </span>
                  <Badge tone={post.classOnly ? 'blue' : 'neutral'}>
                    {post.classOnly
                      ? t('Class only', '仅班级')
                      : t('Anonymous', '匿名')}
                  </Badge>
                </div>
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
                <span className='ecp-post-tag'>#{post.tag}</span>
                <div className='ecp-post-actions'>
                  <button
                    className={liked.includes(post.id) ? 'active' : ''}
                    onClick={() =>
                      setLiked((items) =>
                        items.includes(post.id)
                          ? items.filter((id) => id !== post.id)
                          : [...items, post.id]
                      )
                    }
                    aria-label={
                      liked.includes(post.id)
                        ? t('Unlike post', '取消点赞')
                        : t('Like post', '点赞')
                    }
                    aria-pressed={liked.includes(post.id)}
                  >
                    <Heart
                      size={18}
                      fill={liked.includes(post.id) ? 'currentColor' : 'none'}
                    />
                    {(post.id === 1 ? 12 : 7) +
                      (liked.includes(post.id) ? 1 : 0)}
                  </button>
                  <button
                    className={saved.includes(post.id) ? 'active' : ''}
                    onClick={() =>
                      setSaved((items) =>
                        items.includes(post.id)
                          ? items.filter((id) => id !== post.id)
                          : [...items, post.id]
                      )
                    }
                    aria-pressed={saved.includes(post.id)}
                  >
                    <Bookmark
                      size={18}
                      fill={saved.includes(post.id) ? 'currentColor' : 'none'}
                    />
                    {saved.includes(post.id)
                      ? t('Saved', '已收藏')
                      : t('Save', '收藏')}
                  </button>
                  <button
                    onClick={() =>
                      document.getElementById(`ecp-comment-${post.id}`)?.focus()
                    }
                  >
                    <MessageCircle size={18} />
                    {(comments[post.id] || []).length} {t('comments', '条评论')}
                  </button>
                  <button onClick={() => setReporting(post.id)}>
                    <Flag size={17} />
                    {t('Report', '举报')}
                  </button>
                </div>
                {(comments[post.id] || []).map((comment, index) => (
                  <div className='ecp-comment' key={index}>
                    <strong>{t('You', '你')}</strong>
                    <p>{comment}</p>
                  </div>
                ))}
                <form
                  className='ecp-comment-form'
                  onSubmit={(e) => addComment(e, post.id)}
                >
                  <input
                    id={`ecp-comment-${post.id}`}
                    value={draft[post.id] || ''}
                    onChange={(e) =>
                      setDraft((current) => ({
                        ...current,
                        [post.id]: e.target.value
                      }))
                    }
                    placeholder={t(
                      'Leave constructive feedback…',
                      '写下有建设性的反馈……'
                    )}
                    aria-label={t('Write comment', '写评论')}
                  />
                  <button
                    type='submit'
                    aria-label={t('Post comment', '发表评论')}
                  >
                    <Send size={17} />
                  </button>
                </form>
              </Panel>
            ))
          ) : (
            <EmptyState
              title={t('No saved posts yet', '还没有收藏的内容')}
              body={t(
                'Bookmark a post to return to it later.',
                '收藏一篇文章，稍后就能在这里找到。'
              )}
              action={
                <Action variant='secondary' onClick={() => setFilter('all')}>
                  {t('Browse posts', '浏览内容')}
                </Action>
              }
            />
          )}
        </div>
        <aside className='ecp-social-rail'>
          <Panel>
            <SectionHeading
              title={t(
                'A useful comment does three things',
                '有用的评论可以这样写'
              )}
            />
            <ol>
              <li>{t('Name a specific passage.', '指出具体段落。')}</li>
              <li>
                {t('Explain what you understood.', '说说你理解到的意思。')}
              </li>
              <li>
                {t(
                  'Ask one question that helps revision.',
                  '提出一个有助于修改的问题。'
                )}
              </li>
            </ol>
          </Panel>
          <Panel>
            <SectionHeading title={t('Your class', '你的班级')} />
            <div className='ecp-list-row'>
              <span className='ecp-list-icon'>
                <GraduationCap size={18} />
              </span>
              <span>
                <strong>ENG 201</strong>
                <small>{t('Argument & Evidence', '论证与证据')}</small>
              </span>
            </div>
            {role === 'lecturer' && (
              <Note>
                {t(
                  'Course leads can moderate class posts in the full product.',
                  '正式产品中，课程负责人可管理班级内容。'
                )}
              </Note>
            )}
          </Panel>
        </aside>
      </div>
      {sharing && (
        <div className='ecp-modal-backdrop' onClick={() => setSharing(false)}>
          <div
            className='ecp-modal ecp-modal--small'
            role='dialog'
            aria-modal='true'
            aria-label={t('Share a draft', '分享草稿')}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className='ecp-modal-close'
              onClick={() => setSharing(false)}
              aria-label={t('Close', '关闭')}
            >
              <X size={20} />
            </button>
            <span className='ecp-context'>{t('Learning hub', '学习社区')}</span>
            <h2>{t('Share a draft', '分享草稿')}</h2>
            <p>
              {t(
                'Invite classmates to discuss one idea you are developing.',
                '邀请同学讨论你正在打磨的一个想法。'
              )}
            </p>
            <form onSubmit={share}>
              <Field label={t('Title', '标题')}>
                <input
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  required
                />
              </Field>
              <Field label={t('Excerpt or question', '片段或问题')}>
                <textarea
                  rows={4}
                  value={shareExcerpt}
                  onChange={(e) => setShareExcerpt(e.target.value)}
                  required
                />
              </Field>
              <Field label={t('Visibility', '可见范围')}>
                <select
                  value={shareVisibility}
                  onChange={(e) =>
                    setShareVisibility(e.target.value as 'class' | 'anonymous')
                  }
                >
                  <option value='class'>{t('My class', '我的班级')}</option>
                  <option value='anonymous'>
                    {t('Anonymous to peers', '对同学匿名')}
                  </option>
                </select>
              </Field>
              <div className='ecp-modal-actions'>
                <Action
                  variant='quiet'
                  type='button'
                  onClick={() => setSharing(false)}
                >
                  {t('Cancel', '取消')}
                </Action>
                <Action type='submit'>
                  {t('Share in preview', '在预览中分享')}
                </Action>
              </div>
            </form>
          </div>
        </div>
      )}
      {reporting !== null && (
        <div className='ecp-modal-backdrop' onClick={() => setReporting(null)}>
          <div
            className='ecp-modal ecp-modal--small'
            role='dialog'
            aria-modal='true'
            aria-label={t('Report post', '举报内容')}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className='ecp-modal-close'
              onClick={() => setReporting(null)}
              aria-label={t('Close', '关闭')}
            >
              <X size={20} />
            </button>
            <h2>{t('Report this post', '举报这篇内容')}</h2>
            <p>
              {t(
                'Choose a reason. This is a local preview and sends no report.',
                '选择原因。此操作仅用于本地预览，不会发送举报。'
              )}
            </p>
            <Field label={t('Reason', '原因')}>
              <select>
                <option>{t('Inappropriate content', '不当内容')}</option>
                <option>
                  {t('Academic integrity concern', '学术诚信问题')}
                </option>
                <option>{t('Other', '其他')}</option>
              </select>
            </Field>
            <div className='ecp-modal-actions'>
              <Action variant='quiet' onClick={() => setReporting(null)}>
                {t('Cancel', '取消')}
              </Action>
              <Action
                onClick={() => {
                  setReporting(null);
                  notify(
                    t('Report noted in this preview.', '举报已在预览中记录。')
                  );
                }}
              >
                {t('Submit preview report', '提交预览举报')}
              </Action>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
