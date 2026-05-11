'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ActionIcon, Button, Group, Kbd, Stack, Text, TextInput, Title } from '@mantine/core';
import {
  PiBell,
  PiCalendarCheck,
  PiCarProfile,
  PiChartLine,
  PiGear,
  PiHouse,
  PiMagnifyingGlass,
  PiQuestion,
  PiUserCircle,
  PiUsersThree,
  PiWrench,
} from 'react-icons/pi';

type RoleKey = 'admin' | 'front-desk' | 'mechanic' | 'customer';

type ShellStat = {
  label: string;
  value: string;
};

type DashboardShellProps = {
  role: string;
  active: RoleKey;
  title: string;
  subtitle: string;
  dateLabel: string;
  stats?: ShellStat[];
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  children: ReactNode;
};

const navItems = [
  { key: 'admin', label: 'Admin', href: '/admin', icon: PiChartLine },
  { key: 'front-desk', label: 'Front desk', href: '/front-desk', icon: PiUsersThree },
  { key: 'mechanic', label: 'Mechanic', href: '/mechanic', icon: PiWrench },
  { key: 'customer', label: 'Customer', href: '/customer', icon: PiUserCircle },
] as const;

const workAreas = [
  { label: 'Today queue', color: '#3857A3' },
  { label: 'Awaiting approval', color: '#F59E0B' },
  { label: 'Ready for collection', color: '#16A34A' },
];

export function DashboardShell({
  role,
  active,
  title,
  subtitle,
  dateLabel,
  stats = [],
  primaryAction,
  secondaryAction,
  children,
}: DashboardShellProps) {
  return (
    <main className="garage-shell">
      <aside className="garage-sidebar" aria-label="GarageOS navigation">
        <Link className="garage-brand" href="/admin">
          GarageOS
        </Link>

        <nav className="garage-nav" aria-label="Role dashboards">
          <Link className="garage-nav-item" href="/admin">
            <PiHouse size={20} />
            Dashboard
          </Link>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className={`garage-nav-item ${item.key === active ? 'is-active' : ''}`}
                href={item.href}
                key={item.key}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="garage-sidebar-section">
          <Group justify="space-between">
            <Text fw={750}>Work areas</Text>
            <ActionIcon variant="subtle" aria-label="Add work area">
              <PiCalendarCheck size={18} />
            </ActionIcon>
          </Group>
          <Stack gap={14}>
            {workAreas.map((area) => (
              <span className="garage-area" key={area.label}>
                <i style={{ background: area.color }} />
                {area.label}
              </span>
            ))}
          </Stack>
        </div>

        <div className="garage-sidebar-footer">
          <Link className="garage-nav-item" href="/admin">
            <PiGear size={20} />
            Settings
          </Link>
          <Link className="garage-nav-item" href="/customer">
            <PiQuestion size={20} />
            Help & support
            <b>8</b>
          </Link>
        </div>
      </aside>

      <section className="garage-main">
        <header className="garage-topbar">
          <TextInput
            className="garage-command"
            aria-label="Search or type a command"
            placeholder="Search or type a command"
            leftSection={<PiMagnifyingGlass size={20} />}
            rightSection={<Kbd>⌘ F</Kbd>}
          />
          <Group gap="sm" wrap="nowrap">
            <Button leftSection={<PiCarProfile size={18} />}>New work order</Button>
            <ActionIcon variant="default" size="lg" aria-label="Notifications">
              <PiBell size={20} />
            </ActionIcon>
            <span className="garage-avatar" aria-label="Signed in user">
              KO
            </span>
          </Group>
        </header>

        <div className="garage-content">
          <section className="garage-page-head" aria-labelledby={`${active}-title`}>
            <Stack gap={5}>
              <Text className="garage-date">{dateLabel}</Text>
              <Text className="garage-role">{role}</Text>
              <Title id={`${active}-title`} order={1}>
                {title}
              </Title>
              <Text className="garage-subtitle">{subtitle}</Text>
            </Stack>
            <Group className="garage-head-actions" justify="flex-end">
              {secondaryAction}
              {primaryAction}
            </Group>
          </section>

          {stats.length ? (
            <div className="garage-stat-strip" aria-label={`${role} status`}>
              {stats.map((stat) => (
                <span key={stat.label}>
                  <strong>{stat.value}</strong>
                  {stat.label}
                </span>
              ))}
            </div>
          ) : null}

          {children}
        </div>
      </section>
    </main>
  );
}
