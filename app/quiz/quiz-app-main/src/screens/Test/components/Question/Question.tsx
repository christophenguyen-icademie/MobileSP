import { Text } from "@react-navigation/elements";
import { ScrollView, StyleSheet, View } from "react-native";
import { Question as QuestionType } from "../../../../data/types";
import { Options } from "./components";

interface Props {
  question: QuestionType;
  onAnswered: (correct: boolean) => void;
}

export function Question({ question, onAnswered }: Props) {
   return (
    <ScrollView style={{flex: 1}}>
      <View style={questionStyle.root}>
        <Text style={questionStyle.question}>{question.question.replace("<p>","").replace("</p>","")}</Text>       
        <Options
          options={question.options}
          description={question.answerDescription}
          onAnswered={onAnswered}
        />
      </View>
    </ScrollView>
  );
}

const questionStyle = StyleSheet.create({
  root: {
    padding: 16,
    gap: 8,
  },
  question: {
    flexDirection:'row', 
    flex: 1, 
    flexWrap: 'wrap',
    flexShrink: 1,
    fontSize: 24
  },
});
