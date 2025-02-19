import { DataObject, NextNodeOption } from "./types";
declare const buildFullStreamPrompt: (prompt: string | null, hasPreviousMessages: boolean, input: DataObject | null) => string;
declare const buildFullJsonPrompt: (prompt: string, input: DataObject | null) => string;
declare const buildFullNextNodeKeyPrompt: (nextNodeOptions: NextNodeOption[], input: DataObject | null) => string;
export { buildFullJsonPrompt, buildFullNextNodeKeyPrompt, buildFullStreamPrompt, };
