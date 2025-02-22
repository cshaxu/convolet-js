import { Node } from "./node";
import { defaultPromptBuilders } from "./prompts";
import {
  Adapter,
  Awaitable,
  DecisionNodeOutput,
  FlowConfig,
  FlowContent,
  FlowExecOptions,
  FlowInitOptions,
  FlowMemory,
  FlowStatus,
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
  SystemEvaluator,
} from "./types";
import { toObjectMap } from "./utils";

// Config Rules
// - interaction node is to generate a bot question stream for user to answer
// - evaluation node is to evaluate the input and generate json
// - decision node is to evaluate the input and generate next node key
// - start node can be any node
// - end node must be an evaluation node
// - end node has no next node key
// - non-end nodes have next node key or next node options
// - interaction node and evaluation node must move to exactly one next node
// - decision node must have at least one next node option
// - flow can be created with initial memory data

function buildConfigErrorMessage(flowKey: string, message: string): string {
  return `FlowConfig (${flowKey}): ${message}`;
}

function buildContentErrorMessage(
  content: FlowContent,
  message: string
): string {
  const objectId = [content.key, content.id].join("-");
  return `Flow (${objectId}): ${message}`;
}

function getOnlyNextNodeKey(
  nextNodeOptions: string | string[] | NextNodeOption[]
): string {
  return typeof nextNodeOptions === "string"
    ? nextNodeOptions
    : typeof nextNodeOptions[0] === "string"
    ? nextNodeOptions[0]
    : nextNodeOptions[0].nodeKey;
}

function validateFlowConfig(flowConfig: FlowConfig): void {
  const { flowKey, nodes, startNodeKey, endNodeKey } = flowConfig;

  // validate start node config
  const startNodeConfig = nodes.find((nc) => nc.nodeKey === startNodeKey);
  if (startNodeConfig === undefined) {
    new Error(
      buildConfigErrorMessage(
        flowKey,
        `missing start node config (${startNodeKey})`
      )
    );
  }

  // validate end node config
  const endNodeConfig = nodes.find((nc) => nc.nodeKey === endNodeKey);
  if (endNodeConfig === undefined) {
    new Error(
      buildConfigErrorMessage(flowKey, `missing end NodeConfig (${endNodeKey})`)
    );
  }

  nodes.forEach((nodeConfig) => {
    const { nodeType, nodeKey, nextNodeOptions } = nodeConfig;
    const isEndNode = nodeKey === endNodeKey;

    if (typeof nextNodeOptions === "string") {
      if (nextNodeOptions.length > 0) {
        const nextNodeConfig = nodes.find(
          (nc) => nc.nodeKey === nextNodeOptions
        );
        if (nextNodeConfig === undefined) {
          new Error(
            buildConfigErrorMessage(
              flowKey,
              `NodeConfig (${nodeKey}): missing next NodeConfig (${nextNodeOptions})`
            )
          );
        }
      }
    } else {
      nextNodeOptions.forEach((nno) => {
        const nextNodeKey = typeof nno === "string" ? nno : nno.nodeKey;
        const nextNodeConfig = nodes.find((nc) => nc.nodeKey === nextNodeKey);
        if (nextNodeConfig === undefined) {
          new Error(
            buildConfigErrorMessage(
              flowKey,
              `NodeConfig (${nodeKey}): missing input NodeConfig (${nextNodeKey})`
            )
          );
        }
      });
    }

    switch (nodeType) {
      case NodeType.INTERACTION:
        if (isEndNode) {
          new Error(
            buildConfigErrorMessage(
              flowKey,
              `NodeConfig (${nodeKey}): must be an evaluation node as end node`
            )
          );
        }
        if (
          typeof nextNodeOptions !== "string" &&
          nextNodeOptions.length !== 1
        ) {
          new Error(
            buildConfigErrorMessage(
              flowKey,
              `NodeConfig (${nodeKey}): must have exactly one next node option`
            )
          );
        }
        const nextNodeKey = getOnlyNextNodeKey(nextNodeOptions);
        const nextNodeConfig = nodes.find((nc) => nc.nodeKey === nextNodeKey);
        if (nextNodeConfig === undefined) {
          new Error(
            buildConfigErrorMessage(
              flowKey,
              `NodeConfig (${nodeKey}): missing next NodeConfig (${nextNodeKey})`
            )
          );
        }
        break;
      case NodeType.BOT_EVALUATION:
      case NodeType.SYSTEM_EVALUATION:
        if (isEndNode && nodeConfig.nextNodeOptions.length !== 0) {
          new Error(
            buildConfigErrorMessage(
              flowKey,
              `NodeConfig (${nodeKey}): must not have next node options as end node`
            )
          );
        }
        if (
          !isEndNode &&
          typeof nodeConfig.nextNodeOptions !== "string" &&
          nodeConfig.nextNodeOptions.length !== 1
        ) {
          new Error(
            buildConfigErrorMessage(
              flowKey,
              `NodeConfig (${nodeKey}): missing next node options`
            )
          );
        }
        break;
      case NodeType.BOT_DECISION:
      case NodeType.SYSTEM_DECISION:
        if (isEndNode) {
          new Error(
            buildConfigErrorMessage(
              flowKey,
              `NodeConfig (${nodeKey}): must be an evaluation node as end node`
            )
          );
        }
        if (nodeConfig.nextNodeOptions.length === 0) {
          new Error(
            buildConfigErrorMessage(
              flowKey,
              `NodeConfig (${nodeKey}): missing next node options`
            )
          );
        }
        break;
    }
  });
}

