'use client';

import { useEffect, useState, type ElementType, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ActionIcon, Badge, Button, Group, Kbd, Menu, Stack, Text, TextInput, Title } from '@mantine/core';
import {
  PiBell,
  PiCarProfile,
  PiGear,
  PiMagnifyingGlass,
  PiSignOut,
} from 'react-icons/pi';
import { apiRequest } from '@/lib/api';
import { useAuth } from './AuthProvider';

// ─── Public types ────────────────────────────────────────────────────────────

export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: ElementType;
};

export type ShellStat = {
  label: string;
  value: string;
};

export type DashboardShellProps = {
  /** Display label shown above the page title (e.g. "Admin", "Front Desk") */
  role: string;
  /** The page title */
  title: string;
  /** Secondary description below the title */
  subtitle: string;
  /** Date / context string shown in the page header */
  dateLabel: string;
  /** Role-specific sidebar navigation links */
  navItems: NavItem[];
  /** Optional href for the Settings footer link (defaults to no settings link) */
  settingsHref?: string;
  /** Optional primary CTA in the top bar — pass null to hide the default "New work order" button */
  topBarAction?: ReactNode | null;
  /** Stat strip items shown below the page header */
  stats?: ShellStat[];
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  children: ReactNode;
};

// ─── Internal types ───────────────────────────────────────────────────────────

type AppNotification = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function DashboardShell({
  role,
  title,
  subtitle,
  dateLabel,
  navItems,
  settingsHref,
  topBarAction,
  stats = [],
  primaryAction,
  secondaryAction,
  children,
}: DashboardShellProps) {
  const { accessToken, user, logout } = useAuth();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Derive initials for the avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : '??';

  useEffect(() => {
    if (!accessToken) return;

    apiRequest<{ notifications: AppNotification[] }>('/api/v1/notifications?pageSize=8', {
      headers: { authorization: `Bearer ${accessToken}` },
    })
      .then((result) => setNotifications(result.notifications))
      .catch(() => setNotifications([]));
  }, [accessToken]);

  async function markNotificationRead(id: string) {
    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );
    if (!accessToken) return;

    await apiRequest(`/api/v1/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${accessToken}` },
    }).catch(() => undefined);
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Determine the brand home link — send users back to their own dashboard root
  const brandHref = navItems[0]?.href ?? '/login';

  return (
    <main className="garage-shell">
      <aside className="garage-sidebar" aria-label="GarageOS navigation">
        <Link className="garage-brand" href={brandHref}>
          GarageOS
        </Link>

        <nav className="garage-nav" aria-label={`${role} navigation`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.key}
                className={`garage-nav-item${isActive ? ' is-active' : ''}`}
                href={item.href}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="garage-sidebar-footer">
          {settingsHref && (
            <Link className="garage-nav-item" href={settingsHref}>
              <PiGear size={20} />
              Settings
            </Link>
          )}
          <button
            type="button"
            className="garage-nav-item"
            onClick={logout}
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
          >
            <PiSignOut size={20} />
            Sign out
          </button>
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
            {/* topBarAction === null hides the button; undefined shows the default */}
            {topBarAction === null ? null : topBarAction ?? (
              <Button leftSection={<PiCarProfile size={18} />}>New work order</Button>
            )}
            <Menu width={320} position="bottom-end" shadow="md">
              <Menu.Target>
                <ActionIcon
                  variant="default"
                  size="lg"
                  aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
                  className="notification-bell"
                >
                  <PiBell size={20} />
                  {unreadCount > 0 && (
                    <Badge className="notification-count">{unreadCount}</Badge>
                  )}
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Notifications</Menu.Label>
                {notifications.length ? (
                  notifications.map((notification) => (
                    <Menu.Item
                      key={notification.id}
                      onClick={() => markNotificationRead(notification.id)}
                      className={notification.isRead ? '' : 'is-unread'}
                    >
                      <span className="notification-item">
                        <strong>{notification.title}</strong>
                        <small>{notification.body}</small>
                      </span>
                    </Menu.Item>
                  ))
                ) : (
                  <Menu.Item disabled>No notifications</Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
            <span className="garage-avatar" aria-label={`Signed in as ${user?.name ?? 'user'}`}>
              {initials}
            </span>
          </Group>
        </header>

        <div className="garage-content">
          <section className="garage-page-head" aria-labelledby="page-title">
            <Stack gap={5}>
              <Text className="garage-date">{dateLabel}</Text>
              <Text className="garage-role">{role}</Text>
              <Title id="page-title" order={1}>
                {title}
              </Title>
              <Text className="garage-subtitle">{subtitle}</Text>
            </Stack>
            <Group className="garage-head-actions" justify="flex-end">
              {secondaryAction}
              {primaryAction}
            </Group>
          </section>

          {stats.length > 0 && (
            <div className="garage-stat-strip" aria-label={`${role} status`}>
              {stats.map((stat) => (
                <span key={stat.label}>
                  <strong>{stat.value}</strong>
                  {stat.label}
                </span>
              ))}
            </div>
          )}

          {children}
        </div>
      </section>
    </main>
  );
}
