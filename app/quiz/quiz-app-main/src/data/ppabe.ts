import { Question, Test } from "./types";

export const PPABETest: Test = {
  id: "id:test/ppabe",
  title: "PPABE",
  testName: "ppabe",
  duration: 10,
  image: {
    uri: require("../../../../../assets/images/quiz_ppabe.png"),
    alt: "ppabe",
  },
  numberTotalOfQuestions: 0,
  numberSessionOfQuestions: 0
};

export const PPABEQuestions: Question[] = [];
