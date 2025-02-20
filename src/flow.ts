import { Node } from "./node";
import {
  Adapter,
  DecisionNodeOutput,
  FlowConfig,
  FlowContent,
  FlowMemory,
  FlowRunParams,
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

function throwError(flowKey: string, message: string): void {
  throw new Error(`FlowConfig (${flowKey}): ${message}`);
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
    throwError(flowKey, `missing start node config (${startNodeKey})`);
  }

  // validate end node config
  const endNodeConfig = nodes.find((nc) => nc.nodeKey === endNodeKey);
  if (endNodeConfig === undefined) {
    throwError(flowKey, `missing end NodeConfig (${endNodeKey})`);
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
          throwError(
            flowKey,
            `NodeConfig (${nodeKey}): missing next NodeConfig (${nextNodeOptions})`
          );
        }
      }
    } else {
      nextNodeOptions.forEach((nno) => {
        const nextNodeKey = typeof nno === "string" ? nno : nno.nodeKey;
        const nextNodeConfig = nodes.find((nc) => nc.nodeKey === nextNodeKey);
        if (nextNodeConfig === undefined) {
          throwError(
            flowKey,
            `NodeConfig (${nodeKey}): missing input NodeConfig (${nextNodeKey})`
          );
        }
      });
    }

    switch (nodeType) {
      case NodeType.INTERACTION:
        if (isEndNode) {
          throwError(
            flowKey,
            `NodeConfig (${nodeKey}): must be an evaluation node as end node`
          );
        }
        if (
          typeof nextNodeOptions !== "string" &&
          nextNodeOptions.length !== 1
        ) {
          throwError(
            flowKey,
            `NodeConfig (${nodeKey}): must have exactly one next node option`
          );
        }
        const nextNodeKey = getOnlyNextNodeKey(nextNodeOptions);
        const nextNodeConfig = nodes.find((nc) => nc.nodeKey === nextNodeKey);
        if (nextNodeConfig === undefined) {
          throwError(
            flowKey,
            `NodeConfig (${nodeKey}): missing next NodeConfig (${nextNodeKey})`
          );
        }
        break;
      case NodeType.BOT_EVALUATION:
      case NodeType.SYSTEM_EVALUATION:
        if (isEndNode && nodeConfig.nextNodeOptions.length !== 0) {
          throwError(
            flowKey,
            `NodeConfig (${nodeKey}): must not have next node options as end node`
          );
        }
        if (
          !isEndNode &&
          typeof nodeConfig.nextNodeOptions !== "string" &&
          nodeConfig.nextNodeOptions.length !== 1
        ) {
          throwError(
            flowKey,
            `NodeConfig (${nodeKey}): missing next node options`
          );
        }
        break;
      case NodeType.BOT_DECISION:
      case NodeType.SYSTEM_DECISION:
        if (isEndNode) {
          throwError(
            flowKey,
            `NodeConfig (${nodeKey}): must be an evaluation node as end node`
          );
        }
        if (nodeConfig.nextNodeOptions.length === 0) {
          throwError(
            flowKey,
            `NodeConfig (${nodeKey}): missing next node options`
          );
        }
        break;
    }
  });
}

