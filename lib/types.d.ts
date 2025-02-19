declare enum NodeType {
    INTERACTION = "INTERACTION",
    EXECUTION = "EXECUTION"
}
declare enum NodeStatus {
    INITIATED = "INITIATED",
    GENERATED = "GENERATED",
    COMPLETED = "COMPLETED"
}
declare enum FlowStatus {
    INITIATED = "INITIATED",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED"
}
type NextNodeOption = {
    prompt: string;
    nodeKey: string;
};
type NodeConfig = {
    nodeType: NodeType;
    nodeKey: string;
    prompt: string | null;
    schema: string | null;
    nextNodeOptions: NextNodeOption[];
};
type FlowConfig = {
    flowKey: string;
    nodes: NodeConfig[];
    startNodeKey: string;
    endNodeKey: string;
};
type DataObject = Record<string, any>;
type NodeContent = {
    type: NodeType;
    key: string;
    flowId: string;
    index: number;
    generated: {
        text: string;
    } | DataObject | null;
    output: {
        text: string;
    } | DataObject | null;
    nextNodeKey: string | null;
};
type FlowContent = {
    id: string;
    key: string;
    config: FlowConfig;
    memory: DataObject;
};
type Message = {
    role: "SYSTEM" | "BOT" | "USER";
    content: string;
};
type ExecutionResult = {
    output: DataObject;
    nextNodeKey: string | null;
};
type Executor = (nodeContent: NodeContent) => Promise<ExecutionResult>;
type FlowRunParams<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS> = {
    initialInput?: DataObject;
    userText?: string;
    jsonChatOptions?: JSON_CHAT_OPTIONS;
    streamChatOptions?: STREAM_CHAT_OPTIONS;
};
type Adapter<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE> = {
    getFlow(id: string): Promise<FlowContent>;
    createFlow(config: FlowConfig): Promise<FlowContent>;
    getNodes(flowId: string): Promise<NodeContent[]>;
    createNode(content: NodeContent): Promise<NodeContent>;
    updateNode(content: NodeContent): Promise<NodeContent>;
    jsonChat(prompt: string, schema: string, options?: JSON_CHAT_OPTIONS): Promise<DataObject>;
    streamChat(prompt: string, messages: Message[], onStreamDone: (text: string) => Promise<void>, options?: STREAM_CHAT_OPTIONS): Promise<STREAM_CHAT_RESPONSE>;
};
export { Adapter, DataObject, ExecutionResult, Executor, FlowConfig, FlowContent, FlowRunParams, FlowStatus, Message, NextNodeOption, NodeConfig, NodeContent, NodeStatus, NodeType, };
