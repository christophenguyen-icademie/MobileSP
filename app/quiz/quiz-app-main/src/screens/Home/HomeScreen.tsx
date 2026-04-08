import { FlatList, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaBox } from "../../components";
import { HomeScreenProps } from "../types";
import { HomeCard } from "./components";
import { data } from "./data";

export function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <SafeAreaBox>
      <ScrollView>
        <View style={homeScreen.rootContainer}>
          <FlatList
            scrollEnabled={false}
            numColumns={2}
            data={data}
            renderItem={({ item, index }) => (
              <HomeCard
                title={item.title}
                image={item.image}
                numOfQuestions={item.numberTotalOfQuestions}
                duration={item.duration}
                index={index}
                onPress={() => {
                  navigation.navigate("Filter", {
                    title: item.title,
                    testName: item.testName                  
                  });
                }}
              />
            )}
            keyExtractor={(item) => item.id}
          />
        </View>
      </ScrollView>
    </SafeAreaBox>
  );
}

const homeScreen = StyleSheet.create({
  rootContainer: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f176a",
  },
});

