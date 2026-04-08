import { NavigationIndependentTree } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";
import { FilterScreen, HomeScreen, ResultScreen, TestScreen } from "./quiz/quiz-app-main/src/screens";
import { HomeStackParamList } from "./quiz/quiz-app-main/src/screens/types";

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function Quiz() {
  return (
    <NavigationIndependentTree>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Test"
          component={TestScreen}
          options={{
            headerShown: true,
            header: () => null,
          }}
        />
        <Stack.Screen
          name="Filter"
          component={FilterScreen}
          options={{
            headerShown: true,
            header: () => null,
          }}
        />
        <Stack.Screen name="Result" component={ResultScreen} />
      </Stack.Navigator>
    </NavigationIndependentTree>
  );
}
