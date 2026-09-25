'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Compass,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageCircle,
  PenLine,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X
} from 'lucide-react';
import {
  PrototypeContext,
  type Language,
  type Role,
  type View,
  views
} from './prototype-context';
import { renderPrototypeView } from './prototype-views';

const sampleEssay = `The spaces where students learn to write are changing. A useful writing tool should offer specific feedback while leaving the final judgment with the teacher. In a classroom, this means students can revise early drafts with confidence and instructors can spend more time discussing ideas.\n\nHowever, a score alone rarely explains how an argument can improve. Students need to see where a claim lacks evidence, how a paragraph connects to the thesis, and what a stronger revision might look like. Feedback that points to exact passages turns assessment into a conversation.`;

type NavItem = {
  view: View;
  en: string;
  zh: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
};
const navItems: NavItem[] = [
  { view: 'dashboard', en: 'Overview', zh: '总览', icon: LayoutDashboard },
  {
    view: 'practice',
    en: 'Writing studio',
    zh: '写作空间',
    icon: PenLine,
    roles: ['student']
  },
  {
    view: 'feedback',
    en: 'My feedback',
    zh: '我的反馈',
    icon: FileCheck2,
    roles: ['student']
  },
  {
    view: 'review',
    en: 'Review queue',
    zh: '复核队列',
    icon: ShieldCheck,
    roles: ['lecturer', 'course_lead']
  },
  { view: 'assignments', en: 'Assignments', zh: '作业', icon: ClipboardList },
  { view: 'classes', en: 'Classes', zh: '课程班级', icon: GraduationCap },
  { view: 'rubrics', en: 'Rubrics', zh: '评分标准', icon: BookOpen },
  {
    view: 'social',
    en: 'Learning hub',
    zh: '学习社区',
    icon: MessageCircle,
    roles: ['student', 'lecturer', 'course_lead']
  },
  { view: 'analytics', en: 'Analytics', zh: '数据分析', icon: BarChart3 },
  {
    view: 'users',
    en: 'People',
    zh: '人员管理',
    icon: UsersRound,
    roles: ['admin']
  },
  { view: 'profile', en: 'Profile', zh: '个人资料', icon: UserRound },
  { view: 'settings', en: 'Settings', zh: '设置', icon: Settings2 },
  { view: 'help', en: 'Help', zh: '帮助', icon: CircleHelp }
];

const publicViews: View[] = ['landing', 'signin', 'invite'];

