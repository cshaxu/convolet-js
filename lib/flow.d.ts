import { Node } from "./node";
import { Adapter, FlowConfig, FlowContent, FlowRunParams, FlowStatus, NodeOutput, SystemEvaluator } from "./types";
declare class Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE> {
    content: FlowContent;
    nodes: Node<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>[];
    executor: SystemEvaluator | null;
    adapter: Adapter<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>;
    static get<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>(id: string, executor: SystemEvaluator | null, adapter: Adapter<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>): Promise<Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>>;
    static create<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>(config: FlowConfig, initialInput: NodeOutput | null, executor: SystemEvaluator | null, adapter: Adapter<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>): Promise<Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>>;
    delete(): Promise<number>;
    private constructor();
    getStatus(): FlowStatus;
    private start;
    private next;
    private save;
    run(params: FlowRunParams<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS>): Promise<STREAM_CHAT_RESPONSE | null>;
}
export { Flow };
