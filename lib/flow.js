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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
exports.Flow = void 0;
var node_1 = require("./node");
var prompts_1 = require("./prompts");
var types_1 = require("./types");
var utils_1 = require("./utils");
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
    return "FlowConfig (".concat(flowKey, "): ").concat(message);
}
function buildContentErrorMessage(content, message) {
    var objectId = [content.key, content.id].join("-");
    return "Flow (".concat(objectId, "): ").concat(message);
}
function getOnlyNextNodeKey(nextNodeOptions) {
    return typeof nextNodeOptions === "string"
        ? nextNodeOptions
        : typeof nextNodeOptions[0] === "string"
            ? nextNodeOptions[0]
            : nextNodeOptions[0].nodeKey;
}
function validateFlowConfig(flowConfig) {
    var flowKey = flowConfig.flowKey, nodes = flowConfig.nodes, startNodeKey = flowConfig.startNodeKey, endNodeKey = flowConfig.endNodeKey;
    // validate start node config
    var startNodeConfig = nodes.find(function (nc) { return nc.nodeKey === startNodeKey; });
    if (startNodeConfig === undefined) {
        new Error(buildConfigErrorMessage(flowKey, "missing start node config (".concat(startNodeKey, ")")));
    }
    // validate end node config
    var endNodeConfig = nodes.find(function (nc) { return nc.nodeKey === endNodeKey; });
    if (endNodeConfig === undefined) {
        new Error(buildConfigErrorMessage(flowKey, "missing end NodeConfig (".concat(endNodeKey, ")")));
    }
    nodes.forEach(function (nodeConfig) {
        var nodeType = nodeConfig.nodeType, nodeKey = nodeConfig.nodeKey, nextNodeOptions = nodeConfig.nextNodeOptions;
        var isEndNode = nodeKey === endNodeKey;
        if (typeof nextNodeOptions === "string") {
            if (nextNodeOptions.length > 0) {
                var nextNodeConfig = nodes.find(function (nc) { return nc.nodeKey === nextNodeOptions; });
                if (nextNodeConfig === undefined) {
                    new Error(buildConfigErrorMessage(flowKey, "NodeConfig (".concat(nodeKey, "): missing next NodeConfig (").concat(nextNodeOptions, ")")));
                }
            }
        }
        else {
            nextNodeOptions.forEach(function (nno) {
                var nextNodeKey = typeof nno === "string" ? nno : nno.nodeKey;
                var nextNodeConfig = nodes.find(function (nc) { return nc.nodeKey === nextNodeKey; });
                if (nextNodeConfig === undefined) {
                    new Error(buildConfigErrorMessage(flowKey, "NodeConfig (".concat(nodeKey, "): missing input NodeConfig (").concat(nextNodeKey, ")")));
                }
            });
        }
        switch (nodeType) {
            case types_1.NodeType.INTERACTION:
                if (isEndNode) {
                    new Error(buildConfigErrorMessage(flowKey, "NodeConfig (".concat(nodeKey, "): must be an evaluation node as end node")));
                }
                if (typeof nextNodeOptions !== "string" &&
                    nextNodeOptions.length !== 1) {
                    new Error(buildConfigErrorMessage(flowKey, "NodeConfig (".concat(nodeKey, "): must have exactly one next node option")));
                }
                var nextNodeKey_1 = getOnlyNextNodeKey(nextNodeOptions);
                var nextNodeConfig = nodes.find(function (nc) { return nc.nodeKey === nextNodeKey_1; });
                if (nextNodeConfig === undefined) {
                    new Error(buildConfigErrorMessage(flowKey, "NodeConfig (".concat(nodeKey, "): missing next NodeConfig (").concat(nextNodeKey_1, ")")));
                }
                break;
            case types_1.NodeType.BOT_EVALUATION:
            case types_1.NodeType.SYSTEM_EVALUATION:
                if (isEndNode && nodeConfig.nextNodeOptions.length !== 0) {
                    new Error(buildConfigErrorMessage(flowKey, "NodeConfig (".concat(nodeKey, "): must not have next node options as end node")));
                }
                if (!isEndNode &&
                    typeof nodeConfig.nextNodeOptions !== "string" &&
                    nodeConfig.nextNodeOptions.length !== 1) {
                    new Error(buildConfigErrorMessage(flowKey, "NodeConfig (".concat(nodeKey, "): missing next node options")));
                }
                break;
            case types_1.NodeType.BOT_DECISION:
            case types_1.NodeType.SYSTEM_DECISION:
                if (isEndNode) {
                    new Error(buildConfigErrorMessage(flowKey, "NodeConfig (".concat(nodeKey, "): must be an evaluation node as end node")));
                }
                if (nodeConfig.nextNodeOptions.length === 0) {
                    new Error(buildConfigErrorMessage(flowKey, "NodeConfig (".concat(nodeKey, "): missing next node options")));
                }
                break;
        }
    });
}
function buildInput(flowContent, index, nodeContentByIndex, nodeConfigByNodeKey, memory) {
    var currentContent = nodeContentByIndex.get(index);
    // validate
    if (currentContent === undefined) {
        new Error(buildContentErrorMessage(flowContent, "missing NodeContent (".concat(index, ")")));
        return {};
    }
    var currentConfig = nodeConfigByNodeKey.get(currentContent.key);
    if (currentConfig === undefined) {
        new Error(buildContentErrorMessage(flowContent, "missing NodeConfig (".concat(currentContent.key, ")")));
        return {};
    }
    // retrieve
    return currentConfig.inputParams.reduce(function (acc, param) {
        var _a;
        var symbolRef = memory.symbolRefs[param];
        if (symbolRef === undefined) {
            // fallback to initial input
            var value_1 = memory.initial[param];
            if (value_1 !== undefined) {
                acc[param] = value_1;
            }
            return acc;
        }
        var nodeIndex = symbolRef.nodeIndex, path = symbolRef.path;
        var inputNode = nodeContentByIndex.get(nodeIndex);
        var input = (_a = inputNode === null || inputNode === void 0 ? void 0 : inputNode.output) !== null && _a !== void 0 ? _a : undefined;
        var value = path.reduce(function (a, p) { return (a === undefined ? undefined : a[p]); }, input);
        if (value !== undefined) {
            acc[param] = value;
        }
        return acc;
    }, {});
}
var Flow = /** @class */ (function () {
    function Flow(content, nodeContents, adapter, options) {
        var _this = this;
        this.content = content;
        var nodeConfigByNodeKey = (0, utils_1.toObjectMap)(this.content.config.nodes, function (nc) { return nc.nodeKey; }, function (nc) { return nc; });
        var nodeContentByIndex = (0, utils_1.toObjectMap)(nodeContents, function (nc) { return nc.index; }, function (nc) { return nc; });
        var promptBuilders = options.promptBuilders, jsonChatOptions = options.jsonChatOptions, streamChatOptions = options.streamChatOptions, systemEvaluator = options.systemEvaluator;
        this.nodes = nodeContents
            .sort(function (a, b) { return a.index - b.index; })
            .filter(function (nc) { return nodeConfigByNodeKey.has(nc.key); })
            .map(function (nc) {
            var nodeConfig = nodeConfigByNodeKey.get(nc.key);
            var input = buildInput(content, nc.index, nodeContentByIndex, nodeConfigByNodeKey, _this.content.memory);
            return new node_1.Node(nodeConfig, nc, input, adapter, promptBuilders !== null && promptBuilders !== void 0 ? promptBuilders : prompts_1.defaultPromptBuilders, systemEvaluator);
        });
        this.adapter = adapter;
        this.jsonChatOptions = jsonChatOptions;
        this.streamChatOptions = streamChatOptions;
        this.promptBuilders = promptBuilders !== null && promptBuilders !== void 0 ? promptBuilders : prompts_1.defaultPromptBuilders;
        this.systemEvaluator = systemEvaluator;
    }
    Flow.get = function (id_1, adapter_1) {
        return __awaiter(this, arguments, void 0, function (id, adapter, options) {
            var content, nodeContents;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, adapter.getFlow(id)];
                    case 1:
                        content = _a.sent();
                        validateFlowConfig(content.config);
                        return [4 /*yield*/, adapter.getNodes(id)];
                    case 2:
                        nodeContents = _a.sent();
                        return [2 /*return*/, new Flow(content, nodeContents, adapter, options)];
                }
            });
        });
    };
    Flow.create = function (config_1, initialInput_1, adapter_1) {
        return __awaiter(this, arguments, void 0, function (config, initialInput, adapter, options) {
            var content;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validateFlowConfig(config);
                        return [4 /*yield*/, adapter.createFlow(config, {
                                initial: initialInput,
                                symbolRefs: {},
                            })];
                    case 1:
                        content = _a.sent();
                        return [2 /*return*/, new Flow(content, [], adapter, options)];
                }
            });
        });
    };
    Flow.prototype.delete = function () {
        return __awaiter(this, void 0, void 0, function () {
            var count;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.adapter.deleteNodes(this.content.id)];
                    case 1:
                        count = _a.sent();
                        return [4 /*yield*/, this.adapter.deleteFlow(this.content.id)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, count + 1];
                }
            });
        });
    };
    Flow.prototype.getStatus = function () {
        if (this.nodes.length === 0) {
            return types_1.FlowStatus.INITIATED;
        }
        var lastNode = this.nodes.at(-1);
        if (lastNode !== undefined &&
            lastNode.config.nodeKey === this.content.config.endNodeKey &&
            lastNode.getStatus() === types_1.NodeStatus.COMPLETED) {
            return types_1.FlowStatus.COMPLETED;
        }
        return types_1.FlowStatus.PROCESSING;
    };
    // start with the start node
    Flow.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.getStatus() !== types_1.FlowStatus.INITIATED) {
                            throw new Error(buildContentErrorMessage(this.content, "already started"));
                        }
                        return [4 /*yield*/, this.next(this.content.config.startNodeKey)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // move forward to the next node
    Flow.prototype.next = function (nodeKey) {
        return __awaiter(this, void 0, void 0, function () {
            var nodeConfigByNodeKey, nodeConfig, nodeContents, nodeContent, nodeContentByIndex, input, node;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nodeConfigByNodeKey = (0, utils_1.toObjectMap)(this.content.config.nodes, function (nc) { return nc.nodeKey; }, function (nc) { return nc; });
                        nodeConfig = nodeConfigByNodeKey.get(nodeKey);
                        if (nodeConfig === undefined) {
                            throw new Error(buildContentErrorMessage(this.content, "missing NodeConfig (".concat(nodeKey, ")")));
                        }
                        nodeContents = this.nodes.map(function (n) { return n.content; });
                        nodeContent = {
                            type: nodeConfig.nodeType,
                            key: nodeConfig.nodeKey,
                            flowId: this.content.id,
                            index: this.nodes.length,
                            output: null,
                        };
                        return [4 /*yield*/, this.adapter.createNode(nodeContent)];
                    case 1:
                        _a.sent();
                        nodeContents.push(nodeContent);
                        nodeContentByIndex = (0, utils_1.toObjectMap)(nodeContents, function (nc) { return nc.index; }, function (nc) { return nc; });
                        input = buildInput(this.content, nodeContent.index, nodeContentByIndex, nodeConfigByNodeKey, this.content.memory);
                        node = new node_1.Node(nodeConfig, nodeContent, input, this.adapter, this.promptBuilders, this.systemEvaluator);
                        this.nodes.push(node);
                        return [2 /*return*/, node];
                }
            });
        });
    };
    Flow.prototype.updateSymbols = function (node) {
        return __awaiter(this, void 0, void 0, function () {
            var outputParams, nodeIndex, shouldUpdateMemory;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        outputParams = node.config.outputParams;
                        nodeIndex = node.content.index;
                        shouldUpdateMemory = false;
                        if (typeof outputParams === "string") {
                            this.content.memory.symbolRefs[outputParams] = { nodeIndex: nodeIndex, path: [] };
                            shouldUpdateMemory = true;
                        }
                        else if (Array.isArray(outputParams)) {
                            outputParams.forEach(function (p) {
                                if (typeof p === "string") {
                                    _this.content.memory.symbolRefs[p] = { nodeIndex: nodeIndex, path: [p] };
                                    shouldUpdateMemory = true;
                                }
                                else if (typeof p === "object") {
                                    var name_1 = p.name, path = p.path;
                                    var pathParts = Array.isArray(path)
                                        ? path
                                        : path.split(".").filter(function (s) { return s.length > 0; });
                                    _this.content.memory.symbolRefs[name_1] = { nodeIndex: nodeIndex, path: pathParts };
                                    shouldUpdateMemory = true;
                                }
                            });
                        }
                        if (!shouldUpdateMemory) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.adapter.updateFlow(this.content.id, this.content.memory)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    // run the entire flow continuously until the end or hitting streaming state
    // flow completed normally: return NodeOutput
    // flow awaiting user input: return null and you should call stream() next
    Flow.prototype.run = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = null;
                        _a.label = 1;
                    case 1: return [4 /*yield*/, this.step(options)];
                    case 2:
                        result = _a.sent();
                        _a.label = 3;
                    case 3:
                        if (result !== null && this.getStatus() !== types_1.FlowStatus.COMPLETED) return [3 /*break*/, 1];
                        _a.label = 4;
                    case 4: return [2 /*return*/, result];
                }
            });
        });
    };
    // execute one step of the flow
    // step completed normally: return NodeOutput
    // step awaiting user input: return null and you should call stream() next
    Flow.prototype.step = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, userInput, callBefore, callAfter, currentNode, _b, nodeStatus, _c, nodeType, nextNodeOptions, _d, index, _e, nextNodeKey;
            var _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _a = options !== null && options !== void 0 ? options : {}, userInput = _a.userInput, callBefore = _a.callBefore, callAfter = _a.callAfter;
                        if (!((_f = this.nodes.at(-1)) !== null && _f !== void 0)) return [3 /*break*/, 1];
                        _b = _f;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.start()];
                    case 2:
                        _b = (_g.sent());
                        _g.label = 3;
                    case 3:
                        currentNode = _b;
                        if (!(callBefore !== undefined)) return [3 /*break*/, 5];
                        return [4 /*yield*/, callBefore(currentNode.content)];
                    case 4:
                        _g.sent();
                        _g.label = 5;
                    case 5:
                        nodeStatus = currentNode.getStatus();
                        _c = currentNode.config, nodeType = _c.nodeType, nextNodeOptions = _c.nextNodeOptions;
                        if (!(nodeStatus === types_1.NodeStatus.INITIATED)) return [3 /*break*/, 16];
                        _d = nodeType;
                        switch (_d) {
                            case types_1.NodeType.INTERACTION: return [3 /*break*/, 6];
                            case types_1.NodeType.BOT_EVALUATION: return [3 /*break*/, 7];
                            case types_1.NodeType.SYSTEM_EVALUATION: return [3 /*break*/, 9];
                            case types_1.NodeType.BOT_DECISION: return [3 /*break*/, 11];
                            case types_1.NodeType.SYSTEM_DECISION: return [3 /*break*/, 13];
                        }
                        return [3 /*break*/, 15];
                    case 6: return [2 /*return*/, null];
                    case 7: return [4 /*yield*/, currentNode.botEvaluate(this.jsonChatOptions)];
                    case 8:
                        _g.sent();
                        return [3 /*break*/, 16];
                    case 9: return [4 /*yield*/, currentNode.systemEvaluate()];
                    case 10:
                        _g.sent();
                        return [3 /*break*/, 16];
                    case 11: return [4 /*yield*/, currentNode.botDecide(this.jsonChatOptions)];
                    case 12:
                        _g.sent();
                        return [3 /*break*/, 16];
                    case 13: return [4 /*yield*/, currentNode.systemDecide()];
                    case 14:
                        _g.sent();
                        return [3 /*break*/, 16];
                    case 15: throw new Error(buildContentErrorMessage(this.content, "invalid NodeType (".concat(nodeType, ")")));
                    case 16:
                        if (!(nodeStatus === types_1.NodeStatus.PROCESSING)) return [3 /*break*/, 18];
                        index = currentNode.content.index;
                        if (nodeType !== types_1.NodeType.INTERACTION) {
                            throw new Error(buildContentErrorMessage(this.content, "Node (".concat(index, "): invalid NodeType (").concat(nodeType, ") for NodeStatus (").concat(nodeStatus, ")")));
                        }
                        if (userInput === undefined) {
                            throw new Error(buildContentErrorMessage(this.content, "userInput is not provided"));
                        }
                        return [4 /*yield*/, currentNode.interactUserInput(userInput)];
                    case 17:
                        _g.sent();
                        _g.label = 18;
                    case 18: 
                    // after all nodes are executed, update the symbols
                    return [4 /*yield*/, this.updateSymbols(currentNode)];
                    case 19:
                        // after all nodes are executed, update the symbols
                        _g.sent();
                        _e = nodeType;
                        switch (_e) {
                            case types_1.NodeType.INTERACTION: return [3 /*break*/, 20];
                            case types_1.NodeType.BOT_EVALUATION: return [3 /*break*/, 22];
                            case types_1.NodeType.SYSTEM_EVALUATION: return [3 /*break*/, 22];
                            case types_1.NodeType.BOT_DECISION: return [3 /*break*/, 25];
                            case types_1.NodeType.SYSTEM_DECISION: return [3 /*break*/, 25];
                        }
                        return [3 /*break*/, 27];
                    case 20: return [4 /*yield*/, this.next(getOnlyNextNodeKey(nextNodeOptions))];
                    case 21:
                        _g.sent();
                        return [3 /*break*/, 28];
                    case 22:
                        if (!(nextNodeOptions.length > 0)) return [3 /*break*/, 24];
                        return [4 /*yield*/, this.next(getOnlyNextNodeKey(nextNodeOptions))];
                    case 23:
                        _g.sent();
                        _g.label = 24;
                    case 24: return [3 /*break*/, 28];
                    case 25:
                        nextNodeKey = currentNode.content
                            .output.nextNodeKey;
                        return [4 /*yield*/, this.next(nextNodeKey)];
                    case 26:
                        _g.sent();
                        return [3 /*break*/, 28];
                    case 27: throw new Error(buildContentErrorMessage(this.content, "invalid NodeType (".concat(nodeType, ")")));
                    case 28:
                        if (!(callAfter !== undefined)) return [3 /*break*/, 30];
                        return [4 /*yield*/, callAfter(currentNode.content)];
                    case 29:
                        _g.sent();
                        _g.label = 30;
                    case 30: return [2 /*return*/, currentNode.content.output];
                }
            });
        });
    };
    Flow.prototype.stream = function (onStreamDone, streamChatOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var currentNode, nodeType, nodeStatus, messages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        currentNode = this.nodes.at(-1);
                        if (currentNode === undefined) {
                            throw new Error(buildContentErrorMessage(this.content, "flow is not in streaming state yet"));
                        }
                        nodeType = currentNode.config.nodeType;
                        nodeStatus = currentNode.getStatus();
                        if (nodeType !== types_1.NodeType.INTERACTION ||
                            nodeStatus !== types_1.NodeStatus.INITIATED) {
                            throw new Error(buildContentErrorMessage(this.content, "flow is not in streaming state (".concat(nodeStatus, ")")));
                        }
                        messages = this.nodes
                            .filter(function (n) { return n.getStatus() !== types_1.NodeStatus.INITIATED; })
                            .map(function (n) { return n.content; })
                            .filter(function (nc) { return nc.type === types_1.NodeType.INTERACTION; })
                            .filter(function (nc) { return nc.output !== null; })
                            .map(function (nc) { return nc.output; })
                            .flatMap(function (output) { return __spreadArray(__spreadArray([], (output.botStreamed !== undefined
                            ? [{ role: "BOT", content: output.botStreamed }]
                            : []), true), (output.userInput !== undefined
                            ? [{ role: "USER", content: output.userInput }]
                            : []), true); });
                        return [4 /*yield*/, currentNode.interactBotStream(messages, onStreamDone, streamChatOptions)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return Flow;
}());
exports.Flow = Flow;
//# sourceMappingURL=flow.js.map