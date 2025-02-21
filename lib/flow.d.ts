import { Node } from "./node";
import { Adapter, Awaitable, FlowConfig, FlowContent, FlowOptions, FlowStatus, NodeInput, NodeOutput, SystemEvaluator } from "./types";
declare class Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE> {
    content: FlowContent;
    nodes: Node<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>[];
    adapter: Adapter<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>;
    jsonChatOptions?: JSON_CHAT_OPTIONS;
    streamChatOptions?: STREAM_CHAT_OPTIONS;
    systemEvaluator?: SystemEvaluator;
    static get<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>(id: string, adapter: Adapter<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>, options?: FlowOptions<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS>): Promise<Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>>;
    static create<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>(config: FlowConfig, initialInput: NodeInput, adapter: Adapter<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>, options?: FlowOptions<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS>): Promise<Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>>;
    private constructor();
    delete(): Promise<number>;
    getStatus(): FlowStatus;
    private start;
    private next;
    private updateSymbols;
    run(userInput?: string): Promise<NodeOutput | null>;
    stream(onStreamDone: (text: string) => Awaitable<void>, streamChatOptions?: STREAM_CHAT_OPTIONS): Promise<STREAM_CHAT_RESPONSE>;
}
export { Flow };
