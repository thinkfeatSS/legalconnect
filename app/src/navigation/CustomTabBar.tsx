import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { COLORS } from '../theme/colors';

const TAB_ICONS: Record<string, { active: string; inactive: string; label: string }> = {
  Home:      { active: 'home',          inactive: 'home-outline',          label: 'Home'      },
  Search:    { active: 'search',        inactive: 'search-outline',        label: 'Search'    },
  MyCases:   { active: 'folder',        inactive: 'folder-outline',        label: 'Cases'     },
  Messages:  { active: 'chatbubble',    inactive: 'chatbubble-outline',    label: 'Messages'  },
  Dashboard: { active: 'grid',          inactive: 'grid-outline',          label: 'Dashboard' },
  Cases:     { active: 'briefcase',     inactive: 'briefcase-outline',     label: 'Cases'     },
  Calendar:  { active: 'calendar',      inactive: 'calendar-outline',      label: 'Calendar'  },
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const iconSet = TAB_ICONS[route.name] ?? {
            active: 'ellipse',
            inactive: 'ellipse-outline',
            label: route.name,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () =>
            navigation.emit({ type: 'tabLongPress', target: route.key });

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.75}
            >
              <View style={[styles.pill, isFocused && styles.pillActive]}>
                <Icon
                  name={isFocused ? iconSet.active : iconSet.inactive}
                  size={22}
                  color={isFocused ? COLORS.accent : COLORS.textMuted}
                />
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {iconSet.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 6,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    elevation: 14,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  pill: {
    width: 48,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: 'rgba(201,168,76,0.13)',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: COLORS.accent,
  },
});

export default React.memo(CustomTabBar);
