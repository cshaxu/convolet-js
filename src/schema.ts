import * as z from "zod";

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (infer U)[] // Check if it's an array
    ? DeepPartial<U>[] // Apply DeepPartial to each element inside the array
    : T[K] extends object
    ? DeepPartial<T[K]> // Recursively process objects
    : T[K]; // Keep primitives unchanged
};

const JSON_SCHEMA_ELEMENT_STRING = "string" as const;
const JSON_SCHEMA_ELEMENT_TEXT = "text" as const;
const JSON_SCHEMA_ELEMENT_BOOLEAN = "boolean" as const;
const JSON_SCHEMA_ELEMENT_INTEGER = "integer" as const;
const JSON_SCHEMA_ELEMENT_FLOAT = "float" as const;
const JSON_SCHEMA_ELEMENT_EMAIL = "email" as const;
const JSON_SCHEMA_ELEMENT_DATE = "date" as const;

const JSON_SCHEMA_ELEMENTS: string[] = [
  JSON_SCHEMA_ELEMENT_STRING,
  JSON_SCHEMA_ELEMENT_TEXT,
  JSON_SCHEMA_ELEMENT_BOOLEAN,
  JSON_SCHEMA_ELEMENT_INTEGER,
  JSON_SCHEMA_ELEMENT_FLOAT,
  JSON_SCHEMA_ELEMENT_EMAIL,
  JSON_SCHEMA_ELEMENT_DATE,
];

type JsonSchemaElement =
  | typeof JSON_SCHEMA_ELEMENT_STRING
  | typeof JSON_SCHEMA_ELEMENT_TEXT
  | typeof JSON_SCHEMA_ELEMENT_BOOLEAN
  | typeof JSON_SCHEMA_ELEMENT_INTEGER
  | typeof JSON_SCHEMA_ELEMENT_FLOAT
  | typeof JSON_SCHEMA_ELEMENT_EMAIL
  | typeof JSON_SCHEMA_ELEMENT_DATE;
type JsonContentElement = string | boolean | number | Date;

type JsonZodElement = z.ZodString | z.ZodBoolean | z.ZodNumber | z.ZodDate;

type JsonSchemaLiteral = `"${string}"`;
type JsonContentLiteral = string;
type JsonZodLiteral = z.ZodLiteral<string>;

type JsonSchemaEnum = [JsonSchemaLiteral, ...JsonSchemaLiteral[]];
type JsonContentEnum = string;
type JsonZodEnum =
  | z.ZodLiteral<string>
  | z.ZodUnion<
      [z.ZodLiteral<string>, z.ZodLiteral<string>, ...z.ZodLiteral<string>[]]
    >;

type JsonSchemaValue =
  | JsonSchemaElement // primary type
  | [JsonSchemaElement] // array of primary type
  | JsonSchemaLiteral // literal
  | JsonSchemaEnum // enum
  | [JsonSchemaEnum] // array of enum
  | JsonSchema // nested object
  | [JsonSchema]; // array of nested objects
type JsonContentValue =
  | JsonContentElement // primary type
  | JsonContentElement[] // array of primary type
  | JsonContentLiteral // literal
  | JsonContentEnum // enum
  | JsonContentEnum[] // array of enum
  | JsonContent // nested object
  | JsonContent[]; // array of nested objects

type JsonSchema = { [key: string]: JsonSchemaValue };
type JsonContent = { [key: string]: JsonContentValue };
type JsonZod = z.ZodTypeAny;

function buildPrimaryZodObject(value: JsonSchemaElement): JsonZodElement {
  switch (value) {
    case JSON_SCHEMA_ELEMENT_STRING:
      return z.string();
    case JSON_SCHEMA_ELEMENT_TEXT:
      return z.string();
    case JSON_SCHEMA_ELEMENT_BOOLEAN:
      return z.boolean();
    case JSON_SCHEMA_ELEMENT_INTEGER:
      return z.number().int();
    case JSON_SCHEMA_ELEMENT_FLOAT:
      return z.number();
    case JSON_SCHEMA_ELEMENT_EMAIL:
      return z.string().email();
    case JSON_SCHEMA_ELEMENT_DATE:
      return z.coerce.date();
    default:
      throw new Error(`Unsupported primary type: ${value}`);
  }
}

function buildPrimaryString(value: JsonSchemaElement): string {
  if (JSON_SCHEMA_ELEMENTS.includes(value)) {
    return value;
  }
  throw new Error(`Unsupported primary type: ${value}`);
}

