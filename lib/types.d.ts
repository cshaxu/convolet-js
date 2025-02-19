declare enum NodeType {
    INTERACTION = "INTERACTION",
    BOT_EVALUATION = "BOT_EVALUATION",
    SYSTEM_EVALUATION = "SYSTEM_EVALUATION",
    BOT_DECISION = "BOT_DECISION",
    SYSTEM_DECISION = "SYSTEM_DECISION"
}
declare enum NodeStatus {
    INITIATED = "INITIATED",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED"
}
declare enum FlowStatus {
    INITIATED = "INITIATED",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED"
}
type NextNodeOption = {
    nodeKey: string;
    prompt: string | null;
};
type BaseNodeConfig = {
    nodeType: NodeType;
    nodeKey: string;
    inputParams: string[];
    outputParam: string;
    nextNodeOptions: NextNodeOption[];
};
type InteractionNodeConfig = BaseNodeConfig & {
    nodeType: NodeType.INTERACTION;
    prompt: string;
};
type BotEvaluationNodeConfig = BaseNodeConfig & {
    nodeType: NodeType.BOT_EVALUATION;
    prompt: string;
    schema: string;
};
type NodeConfig = BaseNodeConfig | InteractionNodeConfig | BotEvaluationNodeConfig;
type FlowConfig = {
    flowKey: string;
    nodes: NodeConfig[];
    startNodeKey: string;
    endNodeKey: string;
};
type DataObject = Record<string, any>;
type InteractionNodeOutput = {
    botStreamed?: string;
    userInput?: string;
};
type EvaluationNodeOutput = DataObject | DataObject[];
type DecisionNodeOutput = {
    nextNodeKey: string;
    reason: string | null;
};
type NodeOutput = InteractionNodeOutput | EvaluationNodeOutput | DecisionNodeOutput;
type NodeInput = Record<string, NodeOutput>;
type NodeContent = {
    type: NodeType;
    key: string;
    flowId: string;
    index: number;
    output: NodeOutput | null;
};
type FlowMemory = {
    initial: NodeOutput | null;
    symbols: Record<string, number>;
};
type FlowContent = {
    id: string;
    key: string;
    config: FlowConfig;
    memory: FlowMemory;
};
type Message = {
    role: "SYSTEM" | "BOT" | "USER";
    content: string;
};
type SystemEvaluator = (nodeContent: NodeContent) => Promise<NodeOutput>;
type FlowRunParams<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS> = {
    userInput?: string;
    jsonChatOptions?: JSON_CHAT_OPTIONS;
    streamChatOptions?: STREAM_CHAT_OPTIONS;
};
type Adapter<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE> = {
    getFlow(id: string): Promise<FlowContent>;
    createFlow(config: FlowConfig, memory: FlowMemory): Promise<FlowContent>;
    updateFlow(id: string, memory: FlowMemory): Promise<FlowContent>;
    deleteFlow(id: string): Promise<FlowContent>;
    getNodes(flowId: string): Promise<NodeContent[]>;
    deleteNodes(flowId: string): Promise<number>;
    createNode(content: NodeContent): Promise<NodeContent>;
    updateNode(content: NodeContent): Promise<NodeContent>;
    jsonChat(prompt: string, schema: string, options?: JSON_CHAT_OPTIONS): Promise<NodeOutput>;
    streamChat(prompt: string, messages: Message[], onStreamDone: (text: string) => Promise<void>, options?: STREAM_CHAT_OPTIONS): Promise<STREAM_CHAT_RESPONSE>;
};
export { Adapter, BaseNodeConfig, BotEvaluationNodeConfig, DataObject, DecisionNodeOutput, EvaluationNodeOutput, FlowConfig, FlowContent, FlowMemory, FlowRunParams, FlowStatus, InteractionNodeConfig, InteractionNodeOutput, Message, NextNodeOption, NodeConfig, NodeContent, NodeInput, NodeOutput, NodeStatus, NodeType, SystemEvaluator, };
