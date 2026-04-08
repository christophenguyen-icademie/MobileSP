import { Test } from "./types";

export const SUAPTest: Test = {
  id: "id:test/suap",
  title: "SUAP",
  testName: "suap",
  duration: 10,
  image: {
    uri: require("../../../../../assets/images/quiz_suap.png"),
    alt: "SUAP",
  },
  numberTotalOfQuestions: 1000,
  numberSessionOfQuestions: 20
};
