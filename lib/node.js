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
    function Node(config, content, executor, adapter) {
        this.config = config;
        this.content = content;
        this.executor = executor;
        this.adapter = adapter;
    }
    Node.prototype.isInteractionNodeOrThrow = function () {
        if (this.config.nodeType !== types_1.NodeType.INTERACTION ||
            this.content.type !== types_1.NodeType.INTERACTION) {
            throwError(this.content, "isInteractionNode", true, false);
        }
    };
    Node.prototype.isExecutionNodeOrThrow = function () {
        if (this.config.nodeType !== types_1.NodeType.EXECUTION ||
            this.content.type !== types_1.NodeType.EXECUTION) {
            throwError(this.content, "isExecutionNode", true, false);
        }
    };
    Node.prototype.getStatus = function () {
        var _a = this.content, generated = _a.generated, output = _a.output;
        if (output !== null) {
            return types_1.NodeStatus.COMPLETED;
        }
        if (generated !== null) {
            return types_1.NodeStatus.GENERATED;
        }
        return types_1.NodeStatus.INITIATED;
    };
    Node.prototype.isInitiatedOrThrow = function () {
        if (this.getStatus() !== types_1.NodeStatus.INITIATED) {
            throwError(this.content, "status", types_1.NodeStatus.INITIATED, this.getStatus());
        }
    };
    Node.prototype.isGeneratedOrThrow = function () {
        if (this.getStatus() !== types_1.NodeStatus.GENERATED) {
            throwError(this.content, "status", types_1.NodeStatus.GENERATED, this.getStatus());
        }
    };
    Node.prototype.generateStream = function (initialInput, messages, options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, prompt, nextNodeOptions, fullStreamPrompt, onStreamDone;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // validate
                        this.isInteractionNodeOrThrow();
                        this.isInitiatedOrThrow();
                        _a = this.config, prompt = _a.prompt, nextNodeOptions = _a.nextNodeOptions;
                        fullStreamPrompt = (0, prompts_1.buildFullStreamPrompt)(prompt, messages.length > 0, this.content.input);
                        onStreamDone = function (generated) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        this.content.generated = { text: generated };
                                        this.content.nextNodeKey = nextNodeOptions[0].nodeKey;
                                        return [4 /*yield*/, this.adapter.updateNode(this.content)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); };
                        return [4 /*yield*/, this.adapter.streamChat(fullStreamPrompt, messages, onStreamDone, options)];
                    case 1: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    Node.prototype.generateJson = function (initialInput, jsonChatOptions) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, prompt, schema, nextNodeOptions, jsonPromise, fullNextNodeKeyPrompt, nextNodeKeyPromise, _b, output, nextNodeKey;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // validate
                        this.isExecutionNodeOrThrow();
                        this.isInitiatedOrThrow();
                        _a = this.config, prompt = _a.prompt, schema = _a.schema, nextNodeOptions = _a.nextNodeOptions;
                        jsonPromise = prompt === null || schema === null
                            ? Promise.resolve({})
                            : this.adapter.jsonChat((0, prompts_1.buildFullJsonPrompt)(prompt, this.content.input), schema, jsonChatOptions);
                        fullNextNodeKeyPrompt = (0, prompts_1.buildFullNextNodeKeyPrompt)(nextNodeOptions, this.content.input);
                        nextNodeKeyPromise = prompt !== null && nextNodeOptions.length > 1
                            ? this.adapter
                                .jsonChat(fullNextNodeKeyPrompt, "{ nextNodeKey: string }", jsonChatOptions)
                                .then(function (r) { return r.nextNodeKey; })
                            : nextNodeOptions.length === 1
                                ? Promise.resolve(nextNodeOptions[0].nodeKey)
                                : Promise.resolve(null);
                        return [4 /*yield*/, Promise.all([
                                jsonPromise,
                                nextNodeKeyPromise,
                            ])];
                    case 1:
                        _b = _c.sent(), output = _b[0], nextNodeKey = _b[1];
                        // persist
                        this.content.generated = output;
                        this.content.nextNodeKey = nextNodeKey;
                        return [4 /*yield*/, this.adapter.updateNode(this.content)];
                    case 2:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Node.prototype.completeInteraction = function (userText) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // validate
                        this.isInteractionNodeOrThrow();
                        this.isGeneratedOrThrow();
                        // persist
                        this.content.output = { text: userText };
                        return [4 /*yield*/, this.adapter.updateNode(this.content)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Node.prototype.completeExecution = function (memory) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, output, nextNodeKey, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // valdate
                        this.isExecutionNodeOrThrow();
                        this.isGeneratedOrThrow();
                        if (!(this.executor === null)) return [3 /*break*/, 1];
                        _b = {
                            output: this.content.generated,
                            nextNodeKey: this.content.nextNodeKey,
                        };
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, this.executor(this.content, memory)];
                    case 2:
                        _b = _c.sent();
                        _c.label = 3;
                    case 3:
                        _a = _b, output = _a.output, nextNodeKey = _a.nextNodeKey;
                        // persist
                        this.content.output = output;
                        this.content.nextNodeKey = nextNodeKey;
                        return [4 /*yield*/, this.adapter.updateNode(this.content)];
                    case 4:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return Node;
}());
exports.Node = Node;
//# sourceMappingURL=node.js.map