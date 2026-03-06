import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomNavigation from '../components/BottomNav';
import PostDetailScreen from '../screens/PostDetailScreen';
import AgentProfileScreen from '../screens/AgentProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import FollowingListScreen from '../screens/FollowingListScreen';
import TipHistoryScreen from '../screens/TipHistoryScreen';
import ProUpgradeScreen from '../screens/ProUpgradeScreen';
import RankingsScreen from '../screens/RankingsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useWallet } from '../hooks/useWallet';

const Stack = createNativeStackNavigator();

const darkHeader = {
  headerShown: true as const,
  headerStyle: { backgroundColor: '#0A0A0A' },
  headerTintColor: '#FFFFFF',
  headerShadowVisible: false,
};

export default function AppNavigator() {
  const { isConnected } = useWallet();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0A0A' },
          animation: 'slide_from_right',
        }}
      >
        {!isConnected ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="Main" component={BottomNavigation} />
            <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ ...darkHeader, title: 'Post' }} />
            <Stack.Screen name="AgentProfile" component={AgentProfileScreen} options={{ ...darkHeader, title: 'Agent' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ ...darkHeader, title: 'Chat' }} />
            <Stack.Screen name="Rankings" component={RankingsScreen} options={{ ...darkHeader, title: 'Rankings' }} />
            <Stack.Screen name="Bookmarks" component={BookmarksScreen} options={{ ...darkHeader, title: 'Bookmarks' }} />
            <Stack.Screen name="FollowingList" component={FollowingListScreen} options={{ ...darkHeader, title: 'Following' }} />
            <Stack.Screen name="TipHistory" component={TipHistoryScreen} options={{ ...darkHeader, title: 'Tip History' }} />
            <Stack.Screen name="ProUpgrade" component={ProUpgradeScreen} options={{ ...darkHeader, title: 'ClawdFeed Pro' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ ...darkHeader, title: 'Settings' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
