'use client';

import { type ElementType, type ReactNode } from 'react';
import { Badge, Group, Title } from '@mantine/core';
import { PiCheckCircle, PiCircleDashed, PiDotOutline } from 'react-icons/pi';

/* ─── Stat Card ────────────────────────────────────────────────────────── */

export type StatCardProps = {
  icon: ElementType;
  value: string | number;
  label: string;
  helper?: string;
  color?: string;
};

export function StatCard({ icon: Icon, value, label, helper, color = '#2563EB' }: StatCardProps) {
  return (
    <div className="ds-stat-card">
      <div className="ds-stat-icon" style={{ background: `${color}10`, color }}>
        <Icon size={22} />
      </div>
      <div className="ds-stat-body">
        <span className="ds-stat-value">{value}</span>
        <span className="ds-stat-label">{label}</span>
        {helper && <span className="ds-stat-helper">{helper}</span>}
      </div>
    </div>
  );
}

/* ─── Stat Card Grid ───────────────────────────────────────────────────── */

export function StatCardGrid({ children }: { children: ReactNode }) {
  return <div className="ds-stat-grid">{children}</div>;
}

/* ─── Dashboard Card ───────────────────────────────────────────────────── */

export type DashboardCardProps = {
  children: ReactNode;
  className?: string;
  span?: boolean;
};

export function DashboardCard({ children, className, span }: DashboardCardProps) {
  return (
    <div className={`ds-card ${span ? 'ds-card-span' : ''} ${className ?? ''}`}>
      {children}
    </div>
  );
}

/* ─── Card Header ──────────────────────────────────────────────────────── */

export type CardHeaderProps = {
  title: string;
  icon?: ElementType;
  badge?: ReactNode;
  action?: ReactNode;
};

export function CardHeader({ title, icon: Icon, badge, action }: CardHeaderProps) {
  return (
    <div className="ds-card-header">
      <Group gap={10} align="center">
        {Icon && <Icon size={20} style={{ color: '#64748B' }} />}
        <Title order={3} className="ds-card-title">
          {title}
        </Title>
        {badge}
      </Group>
      {action && <div className="ds-card-action">{action}</div>}
    </div>
  );
}

/* ─── Service Progress Stepper ─────────────────────────────────────────── */

export type StepStatus = 'done' | 'current' | 'upcoming';

export type StepItem = {
  label: string;
  status: StepStatus;
  sublabel?: string;
};

export function ServiceStepper({ steps }: { steps: StepItem[] }) {
  return (
    <div className="ds-stepper">
      {steps.map((step, i) => (
        <div className={`ds-step ds-step-${step.status}`} key={step.label}>
          <div className="ds-step-indicator">
            {step.status === 'done' ? (
              <PiCheckCircle size={20} />
            ) : step.status === 'current' ? (
              <PiDotOutline size={20} />
            ) : (
              <PiCircleDashed size={20} />
            )}
            {i < steps.length - 1 && <div className="ds-step-line" />}
          </div>
          <div className="ds-step-content">
            <span className="ds-step-label">{step.label}</span>
            {step.sublabel && <span className="ds-step-sublabel">{step.sublabel}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Alert Banner ─────────────────────────────────────────────────────── */

export type AlertBannerProps = {
  icon: ElementType;
  title: string;
  description: string;
  action?: ReactNode;
  variant?: 'info' | 'warning' | 'success' | 'neutral';
};

export function AlertBanner({
  icon: Icon,
  title,
  description,
  action,
  variant = 'neutral',
}: AlertBannerProps) {
  return (
    <div className={`ds-alert ds-alert-${variant}`}>
      <div className="ds-alert-icon">
        <Icon size={20} />
      </div>
      <div className="ds-alert-body">
        <span className="ds-alert-title">{title}</span>
        <span className="ds-alert-desc">{description}</span>
      </div>
      {action && <div className="ds-alert-action">{action}</div>}
    </div>
  );
}

/* ─── Invoice Row ──────────────────────────────────────────────────────── */

export type InvoiceRowProps = {
  id: string;
  description: string;
  date?: string;
  amount: string;
  status: 'issued' | 'paid' | 'pending' | 'overdue';
  action?: ReactNode;
};

const invoiceStatusColor: Record<InvoiceRowProps['status'], string> = {
  issued: 'blue',
  paid: 'green',
  pending: 'orange',
  overdue: 'red',
};

export function InvoiceRow({ id, description, date, amount, status, action }: InvoiceRowProps) {
  return (
    <div className="ds-invoice-row">
      <div className="ds-invoice-info">
        <span className="ds-invoice-id">{id}</span>
        <span className="ds-invoice-desc">{description}</span>
        {date && <span className="ds-invoice-date">{date}</span>}
      </div>
      <div className="ds-invoice-right">
        <span className="ds-invoice-amount">{amount}</span>
        <Badge color={invoiceStatusColor[status]} size="sm" variant="light">
          {status}
        </Badge>
        {action}
      </div>
    </div>
  );
}

/* ─── Context Card (bottom summary) ────────────────────────────────────── */

export type ContextCardProps = {
  icon: ElementType;
  label: string;
  value: string;
  helper?: string;
  color?: string;
};

export function ContextCard({ icon: Icon, label, value, helper, color = '#64748B' }: ContextCardProps) {
  return (
    <div className="ds-context-card">
      <div className="ds-context-icon" style={{ background: `${color}12`, color }}>
        <Icon size={20} />
      </div>
      <div className="ds-context-body">
        <span className="ds-context-label">{label}</span>
        <span className="ds-context-value">{value}</span>
        {helper && <span className="ds-context-helper">{helper}</span>}
      </div>
    </div>
  );
}

/* ─── Context Card Grid ────────────────────────────────────────────────── */

export function ContextCardGrid({ children }: { children: ReactNode }) {
  return <div className="ds-context-grid">{children}</div>;
}

/* ─── Two Column Layout ────────────────────────────────────────────────── */

export function TwoColumnLayout({ children }: { children: ReactNode }) {
  return <div className="ds-two-col">{children}</div>;
}

/* ─── KPI Tile (Admin) ─────────────────────────────────────────────────── */

export type KpiTileProps = {
  label: string;
  value: string;
  helper?: string;
  icon?: ElementType;
  accentColor?: string;
};

export function KpiTile({ label, value, helper, icon: Icon, accentColor = '#2563EB' }: KpiTileProps) {
  return (
    <div className="ds-kpi-tile">
      <div className="ds-kpi-top">
        {Icon && (
          <div className="ds-kpi-icon" style={{ background: `${accentColor}10`, color: accentColor }}>
            <Icon size={18} />
          </div>
        )}
        <span className="ds-kpi-label">{label}</span>
      </div>
      <span className="ds-kpi-value">{value}</span>
      {helper && <span className="ds-kpi-helper">{helper}</span>}
    </div>
  );
}

/* ─── Empty State ──────────────────────────────────────────────────────── */

export type EmptyStateProps = {
  icon: ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="ds-empty">
      <div className="ds-empty-icon">
        <Icon size={32} />
      </div>
      <span className="ds-empty-title">{title}</span>
      {description && <span className="ds-empty-desc">{description}</span>}
      {action}
    </div>
  );
}
