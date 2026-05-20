import { Home, Globe, ShieldCheck, BarChart3, User } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { HomeScreen } from '../screens/HomeScreen';
import { SocialStack } from './SocialStack';
import { BlocksScreen } from '../screens/BlocksScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

export type TabDef = {
  name: 'Home' | 'Social' | 'Blocks' | 'Stats' | 'Profile';
  label: string;
  component: ComponentType;
  icon: ComponentType<{ size: number; color: string }>;
};

export const TABS: TabDef[] = [
  { name: 'Home', label: 'Home', component: HomeScreen, icon: Home },
  { name: 'Social', label: 'Social', component: SocialStack, icon: Globe },
  { name: 'Blocks', label: 'Blocks', component: BlocksScreen, icon: ShieldCheck },
  { name: 'Stats', label: 'Stats', component: StatsScreen, icon: BarChart3 },
  { name: 'Profile', label: 'Profile', component: ProfileScreen, icon: User },
];
