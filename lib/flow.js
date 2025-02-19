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
// - execution node is to evaluate the previous out to generate json, and optionally run executor to build output
// - start node can be either interaction node or execution node
// - end node must be an execution node
// - end node has no next node options
// - non-end nodes have next node options
// - interaction node must forward to exactly one execution node
// - execution node can forward to either interaction node or execution node
function throwError(flowKey, message) {
    throw new Error("FlowConfig (".concat(flowKey, "): ").concat(message));
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
        switch (nodeType) {
            case types_1.NodeType.INTERACTION:
                if (isEndNode) {
                    throwError(flowKey, "NodeConfig (".concat(nodeKey, "): must be an execution node as end node"));
                }
                if (nextNodeOptions.length !== 1) {
                    throwError(flowKey, "NodeConfig (".concat(nodeKey, "): must have exactly one next node option"));
                }
                var nextNodeKey_1 = nextNodeOptions[0].nodeKey;
                var nextNodeConfig = nodes.find(function (nc) { return nc.nodeKey === nextNodeKey_1; });
                if (nextNodeConfig === undefined) {
                    throwError(flowKey, "NodeConfig (".concat(nodeKey, "): missing next NodeConfig (").concat(nextNodeKey_1, ")"));
                }
                else if (nextNodeConfig.nodeType !== types_1.NodeType.EXECUTION) {
                    throwError(flowKey, "NodeConfig (".concat(nodeKey, "): next NodeConfig (").concat(nextNodeKey_1, "): must be an execution node"));
                }
                break;
            case types_1.NodeType.EXECUTION:
                if (isEndNode && nextNodeOptions.length > 0) {
                    throwError(flowKey, "NodeConfig (".concat(nodeKey, "): unexpected next node options as end node"));
                }
                if (!isEndNode && nextNodeOptions.length === 0) {
                    throwError(flowKey, "NodeConfig (".concat(nodeKey, "): missing next node options"));
                }
                break;
        }
    });
}
var Flow = /** @class */ (function () {
    function Flow(content, nodeContents, executor, adapter) {
        this.content = content;
        var nodeConfigByNodeKey = (0, utils_1.toObjectMap)(this.content.config.nodes, function (nc) { return nc.nodeKey; }, function (nc) { return nc; });
        this.nodes = nodeContents
            .sort(function (a, b) { return a.index - b.index; })
            .filter(function (nc) { return nodeConfigByNodeKey.has(nc.key); })
            .map(function (nc) {
            return new node_1.Node(nodeConfigByNodeKey.get(nc.key), nc, executor, adapter);
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
    Flow.create = function (config, executor, adapter) {
        return __awaiter(this, void 0, void 0, function () {
            var content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        validateFlowConfig(config);
                        return [4 /*yield*/, adapter.createFlow(config)];
                    case 1:
                        content = _a.sent();
                        return [2 /*return*/, new Flow(content, [], executor, adapter)];
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
            var nodeConfig, previousNode, nodeContent, node;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        nodeConfig = this.content.config.nodes.find(function (nc) { return nc.nodeKey === nodeKey; });
                        if (nodeConfig === undefined) {
                            throw new Error("Flow (".concat(this.content.id, "): missing NodeConfig (").concat(nodeKey, ")"));
                        }
                        previousNode = (_a = this.nodes.at(-1)) !== null && _a !== void 0 ? _a : null;
                        nodeContent = {
                            type: nodeConfig.nodeType,
                            key: nodeConfig.nodeKey,
                            flowId: this.content.id,
                            index: this.nodes.length,
                            input: (_b = previousNode === null || previousNode === void 0 ? void 0 : previousNode.content.output) !== null && _b !== void 0 ? _b : {},
                            generated: null,
                            output: null,
                            nextNodeKey: null,
                        };
                        return [4 /*yield*/, this.adapter.createNode(nodeContent)];
                    case 1:
                        _c.sent();
                        node = new node_1.Node(nodeConfig, nodeContent, this.executor, this.adapter);
                        this.nodes.push(node);
                        return [2 /*return*/, node];
                }
            });
        });
    };
    // run the flow by executing nodes one by one until the one that requires user input or the end nodes
    Flow.prototype.run = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var initialInput, userText, streamChatOptions, jsonChatOptions, currentNode, _a, nodeType, nodeStatus, _b, _c, messages, _d, nextNodeKey;
            var _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        initialInput = params.initialInput, userText = params.userText, streamChatOptions = params.streamChatOptions, jsonChatOptions = params.jsonChatOptions;
                        if (!((_e = this.nodes.at(-1)) !== null && _e !== void 0)) return [3 /*break*/, 1];
                        _a = _e;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.start()];
                    case 2:
                        _a = (_f.sent());
                        _f.label = 3;
                    case 3:
                        currentNode = _a;
                        _f.label = 4;
                    case 4:
                        nodeType = currentNode.config.nodeType;
                        nodeStatus = currentNode.getStatus();
                        _b = nodeStatus;
                        switch (_b) {
                            case types_1.NodeStatus.INITIATED: return [3 /*break*/, 5];
                            case types_1.NodeStatus.GENERATED: return [3 /*break*/, 11];
                            case types_1.NodeStatus.COMPLETED: return [3 /*break*/, 17];
                        }
                        return [3 /*break*/, 19];
                    case 5:
                        _c = nodeType;
                        switch (_c) {
                            case types_1.NodeType.INTERACTION: return [3 /*break*/, 6];
                            case types_1.NodeType.EXECUTION: return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 10];
                    case 6:
                        messages = this.nodes
                            .filter(function (n) { return n.getStatus() !== types_1.NodeStatus.INITIATED; })
                            .map(function (n) { return n.content; })
                            .filter(function (nc) { return nc.type === types_1.NodeType.INTERACTION; })
                            .flatMap(function (nc) { return __spreadArray(__spreadArray([], (nc.generated !== null
                            ? [{ role: "BOT", content: nc.generated.text }]
                            : []), true), (nc.output !== null
                            ? [{ role: "USER", content: nc.output.text }]
                            : []), true); });
                        return [4 /*yield*/, currentNode.generateStream(initialInput !== null && initialInput !== void 0 ? initialInput : null, messages, streamChatOptions)];
                    case 7: return [2 /*return*/, _f.sent()];
                    case 8: return [4 /*yield*/, currentNode.generateJson(initialInput !== null && initialInput !== void 0 ? initialInput : null, jsonChatOptions)];
                    case 9:
                        _f.sent();
                        return [3 /*break*/, 10];
                    case 10: return [3 /*break*/, 19];
                    case 11:
                        _d = nodeType;
                        switch (_d) {
                            case types_1.NodeType.INTERACTION: return [3 /*break*/, 12];
                            case types_1.NodeType.EXECUTION: return [3 /*break*/, 14];
                        }
                        return [3 /*break*/, 16];
                    case 12: return [4 /*yield*/, currentNode.completeInteraction(userText !== null && userText !== void 0 ? userText : "userText is not provided")];
                    case 13:
                        _f.sent();
                        return [3 /*break*/, 16];
                    case 14: return [4 /*yield*/, currentNode.completeExecution(this.content.memory)];
                    case 15:
                        _f.sent();
                        return [3 /*break*/, 16];
                    case 16: return [3 /*break*/, 19];
                    case 17:
                        nextNodeKey = currentNode.content.nextNodeKey;
                        if (nextNodeKey === null) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, this.next(nextNodeKey)];
                    case 18:
                        currentNode = _f.sent();
                        return [3 /*break*/, 19];
                    case 19:
                        if (true) return [3 /*break*/, 4];
                        _f.label = 20;
                    case 20: return [2 /*return*/];
                }
            });
        });
    };
    return Flow;
}());
exports.Flow = Flow;
//# sourceMappingURL=flow.js.map