function buildLiteralZodObject(literal: JsonSchemaLiteral): JsonZodLiteral {
  if (literal.startsWith('"') && literal.endsWith('"')) {
    return z.literal(literal.slice(1, -1));
  }
  throw new Error(`Unsupported literal type: ${literal}`);
}

function buildLiteralString(literal: JsonSchemaLiteral): string {
  if (literal.startsWith('"') && literal.endsWith('"')) {
    return literal;
  }
  throw new Error(`Unsupported literal type: ${literal}`);
}

function buildPrimaryOrLiteralZodObject(
  value: JsonSchemaElement | JsonSchemaLiteral
): JsonZodElement | JsonZodLiteral {
  if (JSON_SCHEMA_ELEMENTS.includes(value)) {
    return buildPrimaryZodObject(value as JsonSchemaElement);
  } else if (value.startsWith('"') && value.endsWith('"')) {
    return buildLiteralZodObject(value as JsonSchemaLiteral);
  } else {
    throw new Error(`Unsupported type: ${value}`);
  }
}

function buildPrimaryOrLiteralString(
  value: JsonSchemaElement | JsonSchemaLiteral
): string {
  if (JSON_SCHEMA_ELEMENTS.includes(value)) {
    return buildPrimaryString(value as JsonSchemaElement);
  } else if (value.startsWith('"') && value.endsWith('"')) {
    return buildLiteralString(value as JsonSchemaLiteral);
  } else {
    throw new Error(`Unsupported type: ${value}`);
  }
}

function buildEnumZodObject(literals: JsonSchemaEnum): JsonZodEnum {
  const isAllLiteral = literals.every(
    (v) => typeof v === "string" && v.startsWith('"') && v.endsWith('"')
  );
  if (!isAllLiteral) {
    throw new Error(`Unsupported enum type: [${literals.join("|")}]`);
  }
  if (literals.length === 0) {
    throw new Error("Unsupported enum type: []");
  } else if (literals.length === 1) {
    return buildLiteralZodObject(literals[0]);
  } else {
    return z.union(
      literals.map((v) => z.literal(v.slice(1, -1))) as [
        z.ZodLiteral<string>,
        z.ZodLiteral<string>,
        ...z.ZodLiteral<string>[]
      ]
    );
  }
}

function buildEnumString(literals: JsonSchemaEnum): string {
  const isAllLiteral = literals.every(
    (v) => typeof v === "string" && v.startsWith('"') && v.endsWith('"')
  );
  if (!isAllLiteral) {
    throw new Error(`Unsupported enum type: [${literals.join("|")}]`);
  }
  if (literals.length === 0) {
    throw new Error("Unsupported enum type: []");
  } else if (literals.length === 1) {
    return buildLiteralString(literals[0]);
  } else {
    return literals.join("|");
  }
}

function buildArrayOrEnumZodObject(
  value: [JsonSchemaEnum] | [JsonSchemaElement] | JsonSchemaEnum | JsonSchema[]
): z.ZodTypeAny | JsonZodEnum {
  if (value.length === 0) {
    throw new Error("Unsupported type: []");
  }
  if (value.length === 1) {
    const v = value[0];
    if (typeof v === "object") {
      if (Array.isArray(v)) {
        // [JsonSchemaEnum]
        return buildEnumZodObject(v).array().catch([]);
      } else {
        // [JsonSchema]
        return jsonToZod(v).array().catch([]);
      }
    } else if (typeof v === "string") {
      // [JsonSchemaElement] or JsonSchemaEnum ([JsonSchemaLiteral])
      return (
        buildPrimaryOrLiteralZodObject(
          v as JsonSchemaElement | JsonSchemaLiteral
        ) as z.ZodTypeAny
      )
        .array()
        .catch([]);
    } else {
      throw new Error(`Unsupported type: ${value}`);
    }
  } else {
    // JsonSchemaEnum ([JsonSchemaLiteral, JsonSchemaLiteral, ...JsonSchemaLiteral[]])
    return buildEnumZodObject(value as JsonSchemaEnum);
  }
}

