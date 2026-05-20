import React from 'react';
import { render, screen } from '@testing-library/react-native';
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
});
