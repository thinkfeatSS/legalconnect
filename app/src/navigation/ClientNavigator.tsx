import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

import HomeScreen from '../screens/client/HomeScreen';
import SearchScreen from '../screens/client/SearchScreen';
import MyCasesScreen from '../screens/client/MyCasesScreen';
import ChatListScreen from '../screens/shared/ChatListScreen';

import MyAppointmentsScreen from '../screens/client/MyAppointmentsScreen';
import AIAssistantScreen from '../screens/shared/AIAssistantScreen';
import ClientProfileScreen from '../screens/client/ClientProfileScreen';
import ESignatureRequestScreen from '../screens/shared/ESignatureRequestScreen';

import LawyerProfileScreen from '../screens/client/LawyerProfileScreen';
import BookAppointmentScreen from '../screens/client/BookAppointmentScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import ClientCaseDetailScreen from '../screens/client/ClientCaseDetailScreen';
import ClientDocumentsScreen from '../screens/client/ClientDocumentsScreen';

import ClientDrawerContent from './ClientDrawerContent';
import CustomTabBar from './CustomTabBar';
import { COLORS } from '../theme/colors';

export type ClientStackParamList = {
  ClientMain: undefined;
  LawyerProfile: { lawyerId: number };
  BookAppointment: { lawyerId: number; lawyerName: string };
  Chat: { conversationId: number; recipientName: string };
  ClientCaseDetail: { caseId: number };
  ClientDocuments: { caseId?: number };
};

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator<ClientStackParamList>();

function ClientTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '700' },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => (navigation as any).openDrawer()}
            style={{ paddingLeft: 16, paddingRight: 8 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="menu-outline" size={26} color={COLORS.white} />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="Home"     component={HomeScreen}     options={{ headerShown: false }} />
      <Tab.Screen name="Search"   component={SearchScreen}   options={{ title: 'Search Lawyers' }} />
      <Tab.Screen name="MyCases"  component={MyCasesScreen}  options={{ title: 'My Cases' }} />
      <Tab.Screen name="Messages" component={ChatListScreen} options={{ title: 'Messages' }} />
    </Tab.Navigator>
  );
}

function ClientDrawer() {
  return (
    <Drawer.Navigator
      id="ClientDrawer"
      drawerContent={(props: any) => <ClientDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: { width: 300, backgroundColor: COLORS.primary },
        overlayColor: 'rgba(0,0,0,0.55)',
        swipeEdgeWidth: 40,
      }}
    >
      <Drawer.Screen name="MainTabs"          component={ClientTabs} />
      <Drawer.Screen name="Appointments"      component={MyAppointmentsScreen} />
      <Drawer.Screen name="AIAssistant"       component={AIAssistantScreen} />
      <Drawer.Screen name="ClientProfile"     component={ClientProfileScreen} />
      <Drawer.Screen name="ESignatureRequest" component={ESignatureRequestScreen} />
    </Drawer.Navigator>
  );
}

export default function ClientNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="ClientMain"       component={ClientDrawer}           options={{ headerShown: false }} />
      <Stack.Screen name="LawyerProfile"    component={LawyerProfileScreen}    options={{ title: 'Lawyer Profile',   headerBackTitle: '' }} />
      <Stack.Screen name="BookAppointment"  component={BookAppointmentScreen}  options={{ title: 'Book Appointment', headerBackTitle: '' }} />
      <Stack.Screen name="Chat"             component={ChatScreen}             options={({ route }) => ({ title: (route.params as any).recipientName, headerBackTitle: '' })} />
      <Stack.Screen name="ClientCaseDetail" component={ClientCaseDetailScreen} options={{ title: 'Case Details',     headerBackTitle: '' }} />
      <Stack.Screen name="ClientDocuments"  component={ClientDocumentsScreen}  options={{ title: 'Documents',        headerBackTitle: '' }} />
    </Stack.Navigator>
  );
}
