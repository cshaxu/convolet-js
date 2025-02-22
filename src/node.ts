import {
  Adapter,
  Awaitable,
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
  PromptBuilders,
  SystemEvaluator,
} from "./types";

type Primitive = string | number | boolean;

function buildErrorMessage(
  content: NodeContent,
  fieldName: string,
  expected: Primitive,
  got: Primitive
): string {
  const objectId = [content.key, content.flowId, content.index].join("-");
  return `Node (${objectId}): "${fieldName}", expected "${expected.toString()}", got "${got.toString()}"`;
}

class Node<JSON_CHAT_OPTIONS, STREAM_CHAT_OPTIONS, STREAM_CHAT_RESPONSE> {
  public config: NodeConfig;
  public content: NodeContent;
  public input: NodeInput;

  private adapter: Adapter<
    JSON_CHAT_OPTIONS,
    STREAM_CHAT_OPTIONS,
    STREAM_CHAT_RESPONSE
  >;
  private promptBuilders: PromptBuilders;
  private systemEvaluator?: SystemEvaluator;

  constructor(
    config: NodeConfig,
    content: NodeContent,
    input: NodeInput,
    adapter: Adapter<
      JSON_CHAT_OPTIONS,
      STREAM_CHAT_OPTIONS,
      STREAM_CHAT_RESPONSE
    >,
    promptBuilders: PromptBuilders,
    systemEvaluator?: SystemEvaluator
  ) {
    this.config = config;
    this.content = content;
    this.input = input;
    this.adapter = adapter;
    this.promptBuilders = promptBuilders;
    this.systemEvaluator = systemEvaluator;
  }

  private isInteractionNodeOrThrow(): void {
    if (this.content.type !== NodeType.INTERACTION) {
      throw new Error(
        buildErrorMessage(this.content, "isInteractionNode", true, false)
      );
    }
  }

  private isBotEvaluationNodeOrThrow(): void {
    if (this.content.type !== NodeType.BOT_EVALUATION) {
      throw new Error(
        buildErrorMessage(this.content, "isBotEvaluation", true, false)
      );
    }
  }

  private isSystemEvaluationNodeOrThrow(): void {
    if (this.content.type !== NodeType.SYSTEM_EVALUATION) {
      throw new Error(
        buildErrorMessage(this.content, "isSystemEvaluation", true, false)
      );
    }
  }

  private isBotDecisionNodeOrThrow(): void {
    if (this.content.type !== NodeType.BOT_DECISION) {
      throw new Error(
        buildErrorMessage(this.content, "isBotDecision", true, false)
      );
    }
  }

  private isSystemDecisionNodeOrThrow(): void {
    if (this.content.type !== NodeType.SYSTEM_DECISION) {
      throw new Error(
        buildErrorMessage(this.content, "isSystemDecision", true, false)
      );
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
      throw new Error(
        buildErrorMessage(
          this.content,
          "status",
          NodeStatus.INITIATED,
          this.getStatus()
        )
      );
    }
  }

  private isProcessingOrThrow(): void {
    if (this.getStatus() !== NodeStatus.PROCESSING) {
      throw new Error(
        buildErrorMessage(
          this.content,
          "status",
          NodeStatus.PROCESSING,
          this.getStatus()
        )
      );
    }
  }

  public async interactBotStream(
    messages: Message[],
    onStreamDone: (text: string) => Awaitable<void>,
    options?: STREAM_CHAT_OPTIONS
  ): Promise<STREAM_CHAT_RESPONSE> {
    // validate
    this.isInteractionNodeOrThrow();
    this.isInitiatedOrThrow();

    // assemble input
    const { prompt } = this.config as InteractionNodeConfig;

    // generate
    const botStreamPrompt = this.promptBuilders.botStream(
      prompt,
      messages.length > 0,
      this.input
    );

    // persist
    const callback = async (generated: string) => {
      this.content.output = {
        ...(this.content.output ?? {}),
        botStreamed: generated,
      };
      await this.adapter.updateNode(this.content);
      await onStreamDone(generated);
    };

    return await this.adapter.streamChat(
      botStreamPrompt,
      messages,
      callback,
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
      this.promptBuilders.botEvaluation(prompt, this.input),
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
      this.systemEvaluator === undefined
        ? {}
        : await this.systemEvaluator(this.input, this.content, this.config);

    // persist
    await this.adapter.updateNode(this.content);
  }

  public async botDecide(jsonChatOptions?: JSON_CHAT_OPTIONS): Promise<void> {
    // validate
    this.isBotDecisionNodeOrThrow();
    this.isInitiatedOrThrow();

    // decide
    const { nextNodeOptions } = this.config;
    const promptedNextNodeOptions =
      typeof nextNodeOptions === "string"
        ? []
        : nextNodeOptions.filter((option) => typeof option !== "string");
    const fullNextNodeKeyPrompt = this.promptBuilders.botDecision(
      promptedNextNodeOptions,
      this.input
    );
    this.content.output =
      typeof nextNodeOptions === "string"
        ? { nextNodeKey: nextNodeOptions }
        : nextNodeOptions.length === 1
        ? {
            nextNodeKey:
              typeof nextNodeOptions[0] === "string"
                ? nextNodeOptions[0]
                : nextNodeOptions[0].nodeKey,
          }
        : promptedNextNodeOptions.length > 0
        ? await this.adapter
            .jsonChat(
              fullNextNodeKeyPrompt,
              "{ nextNodeKey: string, reason: string }",
              jsonChatOptions
            )
            .then((r) => r as DecisionNodeOutput)
        : { nextNodeKey: "invalid nextNodeOptions" };

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
      typeof nextNodeOptions === "string"
        ? { nextNodeKey: nextNodeOptions }
        : nextNodeOptions.length === 1
        ? {
            nextNodeKey:
              typeof nextNodeOptions[0] === "string"
                ? nextNodeOptions[0]
                : nextNodeOptions[0].nodeKey,
          }
        : this.systemEvaluator !== undefined && nextNodeOptions.length > 1
        ? await this.systemEvaluator(this.input, this.content, this.config)
        : { nextNodeKey: "invald nextNodeOptions or systemEvaluator" };

    // persist
    await this.adapter.updateNode(this.content);
  }
}

export { Node };
