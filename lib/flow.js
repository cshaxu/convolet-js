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
function throwError(flowKey, message) {
    throw new Error("FlowConfig (".concat(flowKey, "): ").concat(message));
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
        throwError(flowKey, "missing start node config (".concat(startNodeKey, ")"));
    }
    // validate end node config
    var endNodeConfig = nodes.find(function (nc) { return nc.nodeKey === endNodeKey; });
    if (endNodeConfig === undefined) {
        throwError(flowKey, "missing end NodeConfig (".concat(endNodeKey, ")"));
    }
    nodes.forEach(function (nodeConfig) {
        var nodeType = nodeConfig.nodeType, nodeKey = nodeConfig.nodeKey, nextNodeOptions = nodeConfig.nextNodeOptions;
        var isEndNode = nodeKey === endNodeKey;
        if (typeof nextNodeOptions === "string") {
            if (nextNodeOptions.length > 0) {
                var nextNodeConfig = nodes.find(function (nc) { return nc.nodeKey === nextNodeOptions; });
                if (nextNodeConfig === undefined) {
                    throwError(flowKey, "NodeConfig (".concat(nodeKey, "): missing next NodeConfig (").concat(nextNodeOptions, ")"));
                }
            }
        }
        else {
            nextNodeOptions.forEach(function (nno) {
                var nextNodeKey = typeof nno === "string" ? nno : nno.nodeKey;
                var nextNodeConfig = nodes.find(function (nc) { return nc.nodeKey === nextNodeKey; });
                if (nextNodeConfig === undefined) {
                    throwError(flowKey, "NodeConfig (".concat(nodeKey, "): missing input NodeConfig (").concat(nextNodeKey, ")"));
                }
            });
        }
        switch (nodeType) {
            case types_1.NodeType.INTERACTION:
                if (isEndNode) {
                    throwError(flowKey, "NodeConfig (".concat(nodeKey, "): must be an evaluation node as end node"));
                }
                if (typeof nextNodeOptions !== "string" &&
                    nextNodeOptions.length !== 1) {
                    throwError(flowKey, "NodeConfig (".concat(nodeKey, "): must have exactly one next node option"));
                }
                var nextNodeKey_1 = getOnlyNextNodeKey(nextNodeOptions);
                var nextNodeConfig = nodes.find(function (nc) { return nc.nodeKey === nextNodeKey_1; });
                if (nextNodeConfig === undefined) {
                    throwError(flowKey, "NodeConfig (".concat(nodeKey, "): missing next NodeConfig (").concat(nextNodeKey_1, ")"));
                }
                break;
            case types_1.NodeType.BOT_EVALUATION:
            case types_1.NodeType.SYSTEM_EVALUATION:
                if (isEndNode && nodeConfig.nextNodeOptions.length !== 0) {
                    throwError(flowKey, "NodeConfig (".concat(nodeKey, "): must not have next node options as end node"));
                }
                if (!isEndNode &&
                    typeof nodeConfig.nextNodeOptions !== "string" &&
                    nodeConfig.nextNodeOptions.length !== 1) {
                    throwError(flowKey, "NodeConfig (".concat(nodeKey, "): missing next node options"));
                }
                break;
            case types_1.NodeType.BOT_DECISION:
            case types_1.NodeType.SYSTEM_DECISION:
                if (isEndNode) {
                    throwError(flowKey, "NodeConfig (".concat(nodeKey, "): must be an evaluation node as end node"));
                }
                if (nodeConfig.nextNodeOptions.length === 0) {
                    throwError(flowKey, "NodeConfig (".concat(nodeKey, "): missing next node options"));
                }
                break;
        }
    });
}
function buildInput(flowId, index, nodeContentByIndex, nodeConfigByNodeKey, memory) {
    var currentContent = nodeContentByIndex.get(index);
    // validate
    if (currentContent === undefined) {
        throwError(flowId, "missing current node content for index (".concat(index, ")"));
        return {};
    }
    var currentConfig = nodeConfigByNodeKey.get(currentContent.key);
    if (currentConfig === undefined) {
        throwError(flowId, "missing current node config for key (".concat(currentContent.key, ")"));
        return {};
    }
    return currentConfig.inputParams.reduce(function (acc, param) {
        var _a;
        if (param === "initial" && memory.initial !== null) {
            acc[param] = memory.initial;
            // this can be overwritten so we are not returning here
        }
        var symbolRef = memory.symbolRefs[param];
        if (symbolRef === undefined) {
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
    function Flow(content, nodeContents, executor, adapter) {
        var _this = this;
        this.content = content;
        var nodeConfigByNodeKey = (0, utils_1.toObjectMap)(this.content.config.nodes, function (nc) { return nc.nodeKey; }, function (nc) { return nc; });
        var nodeContentByIndex = (0, utils_1.toObjectMap)(nodeContents, function (nc) { return nc.index; }, function (nc) { return nc; });
        this.nodes = nodeContents
            .sort(function (a, b) { return a.index - b.index; })
            .filter(function (nc) { return nodeConfigByNodeKey.has(nc.key); })
            .map(function (nc) {
            var nodeConfig = nodeConfigByNodeKey.get(nc.key);
            var input = buildInput(nc.flowId, nc.index, nodeContentByIndex, nodeConfigByNodeKey, _this.content.memory);
            return new node_1.Node(nodeConfig, nc, input, executor, adapter);
        });
        this.executor = executor;
        this.adapter = adapter;
    }
    Flow.get = function (id, executor, adapter) {
        return __awaiter(this, void 0, void 0, function () {
            var content, nodeContents;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, adapter.getFlow(id)];
                    case 1:
                        content = _a.sent();
                        validateFlowConfig(content.config);
                        return [4 /*yield*/, adapter.getNodes(id)];
                    case 2:
                        nodeContents = _a.sent();
                        return [2 /*return*/, new Flow(content, nodeContents, executor, adapter)];
                }
            });
        });
    };
    Flow.create = function (config, initialInput, executor, adapter) {
        return __awaiter(this, void 0, void 0, function () {
            var content;
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
                        return [2 /*return*/, new Flow(content, [], executor, adapter)];
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
                            throw new Error("Flow (".concat(this.content.id, "): already started"));
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
                            throw new Error("Flow (".concat(this.content.id, "): missing NodeConfig (").concat(nodeKey, ")"));
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
                        input = buildInput(nodeContent.flowId, nodeContent.index, nodeContentByIndex, nodeConfigByNodeKey, this.content.memory);
                        node = new node_1.Node(nodeConfig, nodeContent, input, this.executor, this.adapter);
                        this.nodes.push(node);
                        return [2 /*return*/, node];
                }
            });
        });
    };
    Flow.prototype.updateSymbols = function (node) {
        return __awaiter(this, void 0, void 0, function () {
            var outputParams;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        outputParams = node.config.outputParams;
                        if (typeof outputParams === "string") {
                            this.content.memory.symbolRefs[outputParams] = {
                                nodeIndex: node.content.index,
                                path: [],
                            };
                        }
                        else if (Array.isArray(outputParams)) {
                            outputParams.forEach(function (p) {
                                if (typeof p === "string") {
                                    _this.content.memory.symbolRefs[p] = {
                                        nodeIndex: node.content.index,
                                        path: [p],
                                    };
                                }
                                else if (typeof p === "object") {
                                    var name_1 = p.name, path = p.path;
                                    var pathParts = Array.isArray(path)
                                        ? path
                                        : path.split(".").filter(function (s) { return s.length > 0; });
                                    _this.content.memory.symbolRefs[name_1] = {
                                        nodeIndex: node.content.index,
                                        path: pathParts,
                                    };
                                }
                            });
                        }
                        return [4 /*yield*/, this.adapter.updateFlow(this.content.id, this.content.memory)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // run the flow by executing nodes one by one until the one that requires user input or the end nodes
    Flow.prototype.run = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var userInput, streamChatOptions, jsonChatOptions, currentNode, _a, nodeConfig, nodeType, nextNodeOptions, nodeStatus, _b, _c, messages, _d, _e, _f, nextNodeKey, _g, nextNodeKey;
            var _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        userInput = params.userInput, streamChatOptions = params.streamChatOptions, jsonChatOptions = params.jsonChatOptions;
                        if (!((_h = this.nodes.at(-1)) !== null && _h !== void 0)) return [3 /*break*/, 1];
                        _a = _h;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.start()];
                    case 2:
                        _a = (_j.sent());
                        _j.label = 3;
                    case 3:
                        currentNode = _a;
                        _j.label = 4;
                    case 4:
                        nodeConfig = currentNode.config;
                        nodeType = nodeConfig.nodeType, nextNodeOptions = nodeConfig.nextNodeOptions;
                        nodeStatus = currentNode.getStatus();
                        _b = nodeType;
                        switch (_b) {
                            case types_1.NodeType.INTERACTION: return [3 /*break*/, 5];
                            case types_1.NodeType.BOT_EVALUATION: return [3 /*break*/, 15];
                            case types_1.NodeType.SYSTEM_EVALUATION: return [3 /*break*/, 23];
                            case types_1.NodeType.BOT_DECISION: return [3 /*break*/, 31];
                            case types_1.NodeType.SYSTEM_DECISION: return [3 /*break*/, 39];
                        }
                        return [3 /*break*/, 47];
                    case 5:
                        _c = nodeStatus;
                        switch (_c) {
                            case types_1.NodeStatus.INITIATED: return [3 /*break*/, 6];
                            case types_1.NodeStatus.PROCESSING: return [3 /*break*/, 8];
                            case types_1.NodeStatus.COMPLETED: return [3 /*break*/, 11];
                        }
                        return [3 /*break*/, 13];
                    case 6:
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
                        return [4 /*yield*/, currentNode.interactBotStream(messages, streamChatOptions)];
                    case 7: return [2 /*return*/, _j.sent()];
                    case 8: return [4 /*yield*/, currentNode.interactUserInput(userInput !== null && userInput !== void 0 ? userInput : "userInput is not provided")];
                    case 9:
                        _j.sent();
                        return [4 /*yield*/, this.updateSymbols(currentNode)];
                    case 10:
                        _j.sent();
                        return [3 /*break*/, 14];
                    case 11: return [4 /*yield*/, this.next(getOnlyNextNodeKey(nextNodeOptions))];
                    case 12:
                        currentNode = _j.sent();
                        return [3 /*break*/, 14];
                    case 13: throw new Error("Flow (".concat(this.content.id, "): invalid node status (").concat(nodeStatus, ")"));
                    case 14: return [3 /*break*/, 48];
                    case 15:
                        _d = nodeStatus;
                        switch (_d) {
                            case types_1.NodeStatus.INITIATED: return [3 /*break*/, 16];
                            case types_1.NodeStatus.COMPLETED: return [3 /*break*/, 19];
                        }
                        return [3 /*break*/, 21];
                    case 16: return [4 /*yield*/, currentNode.botEvaluate(jsonChatOptions)];
                    case 17:
                        _j.sent();
                        return [4 /*yield*/, this.updateSymbols(currentNode)];
                    case 18:
                        _j.sent();
                        return [3 /*break*/, 22];
                    case 19:
                        if (nodeConfig.nextNodeOptions.length === 0) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, this.next(getOnlyNextNodeKey(nextNodeOptions))];
                    case 20:
                        currentNode = _j.sent();
                        return [3 /*break*/, 22];
                    case 21: throw new Error("Flow (".concat(this.content.id, "): invalid node status (").concat(nodeStatus, ")"));
                    case 22: return [3 /*break*/, 48];
                    case 23:
                        _e = nodeStatus;
                        switch (_e) {
                            case types_1.NodeStatus.INITIATED: return [3 /*break*/, 24];
                            case types_1.NodeStatus.COMPLETED: return [3 /*break*/, 27];
                        }
                        return [3 /*break*/, 29];
                    case 24: return [4 /*yield*/, currentNode.systemEvaluate()];
                    case 25:
                        _j.sent();
                        return [4 /*yield*/, this.updateSymbols(currentNode)];
                    case 26:
                        _j.sent();
                        return [3 /*break*/, 30];
                    case 27:
                        if (nodeConfig.nextNodeOptions.length === 0) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, this.next(getOnlyNextNodeKey(nextNodeOptions))];
                    case 28:
                        currentNode = _j.sent();
                        return [3 /*break*/, 30];
                    case 29: throw new Error("Flow (".concat(this.content.id, "): invalid node status (").concat(nodeStatus, ")"));
                    case 30: return [3 /*break*/, 48];
                    case 31:
                        _f = nodeStatus;
                        switch (_f) {
                            case types_1.NodeStatus.INITIATED: return [3 /*break*/, 32];
                            case types_1.NodeStatus.COMPLETED: return [3 /*break*/, 35];
                        }
                        return [3 /*break*/, 37];
                    case 32: return [4 /*yield*/, currentNode.botDecide(jsonChatOptions)];
                    case 33:
                        _j.sent();
                        return [4 /*yield*/, this.updateSymbols(currentNode)];
                    case 34:
                        _j.sent();
                        return [3 /*break*/, 38];
                    case 35:
                        nextNodeKey = currentNode.content
                            .output.nextNodeKey;
                        return [4 /*yield*/, this.next(nextNodeKey)];
                    case 36:
                        currentNode = _j.sent();
                        return [3 /*break*/, 38];
                    case 37: throw new Error("Flow (".concat(this.content.id, "): invalid node status (").concat(nodeStatus, ")"));
                    case 38: return [3 /*break*/, 48];
                    case 39:
                        _g = nodeStatus;
                        switch (_g) {
                            case types_1.NodeStatus.INITIATED: return [3 /*break*/, 40];
                            case types_1.NodeStatus.COMPLETED: return [3 /*break*/, 43];
                        }
                        return [3 /*break*/, 45];
                    case 40: return [4 /*yield*/, currentNode.systemDecide()];
                    case 41:
                        _j.sent();
                        return [4 /*yield*/, this.updateSymbols(currentNode)];
                    case 42:
                        _j.sent();
                        return [3 /*break*/, 46];
                    case 43:
                        nextNodeKey = currentNode.content
                            .output.nextNodeKey;
                        return [4 /*yield*/, this.next(nextNodeKey)];
                    case 44:
                        currentNode = _j.sent();
                        return [3 /*break*/, 46];
                    case 45: throw new Error("Flow (".concat(this.content.id, "): invalid node status (").concat(nodeStatus, ")"));
                    case 46: return [3 /*break*/, 48];
                    case 47: throw new Error("Flow (".concat(this.content.id, "): invalid node type (").concat(nodeType, ")"));
                    case 48:
                        if (true) return [3 /*break*/, 4];
                        _j.label = 49;
                    case 49: return [2 /*return*/];
                }
            });
        });
    };
    return Flow;
}());
exports.Flow = Flow;
//# sourceMappingURL=flow.js.map