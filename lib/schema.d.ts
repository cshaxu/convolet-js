import * as z from "zod";
declare const JSON_SCHEMA_PRIMITIVE_STRING: "string";
declare const JSON_SCHEMA_PRIMITIVE_TEXT: "text";
declare const JSON_SCHEMA_PRIMITIVE_BOOLEAN: "boolean";
declare const JSON_SCHEMA_PRIMITIVE_INTEGER: "integer";
declare const JSON_SCHEMA_PRIMITIVE_FLOAT: "float";
declare const JSON_SCHEMA_PRIMITIVE_EMAIL: "email";
declare const JSON_SCHEMA_PRIMITIVE_DATE: "date";
declare const JSON_SCHEMA_PRIMITIVES: string[];
type JsonSchemaPrimitive = typeof JSON_SCHEMA_PRIMITIVE_STRING | typeof JSON_SCHEMA_PRIMITIVE_TEXT | typeof JSON_SCHEMA_PRIMITIVE_BOOLEAN | typeof JSON_SCHEMA_PRIMITIVE_INTEGER | typeof JSON_SCHEMA_PRIMITIVE_FLOAT | typeof JSON_SCHEMA_PRIMITIVE_EMAIL | typeof JSON_SCHEMA_PRIMITIVE_DATE;
type JsonContentPrimitive = string | boolean | number | Date;
type JsonZodPrimitive = z.ZodString | z.ZodBoolean | z.ZodNumber | z.ZodDate;
declare const isJsonSchemaPrimitive: (value: JsonSchemaValue) => value is JsonSchemaPrimitive;
type JsonSchemaLiteral = `"${string}"`;
type JsonContentLiteral = string;
type JsonZodLiteral = z.ZodLiteral<string>;
declare const isJsonSchemaLiteral: (value: JsonSchemaValue) => value is JsonSchemaLiteral;
type JsonSchemaEnum = [JsonSchemaLiteral, ...JsonSchemaLiteral[]];
type JsonContentEnum = string;
type JsonZodEnum = z.ZodLiteral<string> | z.ZodUnion<[
    z.ZodLiteral<string>,
    z.ZodLiteral<string>,
    ...z.ZodLiteral<string>[]
]>;
declare const isJsonSchemaEnum: (type: JsonSchemaValue) => type is JsonSchemaEnum;
type JsonSchemaElement = JsonSchemaPrimitive | [JsonSchemaPrimitive] | JsonSchemaLiteral | JsonSchemaEnum | [JsonSchemaEnum];
type JsonContentElement = JsonContentPrimitive | JsonContentPrimitive[] | JsonContentLiteral | JsonContentEnum | JsonContentEnum[];
declare const isJsonSchemaPrimitiveArray: (value: JsonSchemaValue) => value is [JsonSchemaPrimitive];
declare const isJsonSchemaEnumArray: (value: JsonSchemaValue) => value is [JsonSchemaEnum];
declare const isJsonSchemaElement: (value: JsonSchemaValue) => value is JsonSchemaElement;
type JsonSchemaValue = JsonSchemaElement | JsonSchema | [JsonSchema];
type JsonContentValue = JsonContentElement | JsonContent | JsonContent[];
declare const isJsonSchemaNestedObject: (value: JsonSchemaValue) => value is JsonSchema;
declare const isJsonSchemaNestedObjectArray: (value: JsonSchemaValue) => value is [JsonSchema];
type JsonSchema = {
    [key: string]: JsonSchemaValue;
};
type JsonContent = {
    [key: string]: JsonContentValue;
};
type JsonZod = z.ZodTypeAny;
declare function jsonToZod(json: JsonSchema): z.ZodTypeAny;
declare function jsonToString(json: JsonSchema): string;
export { isJsonSchemaElement, isJsonSchemaEnum, isJsonSchemaEnumArray, isJsonSchemaLiteral, isJsonSchemaNestedObject, isJsonSchemaNestedObjectArray, isJsonSchemaPrimitive, isJsonSchemaPrimitiveArray, JSON_SCHEMA_PRIMITIVE_BOOLEAN, JSON_SCHEMA_PRIMITIVE_DATE, JSON_SCHEMA_PRIMITIVE_EMAIL, JSON_SCHEMA_PRIMITIVE_FLOAT, JSON_SCHEMA_PRIMITIVE_INTEGER, JSON_SCHEMA_PRIMITIVE_STRING, JSON_SCHEMA_PRIMITIVE_TEXT, JSON_SCHEMA_PRIMITIVES, JsonContent, JsonContentElement, JsonContentEnum, JsonContentLiteral, JsonContentPrimitive, JsonContentValue, JsonSchema, JsonSchemaElement, JsonSchemaEnum, JsonSchemaLiteral, JsonSchemaPrimitive, JsonSchemaValue, jsonToString, jsonToZod, JsonZod, JsonZodEnum, JsonZodLiteral, JsonZodPrimitive, };
