import { Tabs } from 'expo-router';

import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#ffffff',             
                tabBarStyle: {
                    backgroundColor: '#1f176a',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Accueil',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
                    ),
                }}
            />
             <Tabs.Screen
                name="documentation"
                options={{
                    title: 'Documentation',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'document-sharp' : 'document-outline'} color={color} size={24} />
                    ),
                }}
            />
            <Tabs.Screen
                name="calendrier"
                options={{
                    title: 'Calendriers',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'calendar-sharp' : 'calendar-outline'} color={color} size={24} />
                    ),
                }}
            />
            <Tabs.Screen
                name="outils"
                options={{
                    title: 'Outils',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'build-sharp' : 'build-outline'} color={color} size={24} />
                    ),
                }}
            />
        </Tabs>
    );
}
