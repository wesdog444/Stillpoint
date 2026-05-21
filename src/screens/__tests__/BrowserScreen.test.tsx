import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BrowserScreen } from '../BrowserScreen';
import { getRule } from '../../sanitizer/rules';
import { buildInjection } from '../../sanitizer/injection';

const { __webViewMethods } = require('react-native-webview');

describe('BrowserScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-21T12:00:00.000Z'));
    __webViewMethods.goBack.mockClear();
    __webViewMethods.reload.mockClear();
    __webViewMethods.goForward.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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
    expect(webview.props.injectedJavaScriptBeforeContentLoaded).toBe(buildInjection(getRule('x')));
  });

  it('shows the site name in a header', () => {
    render(<BrowserScreen siteKey="tiktok" />);
    expect(screen.getByText('TikTok')).toBeTruthy();
  });

  it('renders a timer-only top bar', () => {
    render(<BrowserScreen siteKey="instagram" />);
    expect(screen.getByTestId('browser-timer-overlay')).toBeTruthy();
    expect(screen.getByText('0:00')).toBeTruthy();
    expect(screen.queryByText('0 ads')).toBeNull();
    expect(screen.queryByText('0 suggested')).toBeNull();
    expect(screen.queryByText('Block these')).toBeNull();
  });

  it('lets the WebView own the screen instead of rendering a separate site header', () => {
    render(<BrowserScreen siteKey="instagram" />);
    expect(screen.queryByTestId('browser-status-bar')).toBeNull();
    expect(screen.getByTestId('mock-webview')).toBeTruthy();
  });

  it('keeps the timer stable from elapsed wall-clock time', () => {
    render(<BrowserScreen siteKey="instagram" />);
    jest.setSystemTime(new Date('2026-05-21T12:01:05.000Z'));
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('1:06')).toBeTruthy();
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
    expect(webview.props.thirdPartyCookiesEnabled).toBe(true);
    expect(webview.props.incognito).toBe(false);
  });

  it('opens the floating browser controls', () => {
    render(<BrowserScreen siteKey="instagram" />);
    fireEvent.press(screen.getByTestId('browser-toolbar-toggle'));
    expect(screen.getByTestId('browser-floating-toolbar')).toBeTruthy();
  });

  it('wires toolbar actions to the WebView and Stillpoint shell', () => {
    const onReturnHome = jest.fn();
    render(<BrowserScreen siteKey="instagram" onReturnHome={onReturnHome} />);
    fireEvent.press(screen.getByTestId('browser-toolbar-toggle'));

    fireEvent.press(screen.getByRole('button', { name: /go back/i }));
    expect(__webViewMethods.goBack).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByRole('button', { name: /return to stillpoint social/i }));
    expect(onReturnHome).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByRole('button', { name: /refresh/i }));
    expect(__webViewMethods.reload).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByRole('button', { name: /go forward/i }));
    expect(__webViewMethods.goForward).toHaveBeenCalledTimes(1);
  });

  it('opens an account manager from the account toolbar action', () => {
    render(<BrowserScreen siteKey="instagram" />);
    fireEvent.press(screen.getByTestId('browser-toolbar-toggle'));
    fireEvent.press(screen.getByRole('button', { name: /open account manager/i }));
    expect(screen.getByTestId('account-manager')).toBeTruthy();
    expect(screen.getByText('Account manager')).toBeTruthy();
  });

  it('does not render Stillpoint destination chips inside the site browser', () => {
    render(<BrowserScreen siteKey="instagram" />);
    expect(screen.queryByText('Messages')).toBeNull();
    expect(screen.queryByText('Search')).toBeNull();
    expect(screen.queryByText('Reels')).toBeNull();
  });
});
