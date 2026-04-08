import { Question, Test } from "./types";

export const IncendieTest: Test = {
  id: "id:test/inc",
  title: "INC",
  testName: "inc",
  duration: 10,
  image: {
    uri: require("../../../../../assets/images/quiz_incendie.png"),
    alt: "incendie",
  },
  numberTotalOfQuestions: 0,
  numberSessionOfQuestions: 0
};

export const incendieQuestions: Question[] = [];
