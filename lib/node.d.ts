import { Adapter, DataObject, Executor, Message, NodeConfig, NodeContent, NodeStatus } from "./types";
declare class Node<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE> {
    config: NodeConfig;
    content: NodeContent;
    executor: Executor | null;
    adapter: Adapter<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>;
    constructor(config: NodeConfig, content: NodeContent, executor: Executor | null, adapter: Adapter<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>);
    private isInteractionNodeOrThrow;
    private isExecutionNodeOrThrow;
    getStatus(): NodeStatus;
    private isInitiatedOrThrow;
    private isGeneratedOrThrow;
    generateStream(initialInput: DataObject | null, messages: Message[], options?: STREAM_CHAT_OPTIONS): Promise<STREAM_CHAT_RESPONSE>;
    generateJson(initialInput: DataObject | null, jsonChatOptions?: JSON_CHAT_OPTIONS): Promise<void>;
    completeInteraction(userText: string): Promise<void>;
    completeExecution(memory: DataObject): Promise<void>;
}
export { Node };
