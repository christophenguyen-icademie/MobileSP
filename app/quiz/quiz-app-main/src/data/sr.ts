import { Question, Test } from "./types";

export const SRTest: Test = {
  id: "id:test/sr",
  title: "SR",
  testName: "sr",
  duration: 10,
  image: {
    uri: require("../../../../../assets/images/quiz_sr.png"),
    alt: "sr",
  },
  numberTotalOfQuestions: 0,
  numberSessionOfQuestions: 0
};

export const SRQuestions: Question[] = [];