function buildInput(
  flowContent: FlowContent,
  index: number,
  nodeContentByIndex: Map<number, NodeContent>,
  nodeConfigByNodeKey: Map<string, NodeConfig>,
  memory: FlowMemory
): NodeInput {
  const currentContent = nodeContentByIndex.get(index);

  // validate
  if (currentContent === undefined) {
    new Error(
      buildContentErrorMessage(flowContent, `missing NodeContent (${index})`)
    );
    return {};
  }
  const currentConfig = nodeConfigByNodeKey.get(currentContent.key);
  if (currentConfig === undefined) {
    new Error(
      buildContentErrorMessage(
        flowContent,
        `missing NodeConfig (${currentContent.key})`
      )
    );
    return {};
  }

  // retrieve
  return currentConfig.inputParams.reduce((acc, param) => {
    const symbolRef = memory.symbolRefs[param];

    if (symbolRef === undefined) {
      // fallback to initial input
      const value = memory.initial[param];
      if (value !== undefined) {
        acc[param] = value;
      }
      return acc;
    }

    const { nodeIndex, path } = symbolRef;
    const inputNode = nodeContentByIndex.get(nodeIndex);
    const input = inputNode?.output ?? undefined;
    const value = path.reduce(
      (a, p) => (a === undefined ? undefined : a[p]),
      input as NodeInput
    );
    if (value !== undefined) {
      acc[param] = value;
    }
    return acc;
  }, {} as NodeInput);
}

class Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE> {
  content: FlowContent;
  nodes: Node<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>[];
  adapter: Adapter<
    JSON_CHAT_OPTIONS,
    STREAM_CHAT_OPTIONS,
    STREAM_CHAT_RESPONSE
  >;
  promptBuilders: PromptBuilders;

  jsonChatOptions?: JSON_CHAT_OPTIONS;
  streamChatOptions?: STREAM_CHAT_OPTIONS;
  systemEvaluator?: SystemEvaluator;

  public static async get<
    JSON_CHAT_OPTIONS,
    STREAM_CHAT_OPTIONS,
    STREAM_CHAT_RESPONSE
  >(
    id: string,
    adapter: Adapter<
      JSON_CHAT_OPTIONS,
      STREAM_CHAT_OPTIONS,
      STREAM_CHAT_RESPONSE
    >,
    options: FlowInitOptions<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS> = {}
  ): Promise<
    Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>
  > {
    const content = await adapter.getFlow(id);
    validateFlowConfig(content.config);
    const nodeContents = await adapter.getNodes(id);
    return new Flow(content, nodeContents, adapter, options);
  }

  public static async create<
    JSON_CHAT_OPTIONS,
    STREAM_CHAT_OPTIONS,
    STREAM_CHAT_RESPONSE
  >(
    config: FlowConfig,
    initialInput: NodeInput,
    adapter: Adapter<
      JSON_CHAT_OPTIONS,
      STREAM_CHAT_OPTIONS,
      STREAM_CHAT_RESPONSE
    >,
    options: FlowInitOptions<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS> = {}
  ): Promise<
    Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>
  > {
    validateFlowConfig(config);
    const content = await adapter.createFlow(config, {
      initial: initialInput,
      symbolRefs: {},
    });
    return new Flow(content, [], adapter, options);
  }

