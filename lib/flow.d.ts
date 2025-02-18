import { Node } from "./node";
import { Adapter, Executor, FlowConfig, FlowContent, FlowRunParams, FlowStatus } from "./types";
declare class Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE> {
    content: FlowContent;
    nodes: Node<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>[];
    executor: Executor | null;
    adapter: Adapter<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>;
    static get<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>(id: string, executor: Executor | null, adapter: Adapter<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>): Promise<Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>>;
    static create<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>(config: FlowConfig, executor: Executor | null, adapter: Adapter<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>): Promise<Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>>;
    private constructor();
    getStatus(): FlowStatus;
    private start;
    private next;
    run(params: FlowRunParams<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS>): Promise<STREAM_CHAT_RESPONSE | null>;
}
export { Flow };
