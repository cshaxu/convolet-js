"use strict";
// enums
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeType = exports.NodeStatus = exports.FlowStatus = void 0;
var NodeType;
(function (NodeType) {
    // bot asks a question, and user replys with answer
    NodeType["INTERACTION"] = "INTERACTION";
    // bot evaluates input data, and system takes action based on the evaluation
    NodeType["EXECUTION"] = "EXECUTION";
})(NodeType || (exports.NodeType = NodeType = {}));
var NodeStatus;
(function (NodeStatus) {
    // when the node is initiated
    NodeStatus["INITIATED"] = "INITIATED";
    // when bot text generation is completed
    // interaction node: when bot question is generated
    // execution node: when input data is evaluated
    NodeStatus["GENERATED"] = "GENERATED";
    // interaction node: when user answer is received
    // execution node: when output is generated
    NodeStatus["COMPLETED"] = "COMPLETED";
})(NodeStatus || (exports.NodeStatus = NodeStatus = {}));
var FlowStatus;
(function (FlowStatus) {
    // when no nodes are created
    FlowStatus["INITIATED"] = "INITIATED";
    // when at least one node is created but last node is neither end node nor has COMPLETED status
    FlowStatus["PROCESSING"] = "PROCESSING";
    // when last node is end node and has COMPLETED status
    FlowStatus["COMPLETED"] = "COMPLETED";
})(FlowStatus || (exports.FlowStatus = FlowStatus = {}));
//# sourceMappingURL=types.js.map