"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoEvaluationNodeFlowConfig = exports.singleNodeFlowConfig = exports.questionEvaluationFlowConfig = exports.complexFlowConfig = void 0;
var types_1 = require("./types");
var singleNodeFlowConfig = {
    flowKey: "test-single-node",
    startNodeKey: "start",
    endNodeKey: "start",
    nodes: [
        {
            nodeType: types_1.NodeType.BOT_EVALUATION,
            nodeKey: "start",
            inputParams: ["initial"],
            outputParam: "data",
            nextNodeOptions: [],
            prompt: "Find out the year IBM was founded.",
            schema: "{ year: number }",
        },
    ],
};
exports.singleNodeFlowConfig = singleNodeFlowConfig;
var twoEvaluationNodeFlowConfig = {
    flowKey: "test-two-execution-nodes",
    startNodeKey: "start",
    endNodeKey: "end",
    nodes: [
        {
            nodeType: types_1.NodeType.BOT_EVALUATION,
            nodeKey: "start",
            inputParams: ["initial"],
            outputParam: "data",
            nextNodeOptions: [{ nodeKey: "end", prompt: null }],
            prompt: "Find out the year IBM was founded.",
            schema: "{ year: number; isLeapYear: boolean }",
        },
        {
            nodeType: types_1.NodeType.BOT_EVALUATION,
            nodeKey: "end",
            inputParams: ["data"],
            outputParam: "dataThreeYearsAgo",
            nextNodeOptions: [],
            prompt: "Tell if 3 year before the year from the input data is a leap year.",
            schema: "{ originalYear: number; threeYearsAgo: number; isLealYear: boolean }",
        },
    ],
};
exports.twoEvaluationNodeFlowConfig = twoEvaluationNodeFlowConfig;
var questionEvaluationFlowConfig = {
    flowKey: "test-interaction-execution-flow",
    startNodeKey: "start",
    endNodeKey: "end",
    nodes: [
        {
            nodeType: types_1.NodeType.INTERACTION,
            nodeKey: "start",
            inputParams: ["initial"],
            outputParam: "userInput",
            nextNodeOptions: [{ nodeKey: "end", prompt: null }],
            prompt: "Ask the user for their birthday",
        },
        {
            nodeType: types_1.NodeType.BOT_EVALUATION,
            nodeKey: "end",
            inputParams: ["userInput"],
            outputParam: "birthday",
            nextNodeOptions: [],
            prompt: "Parse the input data into year, month and date.",
            schema: "{ year: number; month: number; date: number; isLeapYear: boolean }",
        },
    ],
};
exports.questionEvaluationFlowConfig = questionEvaluationFlowConfig;
// test a flow with loop and branch: e1-q1-e1-e2
var complexFlowConfig = {
    flowKey: "test-complex-flow",
    startNodeKey: "ask-birthday",
    endNodeKey: "pass-along",
    nodes: [
        {
            nodeType: types_1.NodeType.INTERACTION,
            nodeKey: "ask-birthday",
            inputParams: ["birthday"],
            outputParam: "userInput",
            nextNodeOptions: [{ nodeKey: "eval-birthday", prompt: null }],
            prompt: "Ask the user for their birthday.",
        },
        {
            nodeType: types_1.NodeType.BOT_EVALUATION,
            nodeKey: "eval-birthday",
            inputParams: ["userInput"],
            outputParam: "birthday",
            nextNodeOptions: [{ nodeKey: "decide-next", prompt: null }],
            prompt: "Parse the input data into year, month and date.",
            schema: "{ year: number; month: number; date: number; isLeapYear: boolean; season: string }",
        },
        {
            nodeType: types_1.NodeType.BOT_DECISION,
            nodeKey: "decide-next",
            inputParams: ["birthday"],
            outputParam: "decision",
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
            outputParam: "birthdayPlus",
            nextNodeOptions: [],
            prompt: "Pass along the input data to your response",
            schema: "{ year: number; month: number; date: number; isLeapYear: boolean; season: string }",
        },
    ],
};
exports.complexFlowConfig = complexFlowConfig;
//# sourceMappingURL=samples.js.map