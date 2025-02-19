import {
  buildFullJsonPrompt,
  buildFullNextNodeKeyPrompt,
  buildFullStreamPrompt,
} from "./prompts";
import {
  Adapter,
  BotEvaluationNodeConfig,
  DecisionNodeOutput,
  InteractionNodeConfig,
  InteractionNodeOutput,
  Message,
  NodeConfig,
  NodeContent,
  NodeInput,
  NodeStatus,
  NodeType,
  SystemEvaluator,
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

  private input: NodeInput;

  private executor: SystemEvaluator | null;
  private adapter: Adapter<
    JSON_CHAT_OPTIONS,
    STREAM_CHAT_OPTIONS,
    STREAM_CHAT_RESPONSE
  >;

  constructor(
    config: NodeConfig,
    content: NodeContent,
    input: NodeInput,
    executor: SystemEvaluator | null,
    adapter: Adapter<
      JSON_CHAT_OPTIONS,
      STREAM_CHAT_OPTIONS,
      STREAM_CHAT_RESPONSE
    >
  ) {
    this.config = config;
    this.content = content;
    this.input = input;
    this.executor = executor;
    this.adapter = adapter;
  }

  private isInteractionNodeOrThrow(): void {
    if (this.content.type !== NodeType.INTERACTION) {
      throwError(this.content, "isInteractionNode", true, false);
    }
  }

  private isBotEvaluationNodeOrThrow(): void {
    if (this.content.type !== NodeType.BOT_EVALUATION) {
      throwError(this.content, "isBotEvaluation", true, false);
    }
  }

  private isSystemEvaluationNodeOrThrow(): void {
    if (this.content.type !== NodeType.SYSTEM_EVALUATION) {
      throwError(this.content, "isSystemEvaluation", true, false);
    }
  }

  private isBotDecisionNodeOrThrow(): void {
    if (this.content.type !== NodeType.BOT_DECISION) {
      throwError(this.content, "isBotDecision", true, false);
    }
  }

  private isSystemDecisionNodeOrThrow(): void {
    if (this.content.type !== NodeType.SYSTEM_DECISION) {
      throwError(this.content, "isSystemDecision", true, false);
    }
  }

  public getStatus(): NodeStatus {
    if (this.content.output === null) {
      return NodeStatus.INITIATED;
    }

    if (this.content.type === NodeType.INTERACTION) {
      const output = this.content.output as InteractionNodeOutput;
      return output.userInput !== undefined
        ? NodeStatus.COMPLETED
        : output.botStreamed !== undefined
        ? NodeStatus.PROCESSING
        : NodeStatus.INITIATED;
    }

    return NodeStatus.COMPLETED;
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

  private isProcessingOrThrow(): void {
    if (this.getStatus() !== NodeStatus.PROCESSING) {
      throwError(
        this.content,
        "status",
        NodeStatus.PROCESSING,
        this.getStatus()
      );
    }
  }

  public async interactBotStream(
    messages: Message[],
    options?: STREAM_CHAT_OPTIONS
  ): Promise<STREAM_CHAT_RESPONSE> {
    // validate
    this.isInteractionNodeOrThrow();
    this.isInitiatedOrThrow();

    // assemble input
    const { prompt } = this.config as InteractionNodeConfig;

    // generate
    const fullStreamPrompt = buildFullStreamPrompt(
      prompt,
      messages.length > 0,
      this.input
    );

    // persist
    const onStreamDone = async (generated: string) => {
      this.content.output = {
        ...(this.content.output ?? {}),
        botStreamed: generated,
      };
      await this.adapter.updateNode(this.content);
    };

    return await this.adapter.streamChat(
      fullStreamPrompt,
      messages,
      onStreamDone,
      options
    );
  }

  public async interactUserInput(userInput: string): Promise<void> {
    // validate
    this.isInteractionNodeOrThrow();
    this.isProcessingOrThrow();

    // persist
    this.content.output = { ...(this.content.output ?? {}), userInput };
    await this.adapter.updateNode(this.content);
  }

  public async botEvaluate(jsonChatOptions?: JSON_CHAT_OPTIONS): Promise<void> {
    // validate
    this.isBotEvaluationNodeOrThrow();
    this.isInitiatedOrThrow();

    // evaluate
    const { prompt, schema } = this.config as BotEvaluationNodeConfig;
    this.content.output = await this.adapter.jsonChat(
      buildFullJsonPrompt(prompt, this.input),
      schema,
      jsonChatOptions
    );

    // persist
    await this.adapter.updateNode(this.content);
  }

  public async systemEvaluate(): Promise<void> {
    // validate
    this.isSystemEvaluationNodeOrThrow();
    this.isInitiatedOrThrow();

    // evaluate
    this.content.output =
      this.executor === null ? {} : await this.executor(this.content);

    // persist
    await this.adapter.updateNode(this.content);
  }

  public async botDecide(jsonChatOptions?: JSON_CHAT_OPTIONS): Promise<void> {
    // validate
    this.isBotDecisionNodeOrThrow();
    this.isInitiatedOrThrow();

    // decide
    const { nextNodeOptions } = this.config;
    const fullNextNodeKeyPrompt = buildFullNextNodeKeyPrompt(
      nextNodeOptions,
      this.input
    );
    this.content.output =
      nextNodeOptions.length === 1
        ? { nextNodeKey: nextNodeOptions[0].nodeKey }
        : nextNodeOptions.length > 1
        ? await this.adapter
            .jsonChat(
              fullNextNodeKeyPrompt,
              "{ nextNodeKey: string, reason: string }",
              jsonChatOptions
            )
            .then((r) => r as DecisionNodeOutput)
        : { nextNodeKey: "" };

    // persist
    await this.adapter.updateNode(this.content);
  }

  public async systemDecide(): Promise<void> {
    // validate
    this.isSystemDecisionNodeOrThrow();
    this.isInitiatedOrThrow();

    // decide
    const { nextNodeOptions } = this.config;
    this.content.output =
      nextNodeOptions.length === 1
        ? { nextNodeKey: nextNodeOptions[0].nodeKey }
        : this.executor !== null && nextNodeOptions.length > 1
        ? await this.executor(this.content)
        : { nextNodeKey: "" };

    // persist
    await this.adapter.updateNode(this.content);
  }
}

export { Node };
