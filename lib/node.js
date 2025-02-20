"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = void 0;
var prompts_1 = require("./prompts");
var types_1 = require("./types");
function buildErrorMessage(objectId, fieldName, expected, got) {
    return "Node ".concat(objectId, ": \"").concat(fieldName, "\", expected \"").concat(expected.toString(), "\", got \"").concat(got.toString(), "\"");
}
function throwError(content, fieldName, expected, got) {
    throw new Error(buildErrorMessage([content.flowId, content.index, content.key].join("-"), fieldName, expected, got));
}
var Node = /** @class */ (function () {
    function Node(config, content, input, executor, adapter) {
        this.config = config;
        this.content = content;
        this.input = input;
        this.executor = executor;
        this.adapter = adapter;
    }
    Node.prototype.isInteractionNodeOrThrow = function () {
        if (this.content.type !== types_1.NodeType.INTERACTION) {
            throwError(this.content, "isInteractionNode", true, false);
        }
    };
    Node.prototype.isBotEvaluationNodeOrThrow = function () {
        if (this.content.type !== types_1.NodeType.BOT_EVALUATION) {
            throwError(this.content, "isBotEvaluation", true, false);
        }
    };
    Node.prototype.isSystemEvaluationNodeOrThrow = function () {
        if (this.content.type !== types_1.NodeType.SYSTEM_EVALUATION) {
            throwError(this.content, "isSystemEvaluation", true, false);
        }
    };
    Node.prototype.isBotDecisionNodeOrThrow = function () {
        if (this.content.type !== types_1.NodeType.BOT_DECISION) {
            throwError(this.content, "isBotDecision", true, false);
        }
    };
    Node.prototype.isSystemDecisionNodeOrThrow = function () {
        if (this.content.type !== types_1.NodeType.SYSTEM_DECISION) {
            throwError(this.content, "isSystemDecision", true, false);
        }
    };
    Node.prototype.getStatus = function () {
        if (this.content.output === null) {
            return types_1.NodeStatus.INITIATED;
        }
        if (this.content.type === types_1.NodeType.INTERACTION) {
            var output = this.content.output;
            return output.userInput !== undefined
                ? types_1.NodeStatus.COMPLETED
                : output.botStreamed !== undefined
                    ? types_1.NodeStatus.PROCESSING
                    : types_1.NodeStatus.INITIATED;
        }
        return types_1.NodeStatus.COMPLETED;
    };
    Node.prototype.isInitiatedOrThrow = function () {
        if (this.getStatus() !== types_1.NodeStatus.INITIATED) {
            throwError(this.content, "status", types_1.NodeStatus.INITIATED, this.getStatus());
        }
    };
    Node.prototype.isProcessingOrThrow = function () {
        if (this.getStatus() !== types_1.NodeStatus.PROCESSING) {
            throwError(this.content, "status", types_1.NodeStatus.PROCESSING, this.getStatus());
        }
    };
    Node.prototype.interactBotStream = function (messages, options) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, fullStreamPrompt, onStreamDone;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // validate
                        this.isInteractionNodeOrThrow();
                        this.isInitiatedOrThrow();
                        prompt = this.config.prompt;
                        fullStreamPrompt = (0, prompts_1.buildFullStreamPrompt)(prompt, messages.length > 0, this.input);
                        onStreamDone = function (generated) { return __awaiter(_this, void 0, void 0, function () {
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        this.content.output = __assign(__assign({}, ((_a = this.content.output) !== null && _a !== void 0 ? _a : {})), { botStreamed: generated });
                                        return [4 /*yield*/, this.adapter.updateNode(this.content)];
                                    case 1:
                                        _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); };
                        return [4 /*yield*/, this.adapter.streamChat(fullStreamPrompt, messages, onStreamDone, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Node.prototype.interactUserInput = function (userInput) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // validate
                        this.isInteractionNodeOrThrow();
                        this.isProcessingOrThrow();
                        // persist
                        this.content.output = __assign(__assign({}, ((_a = this.content.output) !== null && _a !== void 0 ? _a : {})), { userInput: userInput });
                        return [4 /*yield*/, this.adapter.updateNode(this.content)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Node.prototype.botEvaluate = function (jsonChatOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, prompt, schema, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // validate
                        this.isBotEvaluationNodeOrThrow();
                        this.isInitiatedOrThrow();
                        _a = this.config, prompt = _a.prompt, schema = _a.schema;
                        _b = this.content;
                        return [4 /*yield*/, this.adapter.jsonChat((0, prompts_1.buildFullJsonPrompt)(prompt, this.input), schema, jsonChatOptions)];
                    case 1:
                        _b.output = _c.sent();
                        // persist
                        return [4 /*yield*/, this.adapter.updateNode(this.content)];
                    case 2:
                        // persist
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Node.prototype.systemEvaluate = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // validate
                        this.isSystemEvaluationNodeOrThrow();
                        this.isInitiatedOrThrow();
                        // evaluate
                        _a = this.content;
                        if (!(this.executor === null)) return [3 /*break*/, 1];
                        _b = {};
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.executor(this.content)];
                    case 2:
                        _b = _c.sent();
                        _c.label = 3;
                    case 3:
                        // evaluate
                        _a.output = _b;
                        // persist
                        return [4 /*yield*/, this.adapter.updateNode(this.content)];
                    case 4:
                        // persist
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Node.prototype.botDecide = function (jsonChatOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var nextNodeOptions, promptedNextNodeOptions, fullNextNodeKeyPrompt, _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        // validate
                        this.isBotDecisionNodeOrThrow();
                        this.isInitiatedOrThrow();
                        nextNodeOptions = this.config.nextNodeOptions;
                        promptedNextNodeOptions = typeof nextNodeOptions === "string"
                            ? []
                            : nextNodeOptions.filter(function (option) { return typeof option !== "string"; });
                        fullNextNodeKeyPrompt = (0, prompts_1.buildFullNextNodeKeyPrompt)(promptedNextNodeOptions, this.input);
                        _a = this.content;
                        if (!(typeof nextNodeOptions === "string")) return [3 /*break*/, 1];
                        _b = { nextNodeKey: nextNodeOptions };
                        return [3 /*break*/, 7];
                    case 1:
                        if (!(nextNodeOptions.length === 1)) return [3 /*break*/, 2];
                        _c = {
                            nextNodeKey: typeof nextNodeOptions[0] === "string"
                                ? nextNodeOptions[0]
                                : nextNodeOptions[0].nodeKey,
                        };
                        return [3 /*break*/, 6];
                    case 2:
                        if (!(promptedNextNodeOptions.length > 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.adapter
                                .jsonChat(fullNextNodeKeyPrompt, "{ nextNodeKey: string, reason: string }", jsonChatOptions)
                                .then(function (r) { return r; })];
                    case 3:
                        _d = _e.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _d = { nextNodeKey: "" };
                        _e.label = 5;
                    case 5:
                        _c = _d;
                        _e.label = 6;
                    case 6:
                        _b = _c;
                        _e.label = 7;
                    case 7:
                        _a.output = _b;
                        // persist
                        return [4 /*yield*/, this.adapter.updateNode(this.content)];
                    case 8:
                        // persist
                        _e.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Node.prototype.systemDecide = function () {
        return __awaiter(this, void 0, void 0, function () {
            var nextNodeOptions, _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        // validate
                        this.isSystemDecisionNodeOrThrow();
                        this.isInitiatedOrThrow();
                        nextNodeOptions = this.config.nextNodeOptions;
                        _a = this.content;
                        if (!(typeof nextNodeOptions === "string")) return [3 /*break*/, 1];
                        _b = { nextNodeKey: nextNodeOptions };
                        return [3 /*break*/, 7];
                    case 1:
                        if (!(nextNodeOptions.length === 1)) return [3 /*break*/, 2];
                        _c = {
                            nextNodeKey: typeof nextNodeOptions[0] === "string"
                                ? nextNodeOptions[0]
                                : nextNodeOptions[0].nodeKey,
                        };
                        return [3 /*break*/, 6];
                    case 2:
                        if (!(this.executor !== null && nextNodeOptions.length > 1)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.executor(this.content)];
                    case 3:
                        _d = _e.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _d = { nextNodeKey: "" };
                        _e.label = 5;
                    case 5:
                        _c = _d;
                        _e.label = 6;
                    case 6:
                        _b = _c;
                        _e.label = 7;
                    case 7:
                        _a.output = _b;
                        // persist
                        return [4 /*yield*/, this.adapter.updateNode(this.content)];
                    case 8:
                        // persist
                        _e.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return Node;
}());
exports.Node = Node;
//# sourceMappingURL=node.js.map