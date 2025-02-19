// enums

enum NodeType {
  // bot asks a question based input data, and user replys with answer as output data
  INTERACTION = "INTERACTION",
  // evaluates input data and generate output data
  BOT_EVALUATION = "BOT_EVALUATION",
  SYSTEM_EVALUATION = "SYSTEM_EVALUATION",
  // decides the next nodee based on input data
  BOT_DECISION = "BOT_DECISION",
  SYSTEM_DECISION = "SYSTEM_DECISION",
}

enum NodeStatus {
  // when the node is initiated
  INITIATED = "INITIATED",
  // interaction node: when bot text is streamed
  // other nodes: not applicable
  PROCESSING = "PROCESSING",
  // interaction node: when user answer is received
  // other nodes: when output data is generated
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

type NextNodeOption = {
  // key to enter the next node
  nodeKey: string;
  // prompt for bot to decide whether to take this option
  prompt: string | null;
};

type BaseNodeConfig = {
  // type of node config
  nodeType: NodeType;
  // node key to identify node config and output data (like variable name)
  nodeKey: string;
  // input param names
  inputParams: string[];
  // output name
  outputParam: string;
  // option to move forward to next node
  nextNodeOptions: NextNodeOption[];
};

type InteractionNodeConfig = BaseNodeConfig & {
  nodeType: NodeType.INTERACTION;
  // prompt for bot to generate a response;
  prompt: string;
};

type BotEvaluationNodeConfig = BaseNodeConfig & {
  nodeType: NodeType.BOT_EVALUATION;
  // prompt for bot to generate a respons
  prompt: string;
  // schema for bot output; execution node must have it to call llm
  schema: string;
};

type NodeConfig =
  | BaseNodeConfig
  | InteractionNodeConfig
  | BotEvaluationNodeConfig;

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

type InteractionNodeOutput = {
  botStreamed?: string;
  userInput?: string;
};

type EvaluationNodeOutput = DataObject | DataObject[];

type DecisionNodeOutput = { nextNodeKey: string; reason: string | null };

type NodeOutput =
  | InteractionNodeOutput
  | EvaluationNodeOutput
  | DecisionNodeOutput;

type NodeInput = Record<string, NodeOutput>;

type NodeContent = {
  // node type to identify the fields of the node content
  type: NodeType;
  // node key to identify node config and output data (like variable name)
  key: string;
  // unique identifier for its flow
  flowId: string;
  // node index in the flow; starts with 0;
  // first node must be the start node, and last node is the current node.
  index: number;
  // output for the node
  output: NodeOutput | null;
};

type FlowMemory = {
  // initial input data for the flow, variable name is 'initial'
  initial: NodeOutput | null;
  // symbol table to map variable name to node index
  symbols: Record<string, number>;
};

type FlowContent = {
  // unique identifier for this flow
  id: string;
  // flow type to find flow config and initialize this
  key: string;
  // configuration of the entire flow
  config: FlowConfig;
  // memory for executor to manage data and state
  memory: FlowMemory;
};

// executions

type Message = { role: "SYSTEM" | "BOT" | "USER"; content: string };

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
  jsonChat(
    prompt: string,
    schema: string,
    options?: JSON_CHAT_OPTIONS
  ): Promise<NodeOutput>;
  streamChat(
    prompt: string,
    messages: Message[],
    onStreamDone: (text: string) => Promise<void>,
    options?: STREAM_CHAT_OPTIONS
  ): Promise<STREAM_CHAT_RESPONSE>;
};

export {
  Adapter,
  BaseNodeConfig,
  BotEvaluationNodeConfig,
  DataObject,
  DecisionNodeOutput,
  EvaluationNodeOutput,
  FlowConfig,
  FlowContent,
  FlowMemory,
  FlowRunParams,
  FlowStatus,
  InteractionNodeConfig,
  InteractionNodeOutput,
  Message,
  NextNodeOption,
  NodeConfig,
  NodeContent,
  NodeInput,
  NodeOutput,
  NodeStatus,
  NodeType,
  SystemEvaluator,
};
