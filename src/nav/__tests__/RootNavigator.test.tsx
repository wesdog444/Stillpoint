import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { initDatabase } from '../../data/database';
import { RootNavigator } from '../RootNavigator';
import type { SiteKey } from '../../sanitizer/types';

const opSqlite = require('@op-engineering/op-sqlite');
const SOCIAL_SITE_KEYS: SiteKey[] = ['instagram', 'youtube', 'x', 'tiktok', 'facebook', 'snapchat'];

describe('RootNavigator', () => {
  beforeEach(() => {
    opSqlite.__resetMock();
    initDatabase();
  });

  it('renders the Home screen by default', async () => {
    render(<RootNavigator />);
    expect(await screen.findByTestId('screen-home')).toBeTruthy();
  });

  it('shows all five tab labels', async () => {
    render(<RootNavigator />);
    await screen.findByTestId('screen-home');
    for (const label of ['Home', 'Social', 'Blocks', 'Stats', 'Profile']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it('navigates to the Stats screen when its tab is pressed', async () => {
    render(<RootNavigator />);
    await screen.findByTestId('screen-home');
    fireEvent.press(screen.getByText('Stats'));
    expect(screen.getByTestId('screen-stats')).toBeTruthy();
  });

  it.each(SOCIAL_SITE_KEYS)('hides the bottom tabs while %s is focused in the social browser', async (siteKey) => {
    render(<RootNavigator />);
    await screen.findByTestId('screen-home');
    fireEvent.press(screen.getByText('Social'));
    fireEvent.press(await screen.findByTestId(`site-card-${siteKey}`));
    expect(await screen.findByTestId('screen-browser')).toBeTruthy();
    expect(screen.queryByText('Home')).toBeNull();
    expect(screen.queryByText('Social')).toBeNull();
    expect(screen.queryByText('Blocks')).toBeNull();
    expect(screen.queryByText('Stats')).toBeNull();
    expect(screen.queryByText('Profile')).toBeNull();
  });
});
