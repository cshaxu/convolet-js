"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFullStreamPrompt = exports.buildFullNextNodeKeyPrompt = exports.buildFullJsonPrompt = void 0;
var buildFullPrompt = function (prompt, input) {
    return __spreadArray(__spreadArray([], (input === null
        ? []
        : [
            "--- INPUT DATA BEGINS ---",
            JSON.stringify(input),
            "--- INPUT DATA ENDS ---",
            "",
        ]), true), [
        prompt,
    ], false).join("\n");
};
var buildFullStreamPrompt = function (prompt, hasPreviousMessages, input) {
    return buildFullPrompt(__spreadArray(__spreadArray([
        prompt,
        "",
        "--- TIPS FOR YOUR RESPONSE ---"
    ], (hasPreviousMessages
        ? [
            "Please review the message history and pay attention to the last user message.",
            "Make sure you reply to the user message appropriately.",
            "If they asked a question, try your best to answer it concisely with least possible words,",
            "because you want to focus on the question to ask them to get the answer you need.",
        ]
        : [
            "---",
            "Your message is the first one in the conversation.",
            "Greet the user first, and ask them the right question according to the task.",
        ]), true), [
        "",
        "Please note this system message is invisible to the user,",
        'and do not reply to this system message like "Sure", "Okay" which will confuse our user.',
    ], false).join("\n"), input);
};
exports.buildFullStreamPrompt = buildFullStreamPrompt;
var buildFullJsonPrompt = function (prompt, input) {
    return buildFullPrompt([
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
    ].join("\n"), input);
};
exports.buildFullJsonPrompt = buildFullJsonPrompt;
var buildFullNextNodeKeyPrompt = function (nextNodeOptions, input) {
    return buildFullPrompt(__spreadArray(__spreadArray(__spreadArray(__spreadArray([], (input === null
        ? ["Your task is to evaluate the options given below."]
        : [
            "Your task is to review the input data first, and then evaluate the options given below.",
        ]), true), [
        'Please select the next step (identified by "nodeKey") based on the criteria provided.',
        "",
        "--- OPTIONS BEGIN ---"
    ], false), nextNodeOptions.map(function (option) { return "- nodeKey: ".concat(option.nodeKey, ", criteria: ").concat(option.prompt); }), true), [
        "--- OPTIONS END ---",
        "",
    ], false).join("\n"), input);
};
exports.buildFullNextNodeKeyPrompt = buildFullNextNodeKeyPrompt;
//# sourceMappingURL=prompts.js.map