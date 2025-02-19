import { NextNodeOption, NodeInput } from "./types";
declare const buildFullStreamPrompt: (prompt: string, hasPreviousMessages: boolean, input: NodeInput) => string;
declare const buildFullJsonPrompt: (prompt: string, input: NodeInput) => string;
declare const buildFullNextNodeKeyPrompt: (nextNodeOptions: NextNodeOption[], input: NodeInput) => string;
export { buildFullJsonPrompt, buildFullNextNodeKeyPrompt, buildFullStreamPrompt, };
