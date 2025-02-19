import { Node } from "./node";
import {
  Adapter,
  Executor,
  FlowConfig,
  FlowContent,
  FlowRunParams,
  FlowStatus,
  Message,
  NodeContent,
  NodeStatus,
  NodeType,
} from "./types";
import { toObjectMap } from "./utils";

// Config Rules
// - interaction node is to generate a bot question stream for user to answer
// - execution node is to evaluate the previous out to generate json, and optionally run executor to build output
// - start node can be either interaction node or execution node
// - end node must be an execution node
// - end node has no next node options
// - non-end nodes have next node options
// - interaction node must forward to exactly one execution node
// - execution node can forward to either interaction node or execution node

function throwError(flowKey: string, message: string): void {
  throw new Error(`FlowConfig (${flowKey}): ${message}`);
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

    nextNodeOptions
      .map((nno) => nno.nodeKey)
      .forEach((nextNodeKey) => {
        const nextNodeConfig = nodes.find((nc) => nc.nodeKey === nextNodeKey);
        if (nextNodeConfig === undefined) {
          throwError(
            flowKey,
            `NodeConfig (${nodeKey}): missing next NodeConfig (${nextNodeKey})`
          );
        }
      });

    switch (nodeType) {
      case NodeType.INTERACTION:
        if (isEndNode) {
          throwError(
            flowKey,
            `NodeConfig (${nodeKey}): must be an execution node as end node`
          );
        }
        if (nextNodeOptions.length !== 1) {
          throwError(
            flowKey,
            `NodeConfig (${nodeKey}): must have exactly one next node option`
          );
        }
        const nextNodeKey = nextNodeOptions[0].nodeKey;
        const nextNodeConfig = nodes.find((nc) => nc.nodeKey === nextNodeKey);
        if (
          nextNodeConfig !== undefined &&
          nextNodeConfig.nodeType !== NodeType.EXECUTION
        ) {
          throwError(
            flowKey,
            `NodeConfig (${nodeKey}): next NodeConfig (${nextNodeKey}): must be an execution node`
          );
        }
        break;
      case NodeType.EXECUTION:
        if (isEndNode && nextNodeOptions.length > 0) {
          throwError(
            flowKey,
            `NodeConfig (${nodeKey}): unexpected next node options as end node`
          );
        }
        if (!isEndNode && nextNodeOptions.length === 0) {
          throwError(
            flowKey,
            `NodeConfig (${nodeKey}): missing next node options`
          );
        }
        break;
    }
  });
}

class Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE> {
  content: FlowContent;
  nodes: Node<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>[];
  executor: Executor | null;
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
    executor: Executor | null,
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
    return new Flow(content, nodeContents, executor, adapter);
  }

  public static async create<
    JSON_CHAT_OPTIONS,
    STREAM_CHAT_OPTIONS,
    STREAM_CHAT_RESPONSE
  >(
    config: FlowConfig,
    executor: Executor | null,
    adapter: Adapter<
      JSON_CHAT_OPTIONS,
      STREAM_CHAT_OPTIONS,
      STREAM_CHAT_RESPONSE
    >
  ): Promise<
    Flow<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE>
  > {
    validateFlowConfig(config);
    const content = await adapter.createFlow(config);
    return new Flow(content, [], executor, adapter);
  }

  private constructor(
    content: FlowContent,
    nodeContents: NodeContent[],
    executor: Executor | null,
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

    this.nodes = nodeContents
      .sort((a, b) => a.index - b.index)
      .filter((nc) => nodeConfigByNodeKey.has(nc.key))
      .map(
        (nc) =>
          new Node(nodeConfigByNodeKey.get(nc.key)!, nc, executor, adapter)
      );

    this.executor = executor;
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
    const nodeConfig = this.content.config.nodes.find(
      (nc) => nc.nodeKey === nodeKey
    );
    if (nodeConfig === undefined) {
      throw new Error(
        `Flow (${this.content.id}): missing NodeConfig (${nodeKey})`
      );
    }
    const previousNode = this.nodes.at(-1) ?? null;
    const nodeContent: NodeContent = {
      type: nodeConfig.nodeType,
      key: nodeConfig.nodeKey,
      flowId: this.content.id,
      index: this.nodes.length,
      input: previousNode?.content.output ?? {},
      generated: null,
      output: null,
      nextNodeKey: null,
    };
    await this.adapter.createNode(nodeContent);
    const node = new Node(nodeConfig, nodeContent, this.executor, this.adapter);
    this.nodes.push(node);
    return node;
  }

  // run the flow by executing nodes one by one until the one that requires user input or the end nodes
  public async run(
    params: FlowRunParams<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS>
  ): Promise<STREAM_CHAT_RESPONSE | null> {
    const { initialInput, userText, streamChatOptions, jsonChatOptions } =
      params;
    let currentNode = this.nodes.at(-1) ?? (await this.start());
    do {
      const { nodeType } = currentNode.config;
      const nodeStatus = currentNode.getStatus();

      switch (nodeStatus) {
        case NodeStatus.INITIATED:
          switch (nodeType) {
            case NodeType.INTERACTION:
              const messages: Message[] = this.nodes
                .filter((n) => n.getStatus() !== NodeStatus.INITIATED)
                .map((n) => n.content)
                .filter((nc) => nc.type === NodeType.INTERACTION)
                .flatMap((nc) => [
                  ...(nc.generated !== null
                    ? [{ role: "BOT" as const, content: nc.generated.text }]
                    : []),
                  ...(nc.output !== null
                    ? [{ role: "USER" as const, content: nc.output.text }]
                    : []),
                ]);
              return await currentNode.generateStream(
                initialInput ?? null,
                messages,
                streamChatOptions
              );
            case NodeType.EXECUTION:
              await currentNode.generateJson(
                initialInput ?? null,
                jsonChatOptions
              );
              break;
          }
          break;
        case NodeStatus.GENERATED:
          switch (nodeType) {
            case NodeType.INTERACTION:
              await currentNode.completeInteraction(
                userText ?? "userText is not provided"
              );
              break;
            case NodeType.EXECUTION:
              await currentNode.completeExecution(this.content.memory);
              break;
          }
          break;
        case NodeStatus.COMPLETED:
          const { nextNodeKey } = currentNode.content;
          if (nextNodeKey === null) {
            return null;
          }
          currentNode = await this.next(nextNodeKey);
          break;
      }
    } while (true);
  }
}

export { Flow };
