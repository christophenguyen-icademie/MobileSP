export interface Image {
  uri: string;
  alt: string;
}

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  question: string;
  options: Option[];
  answerDescription: string;
  niveau: string,
  categorie: string,
  referenciel: string
}

export interface Test {
  id: string;
  title: string;
  image?: Image;
  testName: TestName;
  duration: number;
  numberTotalOfQuestions: number,
  numberSessionOfQuestions: number
}

export type TestName = "suap" | "ppabe" | "inc" | "sr";

export function convertJsonToArrayOfQuestion(category: string){

 const questions = require('./suap.json');
  const data = questions.questions.map((item) => {
  return {
    id: "id:question/" + item.id,
    question: item.question,
    options: item.choices.map((choice) => {
      return {
      
          id: "id:option/" + choice.id, 
          text: choice.text,
          isCorrect: (item.answers.includes(choice.id))       
      }
    }),
    answerDescription:
      item.explanation
  }; 
  });

  const selection = data.sort(() => Math.random() - 0,5);
  return selection.slice(0, 20);
}
