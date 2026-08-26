import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../services/socket';
import AuthNavigator from './AuthNavigator';
import ClientNavigator from './ClientNavigator';
import LawyerNavigator from './LawyerNavigator';
import { COLORS } from '../theme/colors';

export default function RootNavigator() {
  const { user, isLoading, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (user) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }
  }, [user]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!user && <AuthNavigator />}
      {user?.role === 'CLIENT' && <ClientNavigator />}
      {user?.role === 'LAWYER' && <LawyerNavigator />}
    </NavigationContainer>
  );
}
