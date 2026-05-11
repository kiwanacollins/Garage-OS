import { createTheme, virtualColor } from '@mantine/core';

export const garageTheme = createTheme({
  primaryColor: 'garageBlue',
  primaryShade: 6,
  fontFamily:
    '"Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSizes: {
    xs: '0.75rem',
    sm: '0.8125rem',
    md: '0.875rem',
    lg: '1rem',
    xl: '1.125rem',
  },
  headings: {
    fontFamily:
      '"Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '2.5rem', lineHeight: '1.1' },
      h2: { fontSize: '1.25rem', lineHeight: '1.25' },
      h3: { fontSize: '1.05rem', lineHeight: '1.3' },
    },
  },
  defaultRadius: 'md',
  colors: {
    garageBlue: [
      '#eff4ff',
      '#dbeafe',
      '#bfdbfe',
      '#93c5fd',
      '#60a5fa',
      '#3b82f6',
      '#2563eb',
      '#1d4ed8',
      '#1e40af',
      '#1e3a8a',
    ],
    garageRed: [
      '#fef2f2',
      '#fee2e2',
      '#fecaca',
      '#fca5a5',
      '#f87171',
      '#ef4444',
      '#dc2626',
      '#b91c1c',
      '#991b1b',
      '#7f1d1d',
    ],
  },
  other: {
    success: '#16A34A',
    warning: '#F59E0B',
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    borderSubtle: '#F1F5F9',
    ink: '#0F172A',
    muted: '#64748B',
    mutedLight: '#94A3B8',
  },
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
    Paper: {
      defaultProps: {
        radius: 'lg',
        withBorder: true,
      },
    },
    Badge: {
      defaultProps: {
        radius: 'xl',
        variant: 'light',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
    NumberInput: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
    Textarea: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
    SegmentedControl: {
      defaultProps: {
        radius: 'md',
        size: 'sm',
      },
    },
  },
});

export const statusColor = virtualColor({
  name: 'status',
  dark: 'garageBlue',
  light: 'garageBlue',
});
