import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SocialStack } from '../SocialStack';

function renderStack() {
  return render(
    <NavigationContainer>
      <SocialStack />
    </NavigationContainer>,
  );
}

describe('SocialStack', () => {
  it('shows the Social cards screen first', () => {
    renderStack();
    expect(screen.getByTestId('screen-social')).toBeTruthy();
  });

  it('navigates to the browser when a site card is tapped', () => {
    renderStack();
    fireEvent.press(screen.getByTestId('site-card-instagram'));
    expect(screen.getByTestId('screen-browser')).toBeTruthy();
    expect(screen.getByTestId('mock-webview')).toBeTruthy();
  });
});
