import {
  buildFullJsonPrompt,
  buildFullNextNodeKeyPrompt,
  buildFullStreamPrompt,
} from "./prompts";
import {
  Adapter,
  DataObject,
  Executor,
  Message,
  NodeConfig,
  NodeContent,
  NodeStatus,
  NodeType,
} from "./types";

type Primitive = string | number | boolean;

function buildErrorMessage(
  objectId: Primitive,
  fieldName: string,
  expected: Primitive,
  got: Primitive
): string {
  return `Node ${objectId}: "${fieldName}", expected "${expected.toString()}", got "${got.toString()}"`;
}

function throwError(
  content: NodeContent,
  fieldName: string,
  expected: Primitive,
  got: Primitive
): void {
  throw new Error(
    buildErrorMessage(
      [content.flowId, content.index, content.key].join("-"),
      fieldName,
      expected,
      got
    )
  );
}

class Node<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE> {
  public config: NodeConfig;
  public content: NodeContent;
  public previous: Node<
    JSON_CHAT_OPTIONS,
    STREAM_CHAT_OPTIONS,
    STREAM_CHAT_RESPONSE
  > | null;
  public executor: Executor | null;
  public adapter: Adapter<
    JSON_CHAT_OPTIONS,
    STREAM_CHAT_OPTIONS,
    STREAM_CHAT_RESPONSE
  >;

  constructor(
    config: NodeConfig,
    content: NodeContent,
    previous: Node<
      JSON_CHAT_OPTIONS,
      STREAM_CHAT_OPTIONS,
      STREAM_CHAT_RESPONSE
    > | null,
    executor: Executor | null,
    adapter: Adapter<
      JSON_CHAT_OPTIONS,
      STREAM_CHAT_OPTIONS,
      STREAM_CHAT_RESPONSE
    >
  ) {
    this.config = config;
    this.content = content;
    this.previous = previous;
    this.executor = executor;
    this.adapter = adapter;
  }

  private isInteractionNodeOrThrow(): void {
    if (
      this.config.nodeType !== NodeType.INTERACTION ||
      this.content.type !== NodeType.INTERACTION
    ) {
      throwError(this.content, "isInteractionNode", true, false);
    }
  }

  private isExecutionNodeOrThrow(): void {
    if (
      this.config.nodeType !== NodeType.EXECUTION ||
      this.content.type !== NodeType.EXECUTION
    ) {
      throwError(this.content, "isExecutionNode", true, false);
    }
  }

  public getStatus(): NodeStatus {
    const { generated, output } = this.content;
    if (output !== null) {
      return NodeStatus.COMPLETED;
    }
    if (generated !== null) {
      return NodeStatus.GENERATED;
    }
    return NodeStatus.INITIATED;
  }

  private isInitiatedOrThrow(): void {
    if (this.getStatus() !== NodeStatus.INITIATED) {
      throwError(
        this.content,
        "status",
        NodeStatus.INITIATED,
        this.getStatus()
      );
    }
  }

  private isGeneratedOrThrow(): void {
    if (this.getStatus() !== NodeStatus.GENERATED) {
      throwError(
        this.content,
        "status",
        NodeStatus.GENERATED,
        this.getStatus()
      );
    }
  }

  public async generateStream(
    initialInput: DataObject | null,
    messages: Message[],
    options?: STREAM_CHAT_OPTIONS
  ): Promise<STREAM_CHAT_RESPONSE> {
    // validate
    this.isInteractionNodeOrThrow();
    this.isInitiatedOrThrow();

    // assemble input
    const input =
      this.previous === null ? initialInput : this.previous.content.output;
    const { prompt, nextNodeOptions } = this.config;

    // generate
    const fullStreamPrompt = buildFullStreamPrompt(
      prompt,
      messages.length > 0,
      input
    );

    // persist
    const onStreamDone = async (generated: string) => {
      this.content.generated = { text: generated };
      this.content.nextNodeKey = nextNodeOptions[0].nodeKey;
      await this.adapter.updateNode(this.content);
    };

    return await this.adapter.streamChat(
      fullStreamPrompt,
      messages,
      onStreamDone,
      options
    );
  }

  public async generateJson(
    initialInput: DataObject | null,
    jsonChatOptions?: JSON_CHAT_OPTIONS
  ): Promise<void> {
    // validate
    this.isExecutionNodeOrThrow();
    this.isInitiatedOrThrow();

    // assemble input
    const input =
      this.previous === null ? initialInput : this.previous.content.output;
    const { prompt, schema, nextNodeOptions } = this.config;

    // generate
    const jsonPromise: Promise<DataObject> =
      prompt === null || schema === null
        ? Promise.resolve({})
        : this.adapter.jsonChat(
            buildFullJsonPrompt(prompt, input),
            schema,
            jsonChatOptions
          );

    const fullNextNodeKeyPrompt = buildFullNextNodeKeyPrompt(
      nextNodeOptions,
      input
    );
    const nextNodeKeyPromise =
      prompt !== null && nextNodeOptions.length > 1
        ? this.adapter
            .jsonChat(
              fullNextNodeKeyPrompt,
              "{ nextNodeKey: string }",
              jsonChatOptions
            )
            .then((r) => r.nextNodeKey as string)
        : nextNodeOptions.length === 1
        ? Promise.resolve(nextNodeOptions[0].nodeKey)
        : Promise.resolve(null);

    const [output, nextNodeKey] = await Promise.all([
      jsonPromise,
      nextNodeKeyPromise,
    ]);

    // persist
    this.content.generated = output;
    this.content.nextNodeKey = nextNodeKey;
    await this.adapter.updateNode(this.content);
  }

  public async completeInteraction(userText: string): Promise<void> {
    // validate
    this.isInteractionNodeOrThrow();
    this.isGeneratedOrThrow();

    // persist
    this.content.output = { text: userText };
    await this.adapter.updateNode(this.content);
  }

  public async completeExecution(): Promise<void> {
    // valdate
    this.isExecutionNodeOrThrow();
    this.isGeneratedOrThrow();

    // execute
    const { output, nextNodeKey } =
      this.executor === null
        ? {
            output: this.content.generated,
            nextNodeKey: this.content.nextNodeKey,
          }
        : await this.executor(this.content);

    // persist
    this.content.output = output;
    this.content.nextNodeKey = nextNodeKey;
    await this.adapter.updateNode(this.content);
  }
}

export { Node };
