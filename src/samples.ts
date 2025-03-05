import { FlowConfig, NodeType } from "./types";

const singleNodeFlowConfig: FlowConfig = {
  flowKey: "test-single-node",
  startNodeKey: "start",
  endNodeKey: "start",
  nodes: [
    {
      nodeType: NodeType.BOT_EVALUATION,
      nodeKey: "start",
      inputParams: [],
      outputParams: "data",
      nextNodeOptions: [],
      prompt: "Find out the year IBM was founded.",
      schema: { year: "integer" },
    },
  ],
};

const twoEvaluationNodeFlowConfig: FlowConfig = {
  flowKey: "test-two-execution-nodes",
  startNodeKey: "start",
  endNodeKey: "end",
  nodes: [
    {
      nodeType: NodeType.BOT_EVALUATION,
      nodeKey: "start",
      inputParams: ["year"],
      outputParams: [{ name: "data", path: "" }],
      nextNodeOptions: "end",
      prompt: "Find out whether the year is a leap year.",
      schema: { year: "integer", isLeapYear: "boolean" },
    },
    {
      nodeType: NodeType.BOT_EVALUATION,
      nodeKey: "end",
      inputParams: ["data"],
      outputParams: "dataThreeYearsAgo",
      nextNodeOptions: [],
      prompt:
        "Tell if 3 year before the year from the input data is a leap year.",
      schema: {
        originalYear: "integer",
        threeYearsAgo: "integer",
        isLealYear: "boolean",
      },
    },
  ],
};

const questionEvaluationFlowConfig: FlowConfig = {
  flowKey: "test-interaction-execution-flow",
  startNodeKey: "start",
  endNodeKey: "end",
  nodes: [
    {
      nodeType: NodeType.INTERACTION,
      nodeKey: "start",
      inputParams: [],
      outputParams: ["userInput"],
      nextNodeOptions: ["end"],
      prompt: "Ask the user for their birthday",
    },
    {
      nodeType: NodeType.BOT_EVALUATION,
      nodeKey: "end",
      inputParams: ["userInput"],
      outputParams: "birthday",
      nextNodeOptions: "",
      prompt: "Parse the input data into year, month and date.",
      schema: {
        year: "integer",
        month: "integer",
        day: "integer",
        isLeapYear: "boolean",
      },
    },
  ],
};

// test a flow with loop and branch: e1-q1-e1-e2
const complexFlowConfig: FlowConfig = {
  flowKey: "test-complex-flow",
  startNodeKey: "ask-birthday",
  endNodeKey: "pass-along",
  nodes: [
    {
      nodeType: NodeType.INTERACTION,
      nodeKey: "ask-birthday",
      inputParams: ["birthday"],
      outputParams: [{ name: "userInput", path: "userInput" }],
      nextNodeOptions: "eval-birthday",
      prompt: "Ask the user for their birthday.",
    },
    {
      nodeType: NodeType.BOT_EVALUATION,
      nodeKey: "eval-birthday",
      inputParams: ["userInput"],
      outputParams: [{ name: "birthday", path: "" }],
      nextNodeOptions: "decide-next",
      prompt: "Parse the input data into year, month and date.",
      schema: {
        year: "integer",
        month: "integer",
        date: "integer",
        isLeapYear: "boolean",
        season: "string",
      },
    },
    {
      nodeType: NodeType.BOT_DECISION,
      nodeKey: "decide-next",
      inputParams: ["birthday"],
      outputParams: "decision",
      nextNodeOptions: [
        {
          nodeKey: "ask-birthday",
          prompt:
            "when input data is missing any field in this schema: { year: number; month: number; date: number }",
        },
        {
          nodeKey: "pass-along",
          prompt: "when input data has vaild full date",
        },
      ],
    },
    {
      nodeType: NodeType.BOT_EVALUATION,
      nodeKey: "pass-along",
      inputParams: ["birthday"],
      outputParams: [{ name: "birthdayPlus", path: "." }],
      nextNodeOptions: [],
      prompt: "Pass along the input data to your response",
      schema: {
        year: "integer",
        month: "integer",
        date: "integer",
        isLeapYear: "boolean",
        season: "string",
      },
    },
  ],
};

export {
  complexFlowConfig,
  questionEvaluationFlowConfig,
  singleNodeFlowConfig,
  twoEvaluationNodeFlowConfig,
};
