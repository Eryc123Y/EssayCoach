'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowRight, Info } from 'lucide-react';
import { useT } from './prototype-context';

type ActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  icon?: ReactNode;
};

export function Action({
  variant = 'primary',
  icon,
  className = '',
  children,
  ...props
}: ActionProps) {
  return (
    <button
      className={`ecp-action ecp-action--${variant} ${className}`}
      {...props}
    >
      {children}
      {icon}
    </button>
  );
}

export function Badge({
  children,
  tone = 'neutral'
}: {
  children: ReactNode;
  tone?: 'neutral' | 'blue' | 'green' | 'amber' | 'red';
}) {
  return <span className={`ecp-badge ecp-badge--${tone}`}>{children}</span>;
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className='ecp-page-heading'>
      <div>
        {eyebrow && <span className='ecp-context'>{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className='ecp-page-action'>{action}</div>}
    </div>
  );
}

export function Panel({
  children,
  className = ''
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`ecp-panel ${className}`}>{children}</section>;
}

export function SectionHeading({
  title,
  detail,
  action
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className='ecp-section-heading'>
      <div>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  children,
  hint
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className='ecp-field'>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className='ecp-note'>
      <Info size={16} aria-hidden='true' />
      <span>{children}</span>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className='ecp-empty'>
      <div className='ecp-empty-mark'>✦</div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

export function MockLabel() {
  const t = useT();
  return (
    <span className='ecp-mock-label'>{t('Preview data', '演示数据')}</span>
  );
}

export function TextLink({
  children,
  onClick
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className='ecp-text-link' onClick={onClick}>
      {children}
      <ArrowRight size={15} aria-hidden='true' />
    </button>
  );
}