export default function PrototypeApp() {
  const [language, setLanguage] = useState<Language>('en');
  const [roleState, setRoleState] = useState<Role>('student');
  const [view, setView] = useState<View>('landing');
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [essay, setEssay] = useState(sampleEssay);
  const [goal, setGoal] = useState('argument');
  const [rubric, setRubric] = useState('Argument & evidence');
  const [feedbackReady, setFeedbackReady] = useState(false);
  const [reviewScore, setReviewScore] = useState(78);
  const [reviewComment, setReviewComment] = useState(
    'Strong central idea. Ask for a source supporting the second paragraph before release.'
  );
  const [lecturerReviewed, setLecturerReviewed] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [gradePublished, setGradePublished] = useState(false);
  const [taskTitle, setTaskTitle] = useState(
    'Argument essay: learning with AI'
  );
  const [taskPublished, setTaskPublished] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<string[]>([]);

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem(
      'essaycoach-prototype-language'
    );
    const savedRole = window.localStorage.getItem('essaycoach-prototype-role');
    if (savedLanguage === 'en' || savedLanguage === 'zh')
      setLanguage(savedLanguage);
    if (
      savedRole === 'student' ||
      savedRole === 'lecturer' ||
      savedRole === 'course_lead' ||
      savedRole === 'admin'
    )
      setRoleState(savedRole);
    const syncHash = () => {
      const requested = window.location.hash.replace('#', '') as View;
      setView(views.includes(requested) ? requested : 'landing');
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  useEffect(() => {
    window.localStorage.setItem('essaycoach-prototype-language', language);
  }, [language]);
  useEffect(() => {
    window.localStorage.setItem('essaycoach-prototype-role', roleState);
  }, [roleState]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const go = useCallback((next: View) => {
    setView(next);
    setMenuOpen(false);
    window.location.hash = next;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const setRole = useCallback(
    (next: Role) => {
      setRoleState(next);
      go('dashboard');
    },
    [go]
  );

  const notify = useCallback((message: string) => setToast(message), []);
  const state = useMemo(
    () => ({
      language,
      setLanguage,
      role: roleState,
      setRole,
      view,
      go,
      notify,
      essay,
      setEssay,
      goal,
      setGoal,
      rubric,
      setRubric,
      feedbackReady,
      setFeedbackReady,
      reviewScore,
      setReviewScore,
      reviewComment,
      setReviewComment,
      lecturerReviewed,
      setLecturerReviewed,
      reviewed,
      setReviewed,
      gradePublished,
      setGradePublished,
      taskTitle,
      setTaskTitle,
      taskPublished,
      setTaskPublished,
      invitedUsers,
      setInvitedUsers
    }),
    [
      language,
      roleState,
      setRole,
      view,
      go,
      notify,
      essay,
      goal,
      rubric,
      feedbackReady,
      reviewScore,
      reviewComment,
      lecturerReviewed,
      reviewed,
      gradePublished,
      taskTitle,
      taskPublished,
      invitedUsers
    ]
  );

  const isPublic = publicViews.includes(view);
  const t = (en: string, zh: string) => (language === 'zh' ? zh : en);
  const visibleNav = navItems.filter(
    (item) => !item.roles || item.roles.includes(roleState)
  );

  return (
    <PrototypeContext.Provider value={state}>
      <div className='ecp-root' lang={language === 'zh' ? 'zh-CN' : 'en'}>
        <div className='ecp-preview-bar'>
          <span className='ecp-preview-dot' />
          {t(
            'Interactive design preview · sample data only',
            '交互设计预览 · 仅使用演示数据'
          )}
          <button onClick={() => go('landing')}>
            {t('About this preview', '了解此预览')}
          </button>
        </div>

        {isPublic ? (
          <header className='ecp-public-header'>
            <button
              className='ecp-brand'
              onClick={() => go('landing')}
              aria-label='EssayCoach home'
            >
              <span className='ecp-brand-mark'>
                <PenLine size={21} strokeWidth={2.2} />
              </span>
              <span>
                essaycoach<span className='ecp-brand-period'>.</span>
              </span>
            </button>
            <nav
              className='ecp-public-nav'
              aria-label={t('Public navigation', '公共导航')}
            >
              <button onClick={() => go('landing')}>
                {t('Why EssayCoach', '产品介绍')}
              </button>
              <button onClick={() => go('invite')}>
                {t('Accept invitation', '接受邀请')}
              </button>
              <button onClick={() => go('help')}>{t('Help', '帮助')}</button>
            </nav>
            <div className='ecp-header-actions'>
              <button
                className='ecp-language'
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                aria-label={t('Switch to Chinese', '切换为英语')}
              >
                {language === 'en' ? '中' : 'EN'}
              </button>
              <button className='ecp-public-login' onClick={() => go('signin')}>
                {t('Sign in', '登录')}
              </button>
            </div>
          </header>
        ) : (
          <div className='ecp-workspace'>
            <aside
              className={`ecp-sidebar ${menuOpen ? 'ecp-sidebar--open' : ''}`}
            >
              <div className='ecp-sidebar-head'>
                <button
                  className='ecp-brand'
                  onClick={() => go('dashboard')}
                  aria-label='EssayCoach dashboard'
                >
                  <span className='ecp-brand-mark'>
                    <PenLine size={20} strokeWidth={2.2} />
                  </span>
                  <span>
                    essaycoach<span className='ecp-brand-period'>.</span>
                  </span>
                </button>
                <button
                  className='ecp-mobile-close'
                  onClick={() => setMenuOpen(false)}
                  aria-label={t('Close menu', '关闭菜单')}
                >
                  <X size={20} />
                </button>
              </div>
              <div className='ecp-institution'>
                <span className='ecp-institution-icon'>
                  <GraduationCap size={18} />
                </span>
                <span>
                  <strong>Northbridge Academy</strong>
                  <small>{t('Institution workspace', '机构工作区')}</small>
                </span>
                <ChevronDown size={14} />
              </div>
              <div className='ecp-nav-label'>{t('Workspace', '工作空间')}</div>
              <nav
                className='ecp-sidebar-nav'
                aria-label={t('Workspace navigation', '工作区导航')}
              >
                {visibleNav.map((item) => (
                  <a
                    key={item.view}
                    href={`#${item.view}`}
                    className={
                      view === item.view
                        ? 'ecp-nav-item ecp-nav-item--active'
                        : 'ecp-nav-item'
                    }
                    onClick={() => {
                      setView(item.view);
                      setMenuOpen(false);
                    }}
                  >
                    <item.icon size={18} strokeWidth={1.9} />
                    <span>{t(item.en, item.zh)}</span>
                    {item.view === 'review' && !gradePublished && (
                      <span className='ecp-nav-count'>3</span>
                    )}
                  </a>
                ))}
              </nav>
              <div className='ecp-sidebar-bottom'>
                <div className='ecp-sidebar-tip'>
                  <Sparkles size={18} />
                  <strong>
                    {t('Write, review, grow.', '写作、复核、成长。')}
                  </strong>
                  <p>
                    {t(
                      'Feedback is a starting point for better writing.',
                      '反馈是写得更好的起点。'
                    )}
                  </p>
                </div>
                <button
                  className='ecp-sidebar-home'
                  onClick={() => go('landing')}
                >
                  <Compass size={17} />
                  {t('View public site', '查看网站首页')}
                </button>
              </div>
            </aside>
            {menuOpen && (
              <button
                className='ecp-backdrop'
                onClick={() => setMenuOpen(false)}
                aria-label={t('Close menu', '关闭菜单')}
              />
            )}
            <div className='ecp-workspace-main'>
              <header className='ecp-workspace-header'>
                <button
                  className='ecp-menu-button'
                  onClick={() => setMenuOpen(true)}
                  aria-label={t('Open menu', '打开菜单')}
                >
                  <Menu size={22} />
                </button>
                <div className='ecp-header-location'>
                  <span>{t('Northbridge Academy', 'Northbridge 学院')}</span>
                  <span className='ecp-breadcrumb-separator'>/</span>
                  <strong>
                    {t(
                      navItems.find((n) => n.view === view)?.en || 'Workspace',
                      navItems.find((n) => n.view === view)?.zh || '工作空间'
                    )}
                  </strong>
                </div>
                <div className='ecp-header-controls'>
                  <button
                    className='ecp-icon-button'
                    onClick={() =>
                      notify(
                        t(
                          'No new notifications in this preview.',
                          '此预览暂无新通知。'
                        )
                      )
                    }
                    aria-label={t('Notifications', '通知')}
                  >
                    <Bell size={19} />
                    <i />
                  </button>
                  <button
                    className='ecp-language'
                    onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                    aria-label={t('Switch to Chinese', '切换为英语')}
                  >
                    {language === 'en' ? '中' : 'EN'}
                  </button>
                  <label className='ecp-role-switch'>
                    <span className='ecp-role-avatar'>
                      {roleState === 'student'
                        ? 'S'
                        : roleState === 'lecturer'
                          ? 'T'
                          : roleState === 'course_lead'
                            ? 'L'
                            : 'A'}
                    </span>
                    <select
                      value={roleState}
                      onChange={(event) => setRole(event.target.value as Role)}
                      aria-label={t('Preview role', '预览角色')}
                    >
                      <option value='student'>{t('Student', '学生')}</option>
                      <option value='lecturer'>{t('Lecturer', '讲师')}</option>
                      <option value='course_lead'>
                        {t('Course lead', '课程负责人')}
                      </option>
                      <option value='admin'>{t('Admin', '管理员')}</option>
                    </select>
                    <ChevronDown size={14} />
                  </label>
                </div>
              </header>
              <main className='ecp-main'>
                {renderPrototypeView(view, roleState)}
              </main>
              <div className='ecp-mobile-nav'>
                <button
                  onClick={() => go('dashboard')}
                  className={view === 'dashboard' ? 'active' : ''}
                >
                  <LayoutDashboard size={19} />
                  {t('Home', '首页')}
                </button>
                <button
                  onClick={() =>
                    go(
                      roleState === 'student'
                        ? 'practice'
                        : roleState === 'admin'
                          ? 'users'
                          : 'review'
                    )
                  }
                >
                  <PenLine size={19} />
                  {roleState === 'student'
                    ? t('Write', '写作')
                    : roleState === 'admin'
                      ? t('People', '人员')
                      : t('Review', '复核')}
                </button>
                <button onClick={() => setMenuOpen(true)}>
                  <Menu size={19} />
                  {t('More', '更多')}
                </button>
              </div>
            </div>
          </div>
        )}
        {isPublic && (
          <main className='ecp-public-main'>
            {renderPrototypeView(view, roleState)}
          </main>
        )}
        {toast && (
          <div className='ecp-toast' role='status'>
            <span>{toast}</span>
            <button
              onClick={() => setToast('')}
              aria-label={t('Dismiss', '关闭')}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </PrototypeContext.Provider>
  );
}
