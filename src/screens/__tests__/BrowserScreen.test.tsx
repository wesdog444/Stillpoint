import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { BrowserScreen } from '../BrowserScreen';
import { getRule } from '../../sanitizer/rules';
import { buildInjection } from '../../sanitizer/injection';

describe('BrowserScreen', () => {
  it('renders the mocked WebView', () => {
    render(<BrowserScreen siteKey="instagram" />);
    expect(screen.getByTestId('mock-webview')).toBeTruthy();
  });

  it('loads the site URL from the rule', () => {
    render(<BrowserScreen siteKey="youtube" />);
    const webview = screen.getByTestId('mock-webview');
    expect(webview.props.source).toEqual({ uri: getRule('youtube').url });
  });

  it('passes the compiled sanitizer injection to the WebView', () => {
    render(<BrowserScreen siteKey="x" />);
    const webview = screen.getByTestId('mock-webview');
    expect(webview.props.injectedJavaScript).toBe(buildInjection(getRule('x')));
  });

  it('shows the site name in a header', () => {
    render(<BrowserScreen siteKey="tiktok" />);
    expect(screen.getByText('TikTok')).toBeTruthy();
  });

  it('renders a SocialLite-style sanitizer status bar', () => {
    render(<BrowserScreen siteKey="instagram" />);
    expect(screen.getByText('0 ads')).toBeTruthy();
    expect(screen.getByText('0 suggested')).toBeTruthy();
    expect(screen.getByRole('button', { name: /open sanitizer preferences/i })).toBeTruthy();
  });

  it('shows the applying preferences overlay before the site settles', () => {
    render(<BrowserScreen siteKey="instagram" />);
    expect(screen.getByText('Applying your preferences')).toBeTruthy();
    expect(screen.getByText('Setting up content filters for Instagram')).toBeTruthy();
  });

  it('keeps site login persistence enabled', () => {
    render(<BrowserScreen siteKey="instagram" />);
    const webview = screen.getByTestId('mock-webview');
    expect(webview.props.sharedCookiesEnabled).toBe(true);
    expect(webview.props.domStorageEnabled).toBe(true);
  });

  it('opens the floating browser controls', () => {
    render(<BrowserScreen siteKey="instagram" />);
    fireEvent.press(screen.getByTestId('browser-toolbar-toggle'));
    expect(screen.getByTestId('browser-floating-toolbar')).toBeTruthy();
  });
});
