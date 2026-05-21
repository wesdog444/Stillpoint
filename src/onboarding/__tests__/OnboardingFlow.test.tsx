import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { OnboardingFlow } from '../OnboardingFlow';
import { useSettingsStore } from '../../state/settingsStore';

describe('OnboardingFlow', () => {
  beforeEach(() => {
    useSettingsStore.setState({ onboardingComplete: false });
  });

  it('starts on the welcome step', () => {
    render(<OnboardingFlow />);
    expect(screen.getByText('Welcome to Stillpoint')).toBeTruthy();
  });

  it('advances through the steps with the Next button', () => {
    render(<OnboardingFlow />);
    fireEvent.press(screen.getByTestId('onboarding-next'));
    expect(screen.getByText('How Stillpoint works')).toBeTruthy();
    fireEvent.press(screen.getByTestId('onboarding-next'));
    expect(screen.getByText('Gentle reminders')).toBeTruthy();
  });

  it('goes back with the Back button', () => {
    render(<OnboardingFlow />);
    fireEvent.press(screen.getByTestId('onboarding-next'));
    fireEvent.press(screen.getByTestId('onboarding-back'));
    expect(screen.getByText('Welcome to Stillpoint')).toBeTruthy();
  });

  it('finishing the last step completes onboarding', async () => {
    render(<OnboardingFlow />);
    fireEvent.press(screen.getByTestId('onboarding-next'));
    fireEvent.press(screen.getByTestId('onboarding-next'));
    fireEvent.press(screen.getByTestId('onboarding-next'));
    fireEvent.press(screen.getByTestId('onboarding-next'));
    await waitFor(() => {
      expect(useSettingsStore.getState().onboardingComplete).toBe(true);
    });
  });

  it('the notifications step requests permission when its button is pressed', async () => {
    const expoNotifications = require('expo-notifications');
    (expoNotifications.requestPermissionsAsync as jest.Mock).mockClear();
    render(<OnboardingFlow />);
    fireEvent.press(screen.getByTestId('onboarding-next'));
    fireEvent.press(screen.getByTestId('onboarding-next'));
    fireEvent.press(screen.getByTestId('onboarding-enable-notifications'));
    await waitFor(() => {
      expect(expoNotifications.requestPermissionsAsync).toHaveBeenCalled();
    });
  });
});
