// enums

enum NodeType {
  // bot asks a question, and user replys with answer
  INTERACTION = "INTERACTION",
  // bot evaluates input data, and system takes action based on the evaluation
  EXECUTION = "EXECUTION",
}

enum NodeStatus {
  // when the node is initiated
  INITIATED = "INITIATED",
  // when bot text generation is completed
  // interaction node: when bot question is generated
  // execution node: when input data is evaluated
  GENERATED = "GENERATED",
  // interaction node: when user answer is received
  // execution node: when output is generated
  COMPLETED = "COMPLETED",
}

enum FlowStatus {
  // when no nodes are created
  INITIATED = "INITIATED",
  // when at least one node is created but last node is neither end node nor has COMPLETED status
  PROCESSING = "PROCESSING",
  // when last node is end node and has COMPLETED status
  COMPLETED = "COMPLETED",
}

// configurations

type NextNodeOption = { prompt: string; nodeKey: string };

type NodeConfig = {
  // type of node config
  nodeType: NodeType;
  // unique identifier for node config; to initialize a node properly
  nodeKey: string;
  // prompt for bot to generate a response;
  // - interactive node; null will let bot to generate response freely
  // - execution node; null will skip bot response generation and default to '{}' as output
  prompt: string | null;
  // schema for bot output; execution node must have it to call llm
  schema: string | null;
  // options to move forward to the next node
  nextNodeOptions: NextNodeOption[];
};

type FlowConfig = {
  // unique identifier for flow config; to initialize a flow properly
  flowKey: string;
  // set of nodes for this flow
  nodes: NodeConfig[];
  // start node key
  startNodeKey: string;
  // end node key
  endNodeKey: string;
};

// contents

type DataObject = Record<string, any>;

type NodeContent = {
  // node type to identify the fields of the node content
  type: NodeType;
  // node key to find node config and initialize this
  key: string;
  // unique identifier for its flow
  flowId: string;
  // node index in the flow; starts with 0;
  // first node must be the start node, and last node is the current node.
  index: number;
  // input for the node
  input: DataObject;
  // output from the bot
  generated: { text: string } | DataObject | null;
  // output from either human (interaction) or system (execution)
  output: { text: string } | DataObject | null;
  // selected next node key
  nextNodeKey: string | null;
};

type FlowContent = {
  // unique identifier for this flow
  id: string;
  // flow type to find flow config and initialize this
  key: string;
  // configuration of the entire flow
  config: FlowConfig;
  // memorized data for executor
  memory: DataObject;
};

// executions

type Message = { role: "SYSTEM" | "BOT" | "USER"; content: string };

type ExecutionResult = { output: DataObject; nextNodeKey: string | null };

type Executor = (
  nodeContent: NodeContent,
  memory: DataObject
) => Promise<ExecutionResult>;

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
  jsonChat(
    prompt: string,
    schema: string,
    options?: JSON_CHAT_OPTIONS
  ): Promise<DataObject>;
  streamChat(
    prompt: string,
    messages: Message[],
    onStreamDone: (text: string) => Promise<void>,
    options?: STREAM_CHAT_OPTIONS
  ): Promise<STREAM_CHAT_RESPONSE>;
};

export {
  Adapter,
  DataObject,
  ExecutionResult,
  Executor,
  FlowConfig,
  FlowContent,
  FlowRunParams,
  FlowStatus,
  Message,
  NextNodeOption,
  NodeConfig,
  NodeContent,
  NodeStatus,
  NodeType,
};
