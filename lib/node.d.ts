import { Adapter, Awaitable, Message, NodeConfig, NodeContent, NodeInput, NodeStatus, SystemEvaluator } from "./types";
declare class Node<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE> {
    config: NodeConfig;
    content: NodeContent;
    input: NodeInput;
    private adapter;
    private systemEvaluator?;
    constructor(config: NodeConfig, content: NodeContent, input: NodeInput, adapter: Adapter<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>, systemEvaluator?: SystemEvaluator);
    private isInteractionNodeOrThrow;
    private isBotEvaluationNodeOrThrow;
    private isSystemEvaluationNodeOrThrow;
    private isBotDecisionNodeOrThrow;
    private isSystemDecisionNodeOrThrow;
    getStatus(): NodeStatus;
    private isInitiatedOrThrow;
    private isProcessingOrThrow;
    interactBotStream(messages: Message[], onStreamDone: (text: string) => Awaitable<void>, options?: STREAM_CHAT_OPTIONS): Promise<STREAM_CHAT_RESPONSE>;
    interactUserInput(userInput: string): Promise<void>;
    botEvaluate(jsonChatOptions?: JSON_CHAT_OPTIONS): Promise<void>;
    systemEvaluate(): Promise<void>;
    botDecide(jsonChatOptions?: JSON_CHAT_OPTIONS): Promise<void>;
    systemDecide(): Promise<void>;
}
export { Node };
