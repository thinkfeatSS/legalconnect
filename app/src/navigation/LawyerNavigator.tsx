import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

import LawyerDashboardScreen from '../screens/lawyer/LawyerDashboardScreen';
import CasesScreen from '../screens/lawyer/CasesScreen';
import LegalCalendarScreen from '../screens/lawyer/LegalCalendarScreen';
import ChatListScreen from '../screens/shared/ChatListScreen';

import LawyerAppointmentsScreen from '../screens/lawyer/LawyerAppointmentsScreen';
import DiaryListScreen from '../screens/lawyer/DiaryListScreen';
import AIAssistantScreen from '../screens/shared/AIAssistantScreen';
import FirmScreen from '../screens/lawyer/FirmScreen';
import LawyerMyProfileScreen from '../screens/lawyer/LawyerMyProfileScreen';

import DiaryEntryScreen from '../screens/lawyer/DiaryEntryScreen';
import ChatScreen from '../screens/shared/ChatScreen';
import CreateCaseScreen from '../screens/lawyer/CreateCaseScreen';
import CaseDetailScreen from '../screens/lawyer/CaseDetailScreen';
import AddHearingScreen from '../screens/lawyer/AddHearingScreen';
import HearingOutcomeScreen from '../screens/lawyer/HearingOutcomeScreen';
import CaseDocumentsScreen from '../screens/lawyer/CaseDocumentsScreen';

import LawyerDrawerContent from './LawyerDrawerContent';
import CustomTabBar from './CustomTabBar';
import { COLORS } from '../theme/colors';

export type LawyerStackParamList = {
  LawyerMain: undefined;
  DiaryEntry: { entryId?: number };
  Chat: { conversationId: number; recipientName: string };
  CreateCase: { caseData?: any } | undefined;
  CaseDetail: { caseId: number; caseTitle?: string };
  AddHearing: { caseId: number; caseTitle?: string };
  HearingOutcome: { hearingId: number; hearingData?: any };
  CaseDocuments: { caseId: number; caseTitle?: string };
};

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator<LawyerStackParamList>();

function LawyerTabs() {
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
      <Tab.Screen name="Dashboard" component={LawyerDashboardScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Cases"     component={CasesScreen}           options={{ title: 'Cases' }} />
      <Tab.Screen name="Calendar"  component={LegalCalendarScreen}   options={{ title: 'Legal Calendar' }} />
      <Tab.Screen name="Messages"  component={ChatListScreen}        options={{ title: 'Messages' }} />
    </Tab.Navigator>
  );
}

function LawyerDrawer() {
  return (
    <Drawer.Navigator
      id="LawyerDrawer"
      drawerContent={(props: any) => <LawyerDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: { width: 300, backgroundColor: COLORS.primary },
        overlayColor: 'rgba(0,0,0,0.55)',
        swipeEdgeWidth: 40,
      }}
    >
      <Drawer.Screen name="MainTabs"           component={LawyerTabs} />
      <Drawer.Screen name="LawyerAppointments" component={LawyerAppointmentsScreen} />
      <Drawer.Screen name="Diary"              component={DiaryListScreen} />
      <Drawer.Screen name="AIAssistant"        component={AIAssistantScreen} />
      <Drawer.Screen name="FirmManagement"     component={FirmScreen} />
      <Drawer.Screen name="LawyerProfile"      component={LawyerMyProfileScreen} />
    </Drawer.Navigator>
  );
}

export default function LawyerNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="LawyerMain"     component={LawyerDrawer}         options={{ headerShown: false }} />
      <Stack.Screen name="DiaryEntry"     component={DiaryEntryScreen}     options={{ title: 'Diary Entry',       headerBackTitle: '' }} />
      <Stack.Screen name="Chat"           component={ChatScreen}           options={({ route }) => ({ title: (route.params as any).recipientName, headerBackTitle: '' })} />
      <Stack.Screen name="CreateCase"     component={CreateCaseScreen}     options={({ route }) => ({ title: (route.params as any)?.caseData ? 'Edit Case' : 'New Case', headerBackTitle: '' })} />
      <Stack.Screen name="CaseDetail"     component={CaseDetailScreen}     options={({ route }) => ({ title: (route.params as any).caseTitle ?? 'Case Details', headerBackTitle: '' })} />
      <Stack.Screen name="AddHearing"     component={AddHearingScreen}     options={{ title: 'Schedule Hearing', headerBackTitle: '' }} />
      <Stack.Screen name="HearingOutcome" component={HearingOutcomeScreen} options={{ title: 'Hearing Outcome',  headerBackTitle: '' }} />
      <Stack.Screen name="CaseDocuments"  component={CaseDocumentsScreen}  options={({ route }) => ({ title: (route.params as any).caseTitle ? `Docs — ${(route.params as any).caseTitle}` : 'Documents', headerBackTitle: '' })} />
    </Stack.Navigator>
  );
}
