"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
const types_1 = require("./types");
function buildErrorMessage(content, fieldName, expected, got) {
    const objectId = [content.key, content.flowId, content.index].join("-");
    return `Node (${objectId}): "${fieldName}", expected "${expected.toString()}", got "${got.toString()}"`;
}
class Node {
    constructor(config, content, input, adapter, promptBuilders, systemEvaluator) {
        this.config = config;
        this.content = content;
        this.input = input;
        this.adapter = adapter;
        this.promptBuilders = promptBuilders;
        this.systemEvaluator = systemEvaluator;
    }
    isInteractionNodeOrThrow() {
        if (this.content.type !== types_1.NodeType.INTERACTION) {
            throw new Error(buildErrorMessage(this.content, "isInteractionNode", true, false));
        }
    }
    isBotEvaluationNodeOrThrow() {
        if (this.content.type !== types_1.NodeType.BOT_EVALUATION) {
            throw new Error(buildErrorMessage(this.content, "isBotEvaluation", true, false));
        }
    }
    isSystemEvaluationNodeOrThrow() {
        if (this.content.type !== types_1.NodeType.SYSTEM_EVALUATION) {
            throw new Error(buildErrorMessage(this.content, "isSystemEvaluation", true, false));
        }
    }
    isBotDecisionNodeOrThrow() {
        if (this.content.type !== types_1.NodeType.BOT_DECISION) {
            throw new Error(buildErrorMessage(this.content, "isBotDecision", true, false));
        }
    }
    isSystemDecisionNodeOrThrow() {
        if (this.content.type !== types_1.NodeType.SYSTEM_DECISION) {
            throw new Error(buildErrorMessage(this.content, "isSystemDecision", true, false));
        }
    }
    getStatus() {
        if (this.content.output === null) {
            return types_1.NodeStatus.INITIATED;
        }
        if (this.content.type === types_1.NodeType.INTERACTION) {
            const output = this.content.output;
            return output.userInput !== undefined
                ? types_1.NodeStatus.COMPLETED
                : output.botStreamed !== undefined
                    ? types_1.NodeStatus.PROCESSING
                    : types_1.NodeStatus.INITIATED;
        }
        return types_1.NodeStatus.COMPLETED;
    }
    isInitiatedOrThrow() {
        if (this.getStatus() !== types_1.NodeStatus.INITIATED) {
            throw new Error(buildErrorMessage(this.content, "status", types_1.NodeStatus.INITIATED, this.getStatus()));
        }
    }
    isProcessingOrThrow() {
        if (this.getStatus() !== types_1.NodeStatus.PROCESSING) {
            throw new Error(buildErrorMessage(this.content, "status", types_1.NodeStatus.PROCESSING, this.getStatus()));
        }
    }
    interactBotStream(messages, onStreamDone, options) {
        return __awaiter(this, void 0, void 0, function* () {
            // validate
            this.isInteractionNodeOrThrow();
            this.isInitiatedOrThrow();
            // assemble input
            const { prompt } = this.config;
            // generate
            const botStreamPrompt = this.promptBuilders.botStream(prompt, messages.length > 0, this.input);
            // persist
            const callback = (generated) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                this.content.output = Object.assign(Object.assign({}, ((_a = this.content.output) !== null && _a !== void 0 ? _a : {})), { botStreamed: generated });
                yield this.adapter.updateNode(this.content);
                yield onStreamDone(generated);
            });
            return yield this.adapter.streamChat(botStreamPrompt, messages, callback, options);
        });
    }
    interactUserInput(userInput) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // validate
            this.isInteractionNodeOrThrow();
            this.isProcessingOrThrow();
            // persist
            this.content.output = Object.assign(Object.assign({}, ((_a = this.content.output) !== null && _a !== void 0 ? _a : {})), { userInput });
            yield this.adapter.updateNode(this.content);
        });
    }
    botEvaluate(jsonChatOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            // validate
            this.isBotEvaluationNodeOrThrow();
            this.isInitiatedOrThrow();
            // evaluate
            const { prompt, schema } = this.config;
            this.content.output = yield this.adapter.jsonChat(this.promptBuilders.botEvaluation(prompt, this.input), schema, jsonChatOptions);
            // persist
            yield this.adapter.updateNode(this.content);
        });
    }
    systemEvaluate() {
        return __awaiter(this, void 0, void 0, function* () {
            // validate
            this.isSystemEvaluationNodeOrThrow();
            this.isInitiatedOrThrow();
            // evaluate
            this.content.output =
                this.systemEvaluator === undefined
                    ? {}
                    : yield this.systemEvaluator(this.input, this.content, this.config);
            // persist
            yield this.adapter.updateNode(this.content);
        });
    }
    botDecide(jsonChatOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            // validate
            this.isBotDecisionNodeOrThrow();
            this.isInitiatedOrThrow();
            // decide
            const { nextNodeOptions } = this.config;
            const promptedNextNodeOptions = typeof nextNodeOptions === "string"
                ? []
                : nextNodeOptions.filter((option) => typeof option !== "string");
            const botDecisionPrompt = this.promptBuilders.botDecision(promptedNextNodeOptions, this.input);
            this.content.output =
                typeof nextNodeOptions === "string"
                    ? { nextNodeKey: nextNodeOptions }
                    : nextNodeOptions.length === 1
                        ? {
                            nextNodeKey: typeof nextNodeOptions[0] === "string"
                                ? nextNodeOptions[0]
                                : nextNodeOptions[0].nodeKey,
                        }
                        : promptedNextNodeOptions.length > 0
                            ? yield this.adapter.jsonChat(botDecisionPrompt, { nextNodeKey: "string", reason: "string" }, jsonChatOptions)
                            : { nextNodeKey: "invalid nextNodeOptions" };
            // persist
            yield this.adapter.updateNode(this.content);
        });
    }
    systemDecide() {
        return __awaiter(this, void 0, void 0, function* () {
            // validate
            this.isSystemDecisionNodeOrThrow();
            this.isInitiatedOrThrow();
            // decide
            const { nextNodeOptions } = this.config;
            this.content.output =
                typeof nextNodeOptions === "string"
                    ? { nextNodeKey: nextNodeOptions }
                    : nextNodeOptions.length === 1
                        ? {
                            nextNodeKey: typeof nextNodeOptions[0] === "string"
                                ? nextNodeOptions[0]
                                : nextNodeOptions[0].nodeKey,
                        }
                        : this.systemEvaluator !== undefined && nextNodeOptions.length > 1
                            ? yield this.systemEvaluator(this.input, this.content, this.config)
                            : { nextNodeKey: "invald nextNodeOptions or systemEvaluator" };
            // persist
            yield this.adapter.updateNode(this.content);
        });
    }
}
exports.Node = Node;
//# sourceMappingURL=node.js.map