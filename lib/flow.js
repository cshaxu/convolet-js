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
exports.Flow = void 0;
const node_1 = require("./node");
const prompts_1 = require("./prompts");
const types_1 = require("./types");
const utils_1 = require("./utils");
// Config Rules
// - interaction node is to generate a bot question stream for user to answer
// - evaluation node is to evaluate the input and generate json
// - decision node is to evaluate the input and generate next node key
// - start node can be any node
// - end node must be an evaluation node
// - end node has no next node key
// - non-end nodes have next node key or next node options
// - interaction node and evaluation node must move to exactly one next node
// - decision node must have at least one next node option
// - flow can be created with initial memory data
function buildConfigErrorMessage(flowKey, message) {
    return `FlowConfig (${flowKey}): ${message}`;
}
function buildContentErrorMessage(content, message) {
    const objectId = [content.key, content.id].join("-");
    return `Flow (${objectId}): ${message}`;
}
function getOnlyNextNodeKey(nextNodeOptions) {
    return typeof nextNodeOptions === "string"
        ? nextNodeOptions
        : typeof nextNodeOptions[0] === "string"
            ? nextNodeOptions[0]
            : nextNodeOptions[0].nodeKey;
}
function validateFlowConfig(flowConfig) {
    const { flowKey, nodes, startNodeKey, endNodeKey } = flowConfig;
    // validate start node config
    const startNodeConfig = nodes.find((nc) => nc.nodeKey === startNodeKey);
    if (startNodeConfig === undefined) {
        new Error(buildConfigErrorMessage(flowKey, `missing start node config (${startNodeKey})`));
    }
    // validate end node config
    const endNodeConfig = nodes.find((nc) => nc.nodeKey === endNodeKey);
    if (endNodeConfig === undefined) {
        new Error(buildConfigErrorMessage(flowKey, `missing end NodeConfig (${endNodeKey})`));
    }
    nodes.forEach((nodeConfig) => {
        const { nodeType, nodeKey, nextNodeOptions } = nodeConfig;
        const isEndNode = nodeKey === endNodeKey;
        if (typeof nextNodeOptions === "string") {
            if (nextNodeOptions.length > 0) {
                const nextNodeConfig = nodes.find((nc) => nc.nodeKey === nextNodeOptions);
                if (nextNodeConfig === undefined) {
                    new Error(buildConfigErrorMessage(flowKey, `NodeConfig (${nodeKey}): missing next NodeConfig (${nextNodeOptions})`));
                }
            }
        }
        else {
            nextNodeOptions.forEach((nno) => {
                const nextNodeKey = typeof nno === "string" ? nno : nno.nodeKey;
                const nextNodeConfig = nodes.find((nc) => nc.nodeKey === nextNodeKey);
                if (nextNodeConfig === undefined) {
                    new Error(buildConfigErrorMessage(flowKey, `NodeConfig (${nodeKey}): missing input NodeConfig (${nextNodeKey})`));
                }
            });
        }
        switch (nodeType) {
            case types_1.NodeType.INTERACTION:
                if (isEndNode) {
                    new Error(buildConfigErrorMessage(flowKey, `NodeConfig (${nodeKey}): must be an evaluation node as end node`));
                }
                if (typeof nextNodeOptions !== "string" &&
                    nextNodeOptions.length !== 1) {
                    new Error(buildConfigErrorMessage(flowKey, `NodeConfig (${nodeKey}): must have exactly one next node option`));
                }
                const nextNodeKey = getOnlyNextNodeKey(nextNodeOptions);
                const nextNodeConfig = nodes.find((nc) => nc.nodeKey === nextNodeKey);
                if (nextNodeConfig === undefined) {
                    new Error(buildConfigErrorMessage(flowKey, `NodeConfig (${nodeKey}): missing next NodeConfig (${nextNodeKey})`));
                }
                break;
            case types_1.NodeType.BOT_EVALUATION:
            case types_1.NodeType.SYSTEM_EVALUATION:
                if (isEndNode && nodeConfig.nextNodeOptions.length !== 0) {
                    new Error(buildConfigErrorMessage(flowKey, `NodeConfig (${nodeKey}): must not have next node options as end node`));
                }
                if (!isEndNode &&
                    typeof nodeConfig.nextNodeOptions !== "string" &&
                    nodeConfig.nextNodeOptions.length !== 1) {
                    new Error(buildConfigErrorMessage(flowKey, `NodeConfig (${nodeKey}): missing next node options`));
                }
                break;
            case types_1.NodeType.BOT_DECISION:
            case types_1.NodeType.SYSTEM_DECISION:
                if (isEndNode) {
                    new Error(buildConfigErrorMessage(flowKey, `NodeConfig (${nodeKey}): must be an evaluation node as end node`));
                }
                if (nodeConfig.nextNodeOptions.length === 0) {
                    new Error(buildConfigErrorMessage(flowKey, `NodeConfig (${nodeKey}): missing next node options`));
                }
                break;
        }
    });
}
function buildInput(flowContent, index, nodeContentByIndex, nodeConfigByNodeKey, memory) {
    const currentContent = nodeContentByIndex.get(index);
    // validate
    if (currentContent === undefined) {
        new Error(buildContentErrorMessage(flowContent, `missing NodeContent (${index})`));
        return {};
    }
    const currentConfig = nodeConfigByNodeKey.get(currentContent.key);
    if (currentConfig === undefined) {
        new Error(buildContentErrorMessage(flowContent, `missing NodeConfig (${currentContent.key})`));
        return {};
    }
    // retrieve
    return currentConfig.inputParams.reduce((acc, param) => {
        var _a;
        const symbolRef = memory.symbolRefs[param];
        if (symbolRef === undefined) {
            // fallback to initial input
            const value = memory.initial[param];
            if (value !== undefined) {
                acc[param] = value;
            }
            return acc;
        }
        const { nodeIndex, path } = symbolRef;
        const inputNode = nodeContentByIndex.get(nodeIndex);
        const input = (_a = inputNode === null || inputNode === void 0 ? void 0 : inputNode.output) !== null && _a !== void 0 ? _a : undefined;
        const value = path.reduce((a, p) => (a === undefined ? undefined : a[p]), input);
        if (value !== undefined) {
            acc[param] = value;
        }
        return acc;
    }, {});
}
class Flow {
    static get(id_1, adapter_1) {
        return __awaiter(this, arguments, void 0, function* (id, adapter, options = {}) {
            const content = yield adapter.getFlow(id);
            validateFlowConfig(content.config);
            const nodeContents = yield adapter.getNodes(id);
            return new Flow(content, nodeContents, adapter, options);
        });
    }
    static create(config_1, initialInput_1, adapter_1) {
        return __awaiter(this, arguments, void 0, function* (config, initialInput, adapter, options = {}) {
            validateFlowConfig(config);
            const content = yield adapter.createFlow(config, {
                initial: initialInput,
                symbolRefs: {},
            });
            return new Flow(content, [], adapter, options);
        });
    }
    constructor(content, nodeContents, adapter, options) {
        this.content = content;
        const nodeConfigByNodeKey = (0, utils_1.toObjectMap)(this.content.config.nodes, (nc) => nc.nodeKey, (nc) => nc);
        const nodeContentByIndex = (0, utils_1.toObjectMap)(nodeContents, (nc) => nc.index, (nc) => nc);
        const { promptBuilders, jsonChatOptions, streamChatOptions, systemEvaluator, } = options;
        this.nodes = nodeContents
            .sort((a, b) => a.index - b.index)
            .filter((nc) => nodeConfigByNodeKey.has(nc.key))
            .map((nc) => {
            const nodeConfig = nodeConfigByNodeKey.get(nc.key);
            const input = buildInput(content, nc.index, nodeContentByIndex, nodeConfigByNodeKey, this.content.memory);
            return new node_1.Node(nodeConfig, nc, input, adapter, promptBuilders !== null && promptBuilders !== void 0 ? promptBuilders : prompts_1.defaultPromptBuilders, systemEvaluator);
        });
        this.adapter = adapter;
        this.jsonChatOptions = jsonChatOptions;
        this.streamChatOptions = streamChatOptions;
        this.promptBuilders = promptBuilders !== null && promptBuilders !== void 0 ? promptBuilders : prompts_1.defaultPromptBuilders;
        this.systemEvaluator = systemEvaluator;
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield this.adapter.deleteNodes(this.content.id);
            yield this.adapter.deleteFlow(this.content.id);
            return count + 1;
        });
    }
    getStatus() {
        if (this.nodes.length === 0) {
            return types_1.FlowStatus.INITIATED;
        }
        const lastNode = this.nodes.at(-1);
        if (lastNode !== undefined &&
            lastNode.config.nodeKey === this.content.config.endNodeKey &&
            lastNode.getStatus() === types_1.NodeStatus.COMPLETED) {
            return types_1.FlowStatus.COMPLETED;
        }
        return types_1.FlowStatus.PROCESSING;
    }
    // start with the start node
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.getStatus() !== types_1.FlowStatus.INITIATED) {
                throw new Error(buildContentErrorMessage(this.content, "already started"));
            }
            return yield this.next(this.content.config.startNodeKey);
        });
    }
    // move forward to the next node
    next(nodeKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodeConfigByNodeKey = (0, utils_1.toObjectMap)(this.content.config.nodes, (nc) => nc.nodeKey, (nc) => nc);
            const nodeConfig = nodeConfigByNodeKey.get(nodeKey);
            if (nodeConfig === undefined) {
                throw new Error(buildContentErrorMessage(this.content, `missing NodeConfig (${nodeKey})`));
            }
            const nodeContents = this.nodes.map((n) => n.content);
            const nodeContent = {
                type: nodeConfig.nodeType,
                key: nodeConfig.nodeKey,
                flowId: this.content.id,
                index: this.nodes.length,
                output: null,
            };
            yield this.adapter.createNode(nodeContent);
            nodeContents.push(nodeContent);
            const nodeContentByIndex = (0, utils_1.toObjectMap)(nodeContents, (nc) => nc.index, (nc) => nc);
            const input = buildInput(this.content, nodeContent.index, nodeContentByIndex, nodeConfigByNodeKey, this.content.memory);
            const node = new node_1.Node(nodeConfig, nodeContent, input, this.adapter, this.promptBuilders, this.systemEvaluator);
            this.nodes.push(node);
            return node;
        });
    }
    updateSymbols(node) {
        return __awaiter(this, void 0, void 0, function* () {
            const { outputParams } = node.config;
            const { index: nodeIndex } = node.content;
            let shouldUpdateMemory = false;
            if (typeof outputParams === "string") {
                this.content.memory.symbolRefs[outputParams] = { nodeIndex, path: [] };
                shouldUpdateMemory = true;
            }
            else if (Array.isArray(outputParams)) {
                outputParams.forEach((p) => {
                    if (typeof p === "string") {
                        this.content.memory.symbolRefs[p] = { nodeIndex, path: [p] };
                        shouldUpdateMemory = true;
                    }
                    else if (typeof p === "object") {
                        const { name, path } = p;
                        const pathParts = Array.isArray(path)
                            ? path
                            : path.split(".").filter((s) => s.length > 0);
                        this.content.memory.symbolRefs[name] = { nodeIndex, path: pathParts };
                        shouldUpdateMemory = true;
                    }
                });
            }
            if (shouldUpdateMemory) {
                yield this.adapter.updateFlow(this.content.id, this.content.memory);
            }
        });
    }
    // run the entire flow continuously until the end or hitting streaming state
    // flow completed normally: return NodeOutput
    // flow awaiting user input: return null and you should call stream() next
    run(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = null;
            do {
                result = yield this.step(options);
            } while (result !== null && this.getStatus() !== types_1.FlowStatus.COMPLETED);
            return result;
        });
    }
    // execute one step of the flow
    // step completed normally: return NodeOutput
    // step awaiting user input: return null and you should call stream() next
    step(options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { userInput, callBefore, callAfter } = options !== null && options !== void 0 ? options : {};
            const currentNode = (_a = this.nodes.at(-1)) !== null && _a !== void 0 ? _a : (yield this.start());
            if (callBefore !== undefined) {
                yield callBefore(currentNode.content);
            }
            const nodeStatus = currentNode.getStatus();
            const { nodeType, nextNodeOptions } = currentNode.config;
            if (nodeStatus === types_1.NodeStatus.INITIATED) {
                switch (nodeType) {
                    case types_1.NodeType.INTERACTION:
                        return null;
                    case types_1.NodeType.BOT_EVALUATION:
                        yield currentNode.botEvaluate(this.jsonChatOptions);
                        break;
                    case types_1.NodeType.SYSTEM_EVALUATION:
                        yield currentNode.systemEvaluate();
                        break;
                    case types_1.NodeType.BOT_DECISION:
                        yield currentNode.botDecide(this.jsonChatOptions);
                        break;
                    case types_1.NodeType.SYSTEM_DECISION:
                        yield currentNode.systemDecide();
                        break;
                    default:
                        throw new Error(buildContentErrorMessage(this.content, `invalid NodeType (${nodeType})`));
                }
            }
            if (nodeStatus === types_1.NodeStatus.PROCESSING) {
                const { index } = currentNode.content;
                if (nodeType !== types_1.NodeType.INTERACTION) {
                    throw new Error(buildContentErrorMessage(this.content, `Node (${index}): invalid NodeType (${nodeType}) for NodeStatus (${nodeStatus})`));
                }
                if (userInput === undefined) {
                    throw new Error(buildContentErrorMessage(this.content, `userInput is not provided`));
                }
                yield currentNode.interactUserInput(userInput);
            }
            // after all nodes are executed, update the symbols
            yield this.updateSymbols(currentNode);
            // now initialize the next node
            switch (nodeType) {
                case types_1.NodeType.INTERACTION:
                    yield this.next(getOnlyNextNodeKey(nextNodeOptions));
                    break;
                case types_1.NodeType.BOT_EVALUATION:
                case types_1.NodeType.SYSTEM_EVALUATION:
                    if (nextNodeOptions.length > 0) {
                        yield this.next(getOnlyNextNodeKey(nextNodeOptions));
                    }
                    break;
                case types_1.NodeType.BOT_DECISION:
                case types_1.NodeType.SYSTEM_DECISION:
                    const { nextNodeKey } = currentNode.content
                        .output;
                    yield this.next(nextNodeKey);
                    break;
                default:
                    throw new Error(buildContentErrorMessage(this.content, `invalid NodeType (${nodeType})`));
            }
            if (callAfter !== undefined) {
                yield callAfter(currentNode.content);
            }
            return currentNode.content.output;
        });
    }
    stream(onStreamDone, streamChatOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentNode = this.nodes.at(-1);
            if (currentNode === undefined) {
                throw new Error(buildContentErrorMessage(this.content, "flow is not in streaming state yet"));
            }
            const { nodeType } = currentNode.config;
            const nodeStatus = currentNode.getStatus();
            if (nodeType !== types_1.NodeType.INTERACTION ||
                nodeStatus !== types_1.NodeStatus.INITIATED) {
                throw new Error(buildContentErrorMessage(this.content, `flow is not in streaming state (${nodeStatus})`));
            }
            const messages = this.nodes
                .filter((n) => n.getStatus() !== types_1.NodeStatus.INITIATED)
                .map((n) => n.content)
                .filter((nc) => nc.type === types_1.NodeType.INTERACTION)
                .filter((nc) => nc.output !== null)
                .map((nc) => nc.output)
                .flatMap((output) => [
                ...(output.botStreamed !== undefined
                    ? [{ role: "BOT", content: output.botStreamed }]
                    : []),
                ...(output.userInput !== undefined
                    ? [{ role: "USER", content: output.userInput }]
                    : []),
            ]);
            return yield currentNode.interactBotStream(messages, onStreamDone, streamChatOptions);
        });
    }
}
exports.Flow = Flow;
//# sourceMappingURL=flow.js.map