function buildArrayOrEnumString(
  value: [JsonSchemaEnum] | [JsonSchemaElement] | JsonSchemaEnum | JsonSchema[]
): string {
  if (value.length === 0) {
    throw new Error("Unsupported type: []");
  }
  if (value.length === 1) {
    const v = value[0];
    if (typeof v === "object") {
      if (Array.isArray(v)) {
        // [JsonSchemaEnum]
        return `(${buildEnumString(v)})[]`;
      } else {
        // [JsonSchema]
        return `${jsonToString(v)}[]`;
      }
    } else if (typeof v === "string") {
      if (JSON_SCHEMA_ELEMENTS.includes(v)) {
        // [JsonSchemaElement]
        return `${buildPrimaryString(v as JsonSchemaElement)}[]`;
      } else if (v.startsWith('"') && v.endsWith('"')) {
        // JsonSchemaEnum ([JsonSchemaLiteral])
        return `(${buildLiteralString(v as JsonSchemaLiteral)})[]`;
      } else {
        throw new Error(`Unsupported type: ${value}`);
      }
    } else {
      throw new Error(`Unsupported type: ${value}`);
    }
  } else {
    // JsonSchemaEnum ([JsonSchemaLiteral, JsonSchemaLiteral, ...JsonSchemaLiteral[]])
    return buildEnumString(value as JsonSchemaEnum);
  }
}

function jsonToZod(json: JsonSchema): z.ZodTypeAny {
  return Object.entries(json).reduce((acc, [key, value]) => {
    let obj: z.ZodTypeAny;
    if (typeof value === "string") {
      obj = buildPrimaryOrLiteralZodObject(value);
    } else if (typeof value === "object" && Array.isArray(value)) {
      obj = buildArrayOrEnumZodObject(value);
    } else if (typeof value === "object" && Object.keys(value).length > 0) {
      obj = jsonToZod(value);
    } else {
      throw new Error(`Unsupported type: ${value}`);
    }
    return acc.extend({ [key]: obj.optional().catch(undefined) });
  }, z.object({})) as z.ZodTypeAny;
}

function jsonToString(json: JsonSchema): string {
  const newJson = Object.entries(json).reduce((acc, [key, value]) => {
    let s: string;
    if (typeof value === "string") {
      s = buildPrimaryOrLiteralString(value);
    } else if (typeof value === "object" && Array.isArray(value)) {
      s = buildArrayOrEnumString(value);
    } else if (typeof value === "object" && Object.keys(value).length > 0) {
      s = jsonToString(value);
    } else {
      throw new Error(`Unsupported type: ${value}`);
    }
    (acc as any)[key] = s;
    return acc;
  }, {} as any);
  return JSON.stringify(newJson)
    .replace(/\\"/g, "\u0001")
    .replace(/"/g, "")
    .replace(/\u0001/g, '"');
}

function deepPrune<T>(obj: T): T | undefined {
  if (obj === null || (typeof obj !== "object" && typeof obj !== "string")) {
    return obj;
  }

  if (typeof obj === "string") {
    if (obj.trim().length === 0) {
      return undefined;
    } else {
      return obj;
    }
  }

  if (Array.isArray(obj)) {
    const array = obj
      .map(deepPrune)
      .filter((o) => o !== undefined) as unknown as T;
    if ((array as any).length === 0) {
      return undefined;
    }
  }

  const object = Object.entries(obj).reduce((acc, [key, value]) => {
    const purified = deepPrune(value);
    if (purified !== undefined) {
      (acc as any)[key] = purified;
    }
    return acc;
  }, {} as T);
  if (Object.keys(object as any).length === 0) {
    return undefined;
  }
  return object;
}

export {
  DeepPartial,
  deepPrune,
  JSON_SCHEMA_ELEMENT_BOOLEAN,
  JSON_SCHEMA_ELEMENT_DATE,
  JSON_SCHEMA_ELEMENT_EMAIL,
  JSON_SCHEMA_ELEMENT_FLOAT,
  JSON_SCHEMA_ELEMENT_INTEGER,
  JSON_SCHEMA_ELEMENT_STRING,
  JSON_SCHEMA_ELEMENT_TEXT,
  JSON_SCHEMA_ELEMENTS,
  JsonContent,
  JsonContentElement,
  JsonContentEnum,
  JsonContentLiteral,
  JsonContentValue,
  JsonSchema,
  JsonSchemaElement,
  JsonSchemaEnum,
  JsonSchemaLiteral,
  JsonSchemaValue,
  jsonToString,
  jsonToZod,
  JsonZod,
  JsonZodElement,
  JsonZodEnum,
  JsonZodLiteral,
};
