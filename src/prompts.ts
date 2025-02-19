import { DataObject, NextNodeOption } from "./types";

const buildFullPrompt = (prompt: string, input: DataObject | null): string =>
  [
    ...(input === null
      ? []
      : [
          "--- INPUT DATA BEGINS ---",
          JSON.stringify(input),
          "--- INPUT DATA ENDS ---",
          "",
        ]),
    prompt,
  ].join("\n");

const buildFullStreamPrompt = (
  prompt: string | null,
  hasPreviousMessages: boolean,
  input: DataObject | null
): string =>
  buildFullPrompt(
    [
      prompt ?? "",
      "",
      "--- TIPS FOR YOUR RESPONSE ---",
      ...(hasPreviousMessages
        ? [
            "Please review the message history and pay attention to the last user message.",
            "Make sure you reply to the user message appropriately.",
            ...(prompt === null
              ? []
              : [
                  "If they asked a question, try your best to answer it concisely with least possible words,",
                  "because you want to focus on the question to ask them to get the answer you need.",
                ]),
          ]
        : [
            "Your message is the first one in the conversation.",
            ...(prompt === null
              ? ["Greet the user first, and ask them how you can help."]
              : [
                  "Greet the user first, and ask them the right question according to the task.",
                ]),
          ]),
      "",
      "Please note this system message is invisible to the user,",
      'and do not reply to this system message like "Sure", "Okay" which will confuse our user.',
    ].join("\n"),
    input
  );

const buildFullJsonPrompt = (
  prompt: string,
  input: DataObject | null
): string =>
  buildFullPrompt(
    [
      prompt,
      "",
      "--- TIPS FOR YOUR RESPONSE ---",
      "Please review the task description and input data,",
      "then generate the output data according to the output schema.",
      "",
      "If the information is missing from the input data to generate certain fields",
      "described in the output schema, please ignore those fields in the output data.",
      "Do not add or make up any information that is not present",
      "in the input data, even if you already know the answer.",
    ].join("\n"),
    input
  );

const buildFullNextNodeKeyPrompt = (
  nextNodeOptions: NextNodeOption[],
  input: DataObject | null
): string =>
  buildFullPrompt(
    [
      ...(input === null
        ? ["Your task is to evaluate the options given below."]
        : [
            "Your task is to review the input data first, and then evaluate the options given below.",
          ]),
      'Please select the next step (identified by "nodeKey") based on the criteria provided.',
      "",
      "--- OPTIONS BEGIN ---",
      ...nextNodeOptions.map(
        (option) => `- nodeKey: ${option.nodeKey}, criteria: ${option.prompt}`
      ),
      "--- OPTIONS END ---",
      "",
    ].join("\n"),
    input
  );

export {
  buildFullJsonPrompt,
  buildFullNextNodeKeyPrompt,
  buildFullStreamPrompt,
};
