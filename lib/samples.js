"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoEvaluationNodeFlowConfig = exports.singleNodeFlowConfig = exports.questionEvaluationFlowConfig = exports.complexFlowConfig = void 0;
const types_1 = require("./types");
const singleNodeFlowConfig = {
    flowKey: "test-single-node",
    startNodeKey: "start",
    endNodeKey: "start",
    nodes: [
        {
            nodeType: types_1.NodeType.BOT_EVALUATION,
            nodeKey: "start",
            inputParams: [],
            outputParams: "data",
            nextNodeOptions: [],
            prompt: "Find out the year IBM was founded.",
            schema: { year: "integer" },
        },
    ],
};
exports.singleNodeFlowConfig = singleNodeFlowConfig;
const twoEvaluationNodeFlowConfig = {
    flowKey: "test-two-execution-nodes",
    startNodeKey: "start",
    endNodeKey: "end",
    nodes: [
        {
            nodeType: types_1.NodeType.BOT_EVALUATION,
            nodeKey: "start",
            inputParams: ["year"],
            outputParams: [{ name: "data", path: "" }],
            nextNodeOptions: "end",
            prompt: "Find out whether the year is a leap year.",
            schema: { year: "integer", isLeapYear: "boolean" },
        },
        {
            nodeType: types_1.NodeType.BOT_EVALUATION,
            nodeKey: "end",
            inputParams: ["data"],
            outputParams: "dataThreeYearsAgo",
            nextNodeOptions: [],
            prompt: "Tell if 3 year before the year from the input data is a leap year.",
            schema: {
                originalYear: "integer",
                threeYearsAgo: "integer",
                isLealYear: "boolean",
            },
        },
    ],
};
exports.twoEvaluationNodeFlowConfig = twoEvaluationNodeFlowConfig;
const questionEvaluationFlowConfig = {
    flowKey: "test-interaction-execution-flow",
    startNodeKey: "start",
    endNodeKey: "end",
    nodes: [
        {
            nodeType: types_1.NodeType.INTERACTION,
            nodeKey: "start",
            inputParams: [],
            outputParams: ["userInput"],
            nextNodeOptions: ["end"],
            prompt: "Ask the user for their birthday",
        },
        {
            nodeType: types_1.NodeType.BOT_EVALUATION,
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
exports.questionEvaluationFlowConfig = questionEvaluationFlowConfig;
// test a flow with loop and branch: e1-q1-e1-e2
const complexFlowConfig = {
    flowKey: "test-complex-flow",
    startNodeKey: "ask-birthday",
    endNodeKey: "pass-along",
    nodes: [
        {
            nodeType: types_1.NodeType.INTERACTION,
            nodeKey: "ask-birthday",
            inputParams: ["birthday"],
            outputParams: [{ name: "userInput", path: "userInput" }],
            nextNodeOptions: "eval-birthday",
            prompt: "Ask the user for their birthday.",
        },
        {
            nodeType: types_1.NodeType.BOT_EVALUATION,
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
            nodeType: types_1.NodeType.BOT_DECISION,
            nodeKey: "decide-next",
            inputParams: ["birthday"],
            outputParams: "decision",
            nextNodeOptions: [
                {
                    nodeKey: "ask-birthday",
                    prompt: "when input data is missing any field in this schema: { year: number; month: number; date: number }",
                },
                {
                    nodeKey: "pass-along",
                    prompt: "when input data has vaild full date",
                },
            ],
        },
        {
            nodeType: types_1.NodeType.BOT_EVALUATION,
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
exports.complexFlowConfig = complexFlowConfig;
//# sourceMappingURL=samples.js.map