  private constructor(
    content: FlowContent,
    nodeContents: NodeContent[],
    adapter: Adapter<
      JSON_CHAT_OPTIONS,
      STREAM_CHAT_OPTIONS,
      STREAM_CHAT_RESPONSE
    >,

    options: FlowInitOptions<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS>
  ) {
    this.content = content;
    const nodeConfigByNodeKey = toObjectMap(
      this.content.config.nodes,
      (nc) => nc.nodeKey,
      (nc) => nc
    );
    const nodeContentByIndex = toObjectMap(
      nodeContents,
      (nc) => nc.index,
      (nc) => nc
    );

    const {
      promptBuilders,
      jsonChatOptions,
      streamChatOptions,
      systemEvaluator,
    } = options;

    this.nodes = nodeContents
      .sort((a, b) => a.index - b.index)
      .filter((nc) => nodeConfigByNodeKey.has(nc.key))
      .map((nc) => {
        const nodeConfig = nodeConfigByNodeKey.get(nc.key)!;
        const input = buildInput(
          content,
          nc.index,
          nodeContentByIndex,
          nodeConfigByNodeKey,
          this.content.memory
        );
        return new Node(
          nodeConfig,
          nc,
          input,
          adapter,
          promptBuilders ?? defaultPromptBuilders,
          systemEvaluator
        );
      });

    this.adapter = adapter;
    this.jsonChatOptions = jsonChatOptions;
    this.streamChatOptions = streamChatOptions;
    this.promptBuilders = promptBuilders ?? defaultPromptBuilders;
    this.systemEvaluator = systemEvaluator;
  }

  public async delete(): Promise<number> {
    const count = await this.adapter.deleteNodes(this.content.id);
    await this.adapter.deleteFlow(this.content.id);
    return count + 1;
  }

  public getStatus(): FlowStatus {
    if (this.nodes.length === 0) {
      return FlowStatus.INITIATED;
    }
    const lastNode = this.nodes.at(-1);
    if (
      lastNode !== undefined &&
      lastNode.config.nodeKey === this.content.config.endNodeKey &&
      lastNode.getStatus() === NodeStatus.COMPLETED
    ) {
      return FlowStatus.COMPLETED;
    }
    return FlowStatus.PROCESSING;
  }

  // start with the start node
  private async start(): Promise<
    Node<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>
  > {
    if (this.getStatus() !== FlowStatus.INITIATED) {
      throw new Error(
        buildContentErrorMessage(this.content, "already started")
      );
    }
    return await this.next(this.content.config.startNodeKey);
  }

  // move forward to the next node
  private async next(
    nodeKey: string
  ): Promise<
    Node<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>
  > {
    const nodeConfigByNodeKey = toObjectMap(
      this.content.config.nodes,
      (nc) => nc.nodeKey,
      (nc) => nc
    );
    const nodeConfig = nodeConfigByNodeKey.get(nodeKey);
    if (nodeConfig === undefined) {
      throw new Error(
        buildContentErrorMessage(
          this.content,
          `missing NodeConfig (${nodeKey})`
        )
      );
    }

    const nodeContents = this.nodes.map((n) => n.content);
    const nodeContent: NodeContent = {
      type: nodeConfig.nodeType,
      key: nodeConfig.nodeKey,
      flowId: this.content.id,
      index: this.nodes.length,
      output: null,
    };
    await this.adapter.createNode(nodeContent);

    nodeContents.push(nodeContent);
    const nodeContentByIndex = toObjectMap(
      nodeContents,
      (nc) => nc.index,
      (nc) => nc
    );
    const input = buildInput(
      this.content,
      nodeContent.index,
      nodeContentByIndex,
      nodeConfigByNodeKey,
      this.content.memory
    );
    const node = new Node(
      nodeConfig,
      nodeContent,
      input,
      this.adapter,
      this.promptBuilders,
      this.systemEvaluator
    );
    this.nodes.push(node);
    return node;
  }

  private async updateSymbols(
    node: Node<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>
  ): Promise<void> {
    const { outputParams } = node.config;
    const { index: nodeIndex } = node.content;
    let shouldUpdateMemory = false;
    if (typeof outputParams === "string") {
      this.content.memory.symbolRefs[outputParams] = { nodeIndex, path: [] };
      shouldUpdateMemory = true;
    } else if (Array.isArray(outputParams)) {
      outputParams.forEach((p) => {
        if (typeof p === "string") {
          this.content.memory.symbolRefs[p] = { nodeIndex, path: [p] };
          shouldUpdateMemory = true;
        } else if (typeof p === "object") {
          const { name, path } = p;
          const pathParts = Array.isArray(path)
            ? path
            : path.split(".").filter((s) => s.length > 0);
          this.content.memory.symbolRefs[name] = { nodeIndex, path: pathParts };
          shouldUpdateMemory = true;
        }
      });
    }
    if (shouldUpdateMemory) {
      await this.adapter.updateFlow(this.content.id, this.content.memory);
    }
  }

