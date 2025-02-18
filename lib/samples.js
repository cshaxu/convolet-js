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
            nodeType: types_1.NodeType.EXECUTION,
            nodeKey: "start",
            prompt: "Find out the year IBM was founded.",
            schema: "{ year: number }",
            nextNodeOptions: [],
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
            nodeType: types_1.NodeType.EXECUTION,
            nodeKey: "start",
            prompt: "Find out the year IBM was founded.",
            schema: "{ year: number; isLeapYear: boolean }",
            nextNodeOptions: [{ prompt: "no evaluation needed", nodeKey: "end" }],
        },
        {
            nodeType: types_1.NodeType.EXECUTION,
            nodeKey: "end",
            prompt: "Tell if 3 year before the year from the input data is a leap year.",
            schema: "{ originalYear: number; threeYearsAgo: number; isLealYear: boolean }",
            nextNodeOptions: [],
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
            prompt: "Ask the user for their birthday",
            schema: null,
            nextNodeOptions: [{ prompt: "", nodeKey: "end" }],
        },
        {
            nodeType: types_1.NodeType.EXECUTION,
            nodeKey: "end",
            prompt: "Parse the input data into year, month and date.",
            schema: "{ year: number; month: number; date: number; isLeapYear: boolean }",
            nextNodeOptions: [],
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
            prompt: "Ask the user for their birthday.",
            schema: null,
            nextNodeOptions: [{ prompt: "", nodeKey: "eval-birthday" }],
        },
        {
            nodeType: types_1.NodeType.EXECUTION,
            nodeKey: "eval-birthday",
            prompt: "Parse the input data into year, month and date.",
            schema: "{ year: number; month: number; date: number; isLeapYear: boolean; season: string }",
            nextNodeOptions: [
                {
                    prompt: "when user faled to provide their birthday",
                    nodeKey: "ask-birthday",
                },
                {
                    prompt: "when user provided their birthday",
                    nodeKey: "pass-along",
                },
            ],
        },
        {
            nodeType: types_1.NodeType.EXECUTION,
            nodeKey: "pass-along",
            prompt: "Pass along the input data to your response",
            schema: "{ year: number; month: number; date: number; isLeapYear: boolean; season: string }",
            nextNodeOptions: [],
        },
    ],
};
exports.complexFlowConfig = complexFlowConfig;
//# sourceMappingURL=samples.js.map