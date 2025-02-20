"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeType = exports.NodeStatus = exports.FlowStatus = void 0;
// enums
var NodeType;
(function (NodeType) {
    // bot asks a question based input data, and user replys with answer as output data
    NodeType["INTERACTION"] = "INTERACTION";
    // evaluates input data and generate output data
    NodeType["BOT_EVALUATION"] = "BOT_EVALUATION";
    NodeType["SYSTEM_EVALUATION"] = "SYSTEM_EVALUATION";
    // decides the next nodee based on input data
    NodeType["BOT_DECISION"] = "BOT_DECISION";
    NodeType["SYSTEM_DECISION"] = "SYSTEM_DECISION";
})(NodeType || (exports.NodeType = NodeType = {}));
var NodeStatus;
(function (NodeStatus) {
    // when the node is initiated
    NodeStatus["INITIATED"] = "INITIATED";
    // interaction node: when bot text is streamed
    // other nodes: not applicable
    NodeStatus["PROCESSING"] = "PROCESSING";
    // interaction node: when user answer is received
    // other nodes: when output data is generated
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