import * as z from "zod";
type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends (infer U)[] ? DeepPartial<U>[] : T[K] extends object ? DeepPartial<T[K]> : T[K];
};
declare const JSON_SCHEMA_ELEMENT_STRING: "string";
declare const JSON_SCHEMA_ELEMENT_TEXT: "text";
declare const JSON_SCHEMA_ELEMENT_BOOLEAN: "boolean";
declare const JSON_SCHEMA_ELEMENT_INTEGER: "integer";
declare const JSON_SCHEMA_ELEMENT_FLOAT: "float";
declare const JSON_SCHEMA_ELEMENT_EMAIL: "email";
declare const JSON_SCHEMA_ELEMENT_DATE: "date";
declare const JSON_SCHEMA_ELEMENTS: string[];
type JsonSchemaElement = typeof JSON_SCHEMA_ELEMENT_STRING | typeof JSON_SCHEMA_ELEMENT_TEXT | typeof JSON_SCHEMA_ELEMENT_BOOLEAN | typeof JSON_SCHEMA_ELEMENT_INTEGER | typeof JSON_SCHEMA_ELEMENT_FLOAT | typeof JSON_SCHEMA_ELEMENT_EMAIL | typeof JSON_SCHEMA_ELEMENT_DATE;
type JsonContentElement = string | boolean | number | Date;
type JsonZodElement = z.ZodString | z.ZodBoolean | z.ZodNumber | z.ZodDate;
type JsonSchemaLiteral = `"${string}"`;
type JsonContentLiteral = string;
type JsonZodLiteral = z.ZodLiteral<string>;
type JsonSchemaEnum = [JsonSchemaLiteral, ...JsonSchemaLiteral[]];
type JsonContentEnum = string;
type JsonZodEnum = z.ZodLiteral<string> | z.ZodUnion<[
    z.ZodLiteral<string>,
    z.ZodLiteral<string>,
    ...z.ZodLiteral<string>[]
]>;
type JsonSchemaValue = JsonSchemaElement | [JsonSchemaElement] | JsonSchemaLiteral | JsonSchemaEnum | [JsonSchemaEnum] | JsonSchema | [JsonSchema];
type JsonContentValue = JsonContentElement | JsonContentElement[] | JsonContentLiteral | JsonContentEnum | JsonContentEnum[] | JsonContent | JsonContent[];
type JsonSchema = {
    [key: string]: JsonSchemaValue;
};
type JsonContent = {
    [key: string]: JsonContentValue;
};
type JsonZod = z.ZodTypeAny;
declare function jsonToZod(json: JsonSchema): z.ZodTypeAny;
declare function jsonToString(json: JsonSchema): string;
declare function deepPrune<T>(obj: T): T | undefined;
export { DeepPartial, deepPrune, JSON_SCHEMA_ELEMENT_BOOLEAN, JSON_SCHEMA_ELEMENT_DATE, JSON_SCHEMA_ELEMENT_EMAIL, JSON_SCHEMA_ELEMENT_FLOAT, JSON_SCHEMA_ELEMENT_INTEGER, JSON_SCHEMA_ELEMENT_STRING, JSON_SCHEMA_ELEMENT_TEXT, JSON_SCHEMA_ELEMENTS, JsonContent, JsonContentElement, JsonContentEnum, JsonContentLiteral, JsonContentValue, JsonSchema, JsonSchemaElement, JsonSchemaEnum, JsonSchemaLiteral, JsonSchemaValue, jsonToString, jsonToZod, JsonZod, JsonZodElement, JsonZodEnum, JsonZodLiteral, };
