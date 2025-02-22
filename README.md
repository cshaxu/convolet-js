# Convolet: AI Workflow Framework with Human in the Loop

Convolet is a TypeScript-based workflow framework designed for AI agents that require human intervention at key decision points. It allows developers to define structured workflows, combining LLM-based evaluations, code-executed tasks, and interactive nodes where users can provide input during execution.

![diagram](https://github.com/user-attachments/assets/b3d17feb-e77f-442c-908d-45ffe19f1a8e)

## Why Convolet?

- **Flexible AI-powered workflows** – Define and execute complex workflows combining LLM-based decision-making, system code evaluation, and user interactions.
- **Human in the loop** – Stream AI-generated questions and allow users to respond, making workflows more interactive and adaptable.
- **Persistent and extensible** – Plug in a database adapter to store workflow execution states and integrate with different LLMs.
- **Customizable execution flow** – Configure step-by-step execution with hooks for debugging, logging, and observability.
- **Supports streaming responses** – LLM-generated queries can be streamed to frontend clients for real-time interactivity.

---

## Quick Start

### Installation

```sh
npm install convolet
```

### Define a Flow

A flow consists of nodes that define the steps in your AI-powered workflow. Nodes can be:

- **Evaluation Nodes**: Compute results via system functions or LLM prompts.
- **Decision Nodes**: Choose next step from options via system functions or LLM prompts.
- **Interactive Nodes**: Stream bot-generated questions and wait for user input.

Example of defining a workflow:

```ts
import { Flow } from "convolet";

// define a flow configuration
const flowConfig: FlowConfig = {
  flowKey: "sample",
  startNodeKey: "start",
  endNodeKey: "end",
  nodes: [
    {
      nodeType: NodeType.BOT_EVALUATION,
      nodeKey: "start",
      inputParams: ["year"], // take year as input
      outputParams: "data", // set "data" variable from the output
      nextNodeOptions: "end",
      prompt: "Find out whether the year is a leap year.",
      schema: "{ year: number; isLeapYear: boolean }",
    },
    {
      nodeType: NodeType.BOT_EVALUATION,
      nodeKey: "end",
      inputParams: ["data"], // takes "data" variable as input from previous node
      outputParams: ["isLeapYear"], // set "isLeapYear" variable to the output
      nextNodeOptions: [],
      prompt:
        "Tell if 3 year before the year from the input data is a leap year.",
      schema:
        "{ originalYear: number; threeYearsAgo: number; isLealYear: boolean }",
    },
  ],
};
```

### Create adapter for db and llm

You need to create an adapter to wire up your db and llm to the framework.

Here's an example:

```ts
const adapter: Adapter<
  JsonChatOptions,
  StreamChatOptions,
  ReadableStream<string>
> = {
  getFlow: async (id: string): Promise<FlowContent> => {
    const flow = await db.flow.findFirst({ where: { id } });
    if (flow === null) {
      throw createHttpError.NotFound();
    }
    return flow;
  },
  createFlow: async (
    config: FlowConfig,
    memory: FlowMemory
  ): Promise<FlowContent> => {
    return await db.flow.create({
      data: { key: config.flowKey, config, memory },
    });
  },
  updateFlow: async (id: string, memory: FlowMemory): Promise<FlowContent> => {
    return await db.flow.update({ where: { id }, data: { memory } });
  },
  deleteFlow: async (id: string): Promise<FlowContent> => {
    return await db.flow.delete({ where: { id } });
  },
  getNodes: async (flowId: string): Promise<NodeContent[]> => {
    return await db.nodes.findMany({
      where: { flowId },
      orderBy: { index: "asc" },
    });
  },
  createNode: async (content: NodeContent): Promise<NodeContent> => {
    return await db.node.create({ data: buildPrismaNodeContent(content) });
  },
  updateNode: async (content: NodeContent): Promise<NodeContent> => {
    const flowId_index = { flowId: content.flowId, index: content.index };
    return await db.node.update(
      { where: { flowId_index }, data: buildPrismaNodeContent(content) },
      context
    );
  },
  deleteNodes: async (flowId: string): Promise<number> => {
    const { count } = await db.node.deleteMany({ where: { flowId } });
    return count;
  },
  streamChat: async (
    prompt: string,
    messages: Message[],
    onStreamDone: (text: string) => Promise<void>,
    options?: StreamChatOptions
  ): Promise<ReadableStream<string>> => {
    const systemMessage = { role: "system" as const, content: prompt };
    const allMessages = [
      systemMessage,
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    return await ai.stream(allMessages, onStreamDone, options);
  },
  jsonChat: async (
    prompt: string,
    schema: string,
    options?: JsonChatOptions
  ): Promise<DataObject> => {
    return await ai.json(prompt, schema, options);
  },
};
```

### Initialize the flow

You can create a new flow using the `Flow.create` method:

```ts
// create a flow which will take initial input
const flow = await Flow.create(
  flowConfig,
  { year: 2000 }, // initial input with "data" variable
  adapter
);
```

Once a flow is created and you want to resume it from the db:

```ts
// load an exsiting flow from the db
const flow = await Flow.get(flowId, adapter);
```

### Running the Flow

To start running a flow until the stop point:

```ts
const result = await flow.run();
```

The flow will run until you get the result.

- If the flow stops at an interactive node, it will return `null`.
- If it stops at the end, it will return the final result.

When the flow is in an interactive state, you may want to
stream the bot message to the user:

```ts
const streamResponse = await flow.stream(callback);
```

Then, when user sends back the answer, you can resume it:

```ts
const result = await flow.run({ userInput: "some message" });
```

## Basic Concepts

### Flow

A **Flow** represents a structured workflow consisting of nodes that execute actions in sequence.

### Node

Nodes are the building blocks of a flow. Types include:

- **Evaluation Node**: Generates an output via system functions or LLM.
  - **Bot Evaluation Node**: Uses LLM to generate a result.
  - **System Evaluation Node**: Uses system functions to generate a result.
- **Decision Node**: Selects an option based on prompts or system logic.
  - **Bot Decision Node**: Uses LLM to decide the next step.
  - **System Decision Node**: Uses system functions to decide the next step.
- **Interactive Node**: Streams a bot question and waits for user input.

### Adapter

Adapters enable persistence and integration with LLMs, defining how the framework interacts with databases and AI models.

## Contributing

We welcome contributions! Feel free to submit issues and pull requests.

## License

MIT