  // run the entire flow continuously until the end or hitting streaming state
  // flow completed normally: return NodeOutput
  // flow awaiting user input: return null and you should call stream() next
  public async run(options?: FlowExecOptions): Promise<NodeOutput | null> {
    let result = null;
    do {
      result = await this.step(options);
    } while (result !== null && this.getStatus() !== FlowStatus.COMPLETED);
    return result;
  }

  // execute one step of the flow
  // step completed normally: return NodeOutput
  // step awaiting user input: return null and you should call stream() next
  public async step(options?: FlowExecOptions): Promise<NodeOutput | null> {
    const { userInput, callBefore, callAfter } = options ?? {};
    const currentNode = this.nodes.at(-1) ?? (await this.start());

    if (callBefore !== undefined) {
      await callBefore(currentNode.content);
    }

    const nodeStatus = currentNode.getStatus();
    const { nodeType, nextNodeOptions } = currentNode.config;

    if (nodeStatus === NodeStatus.INITIATED) {
      switch (nodeType) {
        case NodeType.INTERACTION:
          return null;
        case NodeType.BOT_EVALUATION:
          await currentNode.botEvaluate(this.jsonChatOptions);
          break;
        case NodeType.SYSTEM_EVALUATION:
          await currentNode.systemEvaluate();
          break;
        case NodeType.BOT_DECISION:
          await currentNode.botDecide(this.jsonChatOptions);
          break;
        case NodeType.SYSTEM_DECISION:
          await currentNode.systemDecide();
          break;
        default:
          throw new Error(
            buildContentErrorMessage(
              this.content,
              `invalid NodeType (${nodeType})`
            )
          );
      }
    }

    if (nodeStatus === NodeStatus.PROCESSING) {
      const { index } = currentNode.content;
      if (nodeType !== NodeType.INTERACTION) {
        throw new Error(
          buildContentErrorMessage(
            this.content,
            `Node (${index}): invalid NodeType (${nodeType}) for NodeStatus (${nodeStatus})`
          )
        );
      }
      if (userInput === undefined) {
        throw new Error(
          buildContentErrorMessage(this.content, `userInput is not provided`)
        );
      }
      await currentNode.interactUserInput(userInput);
    }

    // after all nodes are executed, update the symbols
    await this.updateSymbols(currentNode);

    // now initialize the next node
    switch (nodeType) {
      case NodeType.INTERACTION:
        await this.next(getOnlyNextNodeKey(nextNodeOptions));
        break;
      case NodeType.BOT_EVALUATION:
      case NodeType.SYSTEM_EVALUATION:
        if (nextNodeOptions.length > 0) {
          await this.next(getOnlyNextNodeKey(nextNodeOptions));
        }
        break;
      case NodeType.BOT_DECISION:
      case NodeType.SYSTEM_DECISION:
        const { nextNodeKey } = currentNode.content
          .output as DecisionNodeOutput;
        await this.next(nextNodeKey);
        break;
      default:
        throw new Error(
          buildContentErrorMessage(
            this.content,
            `invalid NodeType (${nodeType})`
          )
        );
    }

    if (callAfter !== undefined) {
      await callAfter(currentNode.content);
    }

    return currentNode.content.output;
  }

  public async stream(
    onStreamDone: (text: string) => Awaitable<void>,
    streamChatOptions?: STREAM_CHAT_OPTIONS
  ): Promise<STREAM_CHAT_RESPONSE> {
    const currentNode = this.nodes.at(-1);
    if (currentNode === undefined) {
      throw new Error(
        buildContentErrorMessage(
          this.content,
          "flow is not in streaming state yet"
        )
      );
    }

    const { nodeType } = currentNode.config;
    const nodeStatus = currentNode.getStatus();

    if (
      nodeType !== NodeType.INTERACTION ||
      nodeStatus !== NodeStatus.INITIATED
    ) {
      throw new Error(
        buildContentErrorMessage(
          this.content,
          `flow is not in streaming state (${nodeStatus})`
        )
      );
    }
    const messages: Message[] = this.nodes
      .filter((n) => n.getStatus() !== NodeStatus.INITIATED)
      .map((n) => n.content)
      .filter((nc) => nc.type === NodeType.INTERACTION)
      .filter((nc) => nc.output !== null)
      .map((nc) => nc.output as InteractionNodeOutput)
      .flatMap((output) => [
        ...(output.botStreamed !== undefined
          ? [{ role: "BOT" as const, content: output.botStreamed }]
          : []),
        ...(output.userInput !== undefined
          ? [{ role: "USER" as const, content: output.userInput }]
          : []),
      ]);
    return await currentNode.interactBotStream(
      messages,
      onStreamDone,
      streamChatOptions
    );
  }
}

export { Flow };
