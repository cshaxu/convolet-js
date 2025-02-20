import { Adapter, Message, NodeConfig, NodeContent, NodeInput, NodeStatus, SystemEvaluator } from "./types";
declare class Node<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE> {
    config: NodeConfig;
    content: NodeContent;
    private input;
    private systemEvaluator;
    private adapter;
    constructor(config: NodeConfig, content: NodeContent, input: NodeInput, systemEvaluator: SystemEvaluator | null, adapter: Adapter<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>);
    private isInteractionNodeOrThrow;
    private isBotEvaluationNodeOrThrow;
    private isSystemEvaluationNodeOrThrow;
    private isBotDecisionNodeOrThrow;
    private isSystemDecisionNodeOrThrow;
    getStatus(): NodeStatus;
    private isInitiatedOrThrow;
    private isProcessingOrThrow;
    interactBotStream(messages: Message[], options?: STREAM_CHAT_OPTIONS): Promise<STREAM_CHAT_RESPONSE>;
    interactUserInput(userInput: string): Promise<void>;
    botEvaluate(jsonChatOptions?: JSON_CHAT_OPTIONS): Promise<void>;
    systemEvaluate(): Promise<void>;
    botDecide(jsonChatOptions?: JSON_CHAT_OPTIONS): Promise<void>;
    systemDecide(): Promise<void>;
}
export { Node };