function buildInput(
  flowId: string,
  index: number,
  nodeContentByIndex: Map<number, NodeContent>,
  nodeConfigByNodeKey: Map<string, NodeConfig>,
  memory: FlowMemory
): NodeInput {
  const currentContent = nodeContentByIndex.get(index);

  // validate
  if (currentContent === undefined) {
    throwError(flowId, `missing current node content for index (${index})`);
    return {};
  }
  const currentConfig = nodeConfigByNodeKey.get(currentContent.key);
  if (currentConfig === undefined) {
    throwError(
      flowId,
      `missing current node config for key (${currentContent.key})`
    );
    return {};
  }
  return currentConfig.inputParams.reduce((acc, param) => {
    if (param === "initial" && memory.initial !== null) {
      acc[param] = memory.initial;
      // this can be overwritten so we are not returning here
    }
    const symbolRef = memory.symbolRefs[param];
    if (symbolRef === undefined) {
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

function setSymbolRef(
  flowContent: FlowContent,
  name: string,
  nodeIndex: number,
  path: string[]
): boolean {
  if (name.trim().length > 0) {
    flowContent.memory.symbolRefs[name] = {
      nodeIndex,
      path,
    };
    return true;
  }
  return false;
}

class Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE> {
  content: FlowContent;
  nodes: Node<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>[];
  systemEvaluator: SystemEvaluator | null;
  adapter: Adapter<
    JSON_CHAT_OPTIONS,
    STREAM_CHAT_OPTIONS,
    STREAM_CHAT_RESPONSE
  >;

  public static async get<
    JSON_CHAT_OPTIONS,
    STREAM_CHAT_OPTIONS,
    STREAM_CHAT_RESPONSE
  >(
    id: string,
    systemEvaluator: SystemEvaluator | null,
    adapter: Adapter<
      JSON_CHAT_OPTIONS,
      STREAM_CHAT_OPTIONS,
      STREAM_CHAT_RESPONSE
    >
  ): Promise<
    Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>
  > {
    const content = await adapter.getFlow(id);
    validateFlowConfig(content.config);
    const nodeContents = await adapter.getNodes(id);
    return new Flow(content, nodeContents, systemEvaluator, adapter);
  }

  public static async create<
    JSON_CHAT_OPTIONS,
    STREAM_CHAT_OPTIONS,
    STREAM_CHAT_RESPONSE
  >(
    config: FlowConfig,
    initialInput: NodeOutput | null,
    systemEvaluator: SystemEvaluator | null,
    adapter: Adapter<
      JSON_CHAT_OPTIONS,
      STREAM_CHAT_OPTIONS,
      STREAM_CHAT_RESPONSE
    >
  ): Promise<
    Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>
  > {
    validateFlowConfig(config);
    const content = await adapter.createFlow(config, {
      initial: initialInput,
      symbolRefs: {},
    });
    return new Flow(content, [], systemEvaluator, adapter);
  }

  public async delete(): Promise<number> {
    const count = await this.adapter.deleteNodes(this.content.id);
    await this.adapter.deleteFlow(this.content.id);
    return count + 1;
  }

  private constructor(
    content: FlowContent,
    nodeContents: NodeContent[],
    systemEvaluator: SystemEvaluator | null,
    adapter: Adapter<
      JSON_CHAT_OPTIONS,
      STREAM_CHAT_OPTIONS,
      STREAM_CHAT_RESPONSE
    >
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

    this.nodes = nodeContents
      .sort((a, b) => a.index - b.index)
      .filter((nc) => nodeConfigByNodeKey.has(nc.key))
      .map((nc) => {
        const nodeConfig = nodeConfigByNodeKey.get(nc.key)!;
        const input = buildInput(
          nc.flowId,
          nc.index,
          nodeContentByIndex,
          nodeConfigByNodeKey,
          this.content.memory
        );
        return new Node(nodeConfig, nc, input, systemEvaluator, adapter);
      });

    this.systemEvaluator = systemEvaluator;
    this.adapter = adapter;
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
      throw new Error(`Flow (${this.content.id}): already started`);
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
        `Flow (${this.content.id}): missing NodeConfig (${nodeKey})`
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
      nodeContent.flowId,
      nodeContent.index,
      nodeContentByIndex,
      nodeConfigByNodeKey,
      this.content.memory
    );
    const node = new Node(
      nodeConfig,
      nodeContent,
      input,
      this.systemEvaluator,
      this.adapter
    );
    this.nodes.push(node);
    return node;
  }

  private async updateSymbols(
    node: Node<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>
  ): Promise<void> {
    const { outputParams } = node.config;
    let shouldUpdateMemory = false;
    if (typeof outputParams === "string") {
      shouldUpdateMemory ||= setSymbolRef(
        this.content,
        outputParams,
        node.content.index,
        []
      );
    } else if (Array.isArray(outputParams)) {
      outputParams.forEach((p) => {
        if (typeof p === "string") {
          shouldUpdateMemory ||= setSymbolRef(
            this.content,
            p,
            node.content.index,
            [p]
          );
        } else if (typeof p === "object") {
          const { name, path } = p;
          const pathParts = Array.isArray(path)
            ? path
            : path.split(".").filter((s) => s.length > 0);
          shouldUpdateMemory ||= setSymbolRef(
            this.content,
            name,
            node.content.index,
            pathParts
          );
        }
      });
    }
    if (shouldUpdateMemory) {
      await this.adapter.updateFlow(this.content.id, this.content.memory);
    }
  }

  // run the flow by executing nodes one by one until the one that requires user input or the end nodes
  public async run(
    params: FlowRunParams<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS>
  ): Promise<STREAM_CHAT_RESPONSE | null> {
    const { userInput, streamChatOptions, jsonChatOptions } = params;
    let currentNode = this.nodes.at(-1) ?? (await this.start());
    do {
      const { config: nodeConfig } = currentNode;
      const { nodeType, nextNodeOptions } = nodeConfig;
      const nodeStatus = currentNode.getStatus();

      switch (nodeType) {
        case NodeType.INTERACTION:
          switch (nodeStatus) {
            case NodeStatus.INITIATED:
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
                streamChatOptions
              );
            case NodeStatus.PROCESSING:
              await currentNode.interactUserInput(
                userInput ?? "userInput is not provided"
              );
              await this.updateSymbols(currentNode);
              break;
            case NodeStatus.COMPLETED:
              currentNode = await this.next(
                getOnlyNextNodeKey(nextNodeOptions)
              );
              break;
            default:
              throw new Error(
                `Flow (${this.content.id}): invalid node status (${nodeStatus})`
              );
          }
          break;
        case NodeType.BOT_EVALUATION:
          switch (nodeStatus) {
            case NodeStatus.INITIATED:
              await currentNode.botEvaluate(jsonChatOptions);
              await this.updateSymbols(currentNode);
              break;
            case NodeStatus.COMPLETED:
              if (nodeConfig.nextNodeOptions.length === 0) {
                return null;
              }
              currentNode = await this.next(
                getOnlyNextNodeKey(nextNodeOptions)
              );
              break;
            default:
              throw new Error(
                `Flow (${this.content.id}): invalid node status (${nodeStatus})`
              );
          }
          break;
        case NodeType.SYSTEM_EVALUATION:
          switch (nodeStatus) {
            case NodeStatus.INITIATED:
              await currentNode.systemEvaluate();
              await this.updateSymbols(currentNode);
              break;
            case NodeStatus.COMPLETED:
              if (nodeConfig.nextNodeOptions.length === 0) {
                return null;
              }
              currentNode = await this.next(
                getOnlyNextNodeKey(nextNodeOptions)
              );
              break;
            default:
              throw new Error(
                `Flow (${this.content.id}): invalid node status (${nodeStatus})`
              );
          }
          break;
        case NodeType.BOT_DECISION:
          switch (nodeStatus) {
            case NodeStatus.INITIATED:
              await currentNode.botDecide(jsonChatOptions);
              await this.updateSymbols(currentNode);
              break;
            case NodeStatus.COMPLETED:
              const { nextNodeKey } = currentNode.content
                .output as DecisionNodeOutput;
              currentNode = await this.next(nextNodeKey);
              break;
            default:
              throw new Error(
                `Flow (${this.content.id}): invalid node status (${nodeStatus})`
              );
          }
          break;
        case NodeType.SYSTEM_DECISION:
          switch (nodeStatus) {
            case NodeStatus.INITIATED:
              await currentNode.systemDecide();
              await this.updateSymbols(currentNode);
              break;
            case NodeStatus.COMPLETED:
              const { nextNodeKey } = currentNode.content
                .output as DecisionNodeOutput;
              currentNode = await this.next(nextNodeKey);
              break;
            default:
              throw new Error(
                `Flow (${this.content.id}): invalid node status (${nodeStatus})`
              );
          }
          break;
        default:
          throw new Error(
            `Flow (${this.content.id}): invalid node type (${nodeType})`
          );
      }
    } while (true);
  }
}

export { Flow };
