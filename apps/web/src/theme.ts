import { createTheme, virtualColor } from '@mantine/core';

export const garageTheme = createTheme({
  primaryColor: 'garageBlue',
  primaryShade: 6,
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  headings: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: '750',
  },
  defaultRadius: 'sm',
  colors: {
    garageBlue: [
      '#ebf0f9',
      '#d6e0f2',
      '#c5d3ec',
      '#9fb5de',
      '#7896d0',
      '#5876bd',
      '#3857a3',
      '#2a4280',
      '#1c2d5c',
      '#101b38',
    ],
    garageRed: [
      '#fde8e8',
      '#fbd0d1',
      '#f9babb',
      '#f58487',
      '#f15155',
      '#ee1e24',
      '#c4181d',
      '#981217',
      '#6c0d10',
      '#410708',
    ],
  },
  other: {
    success: '#16A34A',
    warning: '#F59E0B',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'sm',
      },
    },
    Paper: {
      defaultProps: {
        radius: 'sm',
        withBorder: true,
      },
    },
    Badge: {
      defaultProps: {
        radius: 'xl',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'sm',
      },
    },
    Select: {
      defaultProps: {
        radius: 'sm',
      },
    },
    NumberInput: {
      defaultProps: {
        radius: 'sm',
      },
    },
    Textarea: {
      defaultProps: {
        radius: 'sm',
      },
    },
    SegmentedControl: {
      defaultProps: {
        radius: 'sm',
      },
    },
  },
});

export const statusColor = virtualColor({
  name: 'status',
  dark: 'garageBlue',
  light: 'garageBlue',
});
