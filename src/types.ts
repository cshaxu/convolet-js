import { JsonSchema } from "zschema";

// common
type Awaitable<T> = T | Promise<T>;

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
  prompt: string;
};

type OutputParam = { name: string; path: string[] | string };

type BaseNodeConfig = {
  // type of node config
  nodeType: NodeType;
  // node key to identify node config and output data (like variable name)
  nodeKey: string;
  // input param names
  inputParams: string[];
  // output name
  outputParams: string | (string | OutputParam)[];
  // option to move forward to next node
  nextNodeOptions: string | string[] | NextNodeOption[];
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
  schema: JsonSchema;
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

type NodeInput = DataObject;

type InteractionNodeOutput = { botStreamed?: string; userInput?: string };

type EvaluationNodeOutput = DataObject;

type DecisionNodeOutput = { nextNodeKey: string; reason: string | null };

type NodeOutput =
  | InteractionNodeOutput
  | EvaluationNodeOutput
  | DecisionNodeOutput;

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

type SymbolRef = { nodeIndex: number; path: string[] };

type FlowMemory = {
  // initial input data for the flow, variable name is 'initial'
  initial: NodeInput;
  // symbol table to map variable name to node index or value
  symbolRefs: Record<string, SymbolRef>;
};

type FlowContent = {
  // unique identifier for this flow
  id: string;
  // flow type to find flow config and initialize this
  key: string;
  // configuration of the entire flow
  config: FlowConfig;
  // memory to manage data and state
  memory: FlowMemory;
};

// executions

type BotStreamPromptBuilder = (
  prompt: string,
  hasPreviousMessages: boolean,
  input: NodeInput
) => string;

type BotEvaluationPromptBuilder = (prompt: string, input: NodeInput) => string;

type BotDecisionPromptBuilder = (
  nextNodeOptions: NextNodeOption[],
  input: NodeInput
) => string;

type PromptBuilders = {
  botStream: BotStreamPromptBuilder;
  botEvaluation: BotEvaluationPromptBuilder;
  botDecision: BotDecisionPromptBuilder;
};

type Message = { role: "SYSTEM" | "BOT" | "USER"; content: string };

type SystemEvaluator = (
  input: NodeInput,
  nodeContent: NodeContent,
  nodeConfig: NodeConfig
) => Awaitable<NodeOutput>;

type FlowInitOptions<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS> = {
  promptBuilders?: PromptBuilders;
  systemEvaluator?: SystemEvaluator;
  jsonChatOptions?: JSON_CHAT_OPTIONS;
  streamChatOptions?: STREAM_CHAT_OPTIONS;
};

type FlowExecOptions = {
  userInput?: string;
  callBefore?: (nodeContent: NodeContent) => Awaitable<void>;
  callAfter?: (nodeContent: NodeContent) => Awaitable<void>;
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
    schema: JsonSchema,
    options?: JSON_CHAT_OPTIONS
  ): Awaitable<NodeOutput>;
  streamChat(
    prompt: string,
    messages: Message[],
    onStreamDone: (text: string) => Promise<void>,
    options?: STREAM_CHAT_OPTIONS
  ): Awaitable<STREAM_CHAT_RESPONSE>;
};

export {
  Adapter,
  Awaitable,
  BaseNodeConfig,
  BotDecisionPromptBuilder,
  BotEvaluationNodeConfig,
  BotEvaluationPromptBuilder,
  BotStreamPromptBuilder,
  DataObject,
  DecisionNodeOutput,
  EvaluationNodeOutput,
  FlowConfig,
  FlowContent,
  FlowExecOptions,
  FlowInitOptions,
  FlowMemory,
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
  PromptBuilders,
  SymbolRef,
  SystemEvaluator,
};
