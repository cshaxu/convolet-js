import {
  BotDecisionPromptBuilder,
  BotEvaluationPromptBuilder,
  BotStreamPromptBuilder,
  NodeInput,
  PromptBuilders,
} from "./types";

const hasInput = (input: NodeInput): boolean => Object.keys(input).length > 0;

const buildFullPrompt = (prompt: string, input: NodeInput): string =>
  [
    ...(hasInput(input)
      ? [
          "--- INPUT DATA BEGINS ---",
          JSON.stringify(input),
          "--- INPUT DATA ENDS ---",
          "",
        ]
      : []),
    prompt,
  ].join("\n");

const botStream: BotStreamPromptBuilder = (
  prompt,
  hasPreviousMessages,
  input
) =>
  buildFullPrompt(
    [
      prompt,
      "",
      "--- TIPS FOR YOUR RESPONSE ---",
      ...(hasPreviousMessages
        ? [
            "Please review the message history and pay attention to the last user message.",
            "Make sure you reply to the user message appropriately.",
            "If they asked a question, try your best to answer it concisely with least possible words,",
            "because you want to focus on the question to ask them to get the answer you need.",
          ]
        : [
            "Your message is the first one in the conversation.",
            "Greet the user first, and ask them the right question according to the task.",
          ]),
      "",
      "Please note this system message is invisible to the user,",
      'and do not reply to this system message like "Sure", "Okay" which will confuse our user.',
    ].join("\n"),
    input
  );

const botEvaluation: BotEvaluationPromptBuilder = (prompt, input) =>
  buildFullPrompt(
    [
      prompt,
      "",
      "--- TIPS FOR YOUR RESPONSE ---",
      `Please review the task description${
        hasInput(input) ? " and input data" : ""
      },`,
      "then generate the output data according to the output schema.",
      "",
      `IMPORANT: ONLY ADD INFORMATION THAT IS PRESENT IN THE ${
        hasInput(input) ? "INPUT DATA" : "TASK DESCRIPTION"
      }.`,
      `- If the information is missing from the ${
        hasInput(input) ? "input data" : "task description"
      } to generate certain fields`,
      "  described in the output schema, please ignore those fields in the output data.",
      `- Do not add or make up any information that is not present in the ${
        hasInput(input) ? "input data" : "task description"
      },`,
      "  no matter if you already know the answer from elsewhere or not.",
      "- For the missing fiels, you should never set those fields to ",
      "  undefined, null, 0, empty string or empty array, etc.",
      "  Those fields should not be present in the output data at all.",
    ].join("\n"),
    input
  );

const botDecision: BotDecisionPromptBuilder = (nextNodeOptions, input) =>
  buildFullPrompt(
    [
      ...(Object.keys(input).length === 0
        ? ["Your task is to evaluate the options given below."]
        : [
            "Your task is to review the input data first, and then evaluate the options given below.",
          ]),
      'Please select the choice (identified by "nodeKey") from below options.',
      "Make sure you read every option carefully first, and then select the one that matches the criteria the best.",
      "And give a quick reson why you selected it with least possible words.",
      "",
      "--- OPTIONS BEGIN ---",
      ...nextNodeOptions
        .filter((o) => o.prompt !== null)
        .map(
          (option) => `- nodeKey: ${option.nodeKey}, criteria: ${option.prompt}`
        ),
      "--- OPTIONS END ---",
      "",
    ].join("\n"),
    input
  );

const defaultPromptBuilders: PromptBuilders = {
  botStream,
  botEvaluation,
  botDecision,
};

export { defaultPromptBuilders };
