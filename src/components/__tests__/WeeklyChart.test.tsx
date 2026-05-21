import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { WeeklyChart } from '../WeeklyChart';
import type { DayFocus } from '../../data/statsRepository';

const WEEK: DayFocus[] = [
  { dayKey: '2026-05-14', weekday: 'Thu', minutes: 0 },
  { dayKey: '2026-05-15', weekday: 'Fri', minutes: 30 },
  { dayKey: '2026-05-16', weekday: 'Sat', minutes: 60 },
  { dayKey: '2026-05-17', weekday: 'Sun', minutes: 45 },
  { dayKey: '2026-05-18', weekday: 'Mon', minutes: 90 },
  { dayKey: '2026-05-19', weekday: 'Tue', minutes: 20 },
  { dayKey: '2026-05-20', weekday: 'Wed', minutes: 50 },
];

describe('WeeklyChart', () => {
  it('renders a bar for each day with its weekday label', () => {
    render(<WeeklyChart data={WEEK} />);
    for (const day of WEEK) {
      expect(screen.getByTestId(`chart-bar-${day.dayKey}`)).toBeTruthy();
    }
    expect(screen.getAllByText('Mon').length).toBeGreaterThan(0);
  });

  it('gives each bar an accessibility label with its minutes', () => {
    render(<WeeklyChart data={WEEK} />);
    const bar = screen.getByTestId('chart-bar-2026-05-18');
    expect(bar.props.accessibilityLabel).toBe('Mon: 90 minutes focused');
  });

  it('renders without crashing when every day is zero', () => {
    const zero = WEEK.map((d) => ({ ...d, minutes: 0 }));
    render(<WeeklyChart data={zero} />);
    expect(screen.getByTestId('chart-bar-2026-05-20')).toBeTruthy();
  });
});
