import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function TabLayout() {
	const { isAuthenticated } = useAuth();

	if (!isAuthenticated) {
		return <Redirect href="/parking_owner_login" />;
	}

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: Colors.light.tint,
				tabBarInactiveTintColor: Colors.light.tabIconDefault,
				tabBarShowLabel: true,
				tabBarStyle: {
					height: 60,
					paddingBottom: 2,
					paddingTop: 5,
					borderTopWidth: 1,
					borderTopColor: '#e0e6f5',
					backgroundColor: '#ffffff',
				},
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: '600',
					color: Colors.light.tabIconDefault,
				},
			}}
		>
			<Tabs.Screen
				name="overview"
				options={{
					title: 'Overview',
					tabBarLabel: 'Overview',
					tabBarIcon: ({ color }) => <Ionicons name="pie-chart" size={24} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="analytics"
				options={{
					title: 'Analytics',
					tabBarLabel: 'Analytics',
					tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={24} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="transaction_log"
				options={{
					title: 'Transactions',
					tabBarLabel: 'Transactions',
					tabBarIcon: ({ color }) => <Ionicons name="receipt" size={24} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: 'Profile',
					tabBarLabel: 'Profile',
					tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({});
