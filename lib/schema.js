"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSON_SCHEMA_PRIMITIVES = exports.JSON_SCHEMA_PRIMITIVE_TEXT = exports.JSON_SCHEMA_PRIMITIVE_STRING = exports.JSON_SCHEMA_PRIMITIVE_INTEGER = exports.JSON_SCHEMA_PRIMITIVE_FLOAT = exports.JSON_SCHEMA_PRIMITIVE_EMAIL = exports.JSON_SCHEMA_PRIMITIVE_DATE = exports.JSON_SCHEMA_PRIMITIVE_BOOLEAN = exports.isJsonSchemaPrimitiveArray = exports.isJsonSchemaPrimitive = exports.isJsonSchemaNestedObjectArray = exports.isJsonSchemaNestedObject = exports.isJsonSchemaLiteral = exports.isJsonSchemaEnumArray = exports.isJsonSchemaEnum = exports.isJsonSchemaElement = void 0;
exports.jsonToString = jsonToString;
exports.jsonToZod = jsonToZod;
const z = __importStar(require("zod"));
const JSON_SCHEMA_PRIMITIVE_STRING = "string";
exports.JSON_SCHEMA_PRIMITIVE_STRING = JSON_SCHEMA_PRIMITIVE_STRING;
const JSON_SCHEMA_PRIMITIVE_TEXT = "text";
exports.JSON_SCHEMA_PRIMITIVE_TEXT = JSON_SCHEMA_PRIMITIVE_TEXT;
const JSON_SCHEMA_PRIMITIVE_BOOLEAN = "boolean";
exports.JSON_SCHEMA_PRIMITIVE_BOOLEAN = JSON_SCHEMA_PRIMITIVE_BOOLEAN;
const JSON_SCHEMA_PRIMITIVE_INTEGER = "integer";
exports.JSON_SCHEMA_PRIMITIVE_INTEGER = JSON_SCHEMA_PRIMITIVE_INTEGER;
const JSON_SCHEMA_PRIMITIVE_FLOAT = "float";
exports.JSON_SCHEMA_PRIMITIVE_FLOAT = JSON_SCHEMA_PRIMITIVE_FLOAT;
const JSON_SCHEMA_PRIMITIVE_EMAIL = "email";
exports.JSON_SCHEMA_PRIMITIVE_EMAIL = JSON_SCHEMA_PRIMITIVE_EMAIL;
const JSON_SCHEMA_PRIMITIVE_DATE = "date";
exports.JSON_SCHEMA_PRIMITIVE_DATE = JSON_SCHEMA_PRIMITIVE_DATE;
const JSON_SCHEMA_PRIMITIVES = [
    JSON_SCHEMA_PRIMITIVE_STRING,
    JSON_SCHEMA_PRIMITIVE_TEXT,
    JSON_SCHEMA_PRIMITIVE_BOOLEAN,
    JSON_SCHEMA_PRIMITIVE_INTEGER,
    JSON_SCHEMA_PRIMITIVE_FLOAT,
    JSON_SCHEMA_PRIMITIVE_EMAIL,
    JSON_SCHEMA_PRIMITIVE_DATE,
];
exports.JSON_SCHEMA_PRIMITIVES = JSON_SCHEMA_PRIMITIVES;
const isJsonSchemaPrimitive = (value) => typeof value === "string" && JSON_SCHEMA_PRIMITIVES.includes(value);
exports.isJsonSchemaPrimitive = isJsonSchemaPrimitive;
const isJsonSchemaLiteral = (value) => typeof value === "string" && value.startsWith('"') && value.endsWith('"');
exports.isJsonSchemaLiteral = isJsonSchemaLiteral;
const isJsonSchemaEnum = (type) => Array.isArray(type) && type.length > 0 && type.every(isJsonSchemaLiteral);
exports.isJsonSchemaEnum = isJsonSchemaEnum;
const isJsonSchemaPrimitiveArray = (value) => Array.isArray(value) && value.length === 1 && isJsonSchemaPrimitive(value[0]);
exports.isJsonSchemaPrimitiveArray = isJsonSchemaPrimitiveArray;
const isJsonSchemaEnumArray = (value) => Array.isArray(value) && value.length === 1 && isJsonSchemaEnum(value[0]);
exports.isJsonSchemaEnumArray = isJsonSchemaEnumArray;
const isJsonSchemaElement = (value) => isJsonSchemaPrimitive(value) ||
    isJsonSchemaPrimitiveArray(value) ||
    isJsonSchemaLiteral(value) ||
    isJsonSchemaEnum(value) ||
    isJsonSchemaEnumArray(value);
exports.isJsonSchemaElement = isJsonSchemaElement;
const isJsonSchemaNestedObject = (value) => !isJsonSchemaElement(value) &&
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value);
exports.isJsonSchemaNestedObject = isJsonSchemaNestedObject;
const isJsonSchemaNestedObjectArray = (value) => Array.isArray(value) &&
    value.length === 1 &&
    isJsonSchemaNestedObject(value[0]);
exports.isJsonSchemaNestedObjectArray = isJsonSchemaNestedObjectArray;
function buildPrimaryZodObject(primitive) {
    switch (primitive) {
        case JSON_SCHEMA_PRIMITIVE_STRING:
            return z.string();
        case JSON_SCHEMA_PRIMITIVE_TEXT:
            return z.string();
        case JSON_SCHEMA_PRIMITIVE_BOOLEAN:
            return z.boolean();
        case JSON_SCHEMA_PRIMITIVE_INTEGER:
            return z.number().int();
        case JSON_SCHEMA_PRIMITIVE_FLOAT:
            return z.number();
        case JSON_SCHEMA_PRIMITIVE_EMAIL:
            return z.string().email();
        case JSON_SCHEMA_PRIMITIVE_DATE:
            return z.coerce.date();
        default:
            throw new Error(`Unsupported primary type: ${primitive}`);
    }
}
function buildPrimaryString(primitive) {
    if (isJsonSchemaPrimitive(primitive)) {
        return primitive;
    }
    throw new Error(`Unsupported primary type: ${primitive}`);
}
function buildLiteralZodObject(literal) {
    if (isJsonSchemaLiteral(literal)) {
        return z.literal(literal.slice(1, -1));
    }
    throw new Error(`Unsupported literal type: ${literal}`);
}
function buildLiteralString(literal) {
    if (isJsonSchemaLiteral(literal)) {
        return literal;
    }
    throw new Error(`Unsupported literal type: ${literal}`);
}
function buildPrimaryOrLiteralZodObject(value) {
    if (isJsonSchemaPrimitive(value)) {
        return buildPrimaryZodObject(value);
    }
    else if (isJsonSchemaLiteral(value)) {
        return buildLiteralZodObject(value);
    }
    else {
        throw new Error(`Unsupported type: ${value}`);
    }
}
function buildPrimaryOrLiteralString(value) {
    if (isJsonSchemaPrimitive(value)) {
        return buildPrimaryString(value);
    }
    else if (isJsonSchemaLiteral(value)) {
        return buildLiteralString(value);
    }
    else {
        throw new Error(`Unsupported type: ${value}`);
    }
}
function buildEnumZodObject(literals) {
    const isAllLiteral = literals.every((v) => typeof v === "string" && v.startsWith('"') && v.endsWith('"'));
    if (!isAllLiteral) {
        throw new Error(`Unsupported enum type: [${literals.join("|")}]`);
    }
    if (literals.length === 0) {
        throw new Error("Unsupported enum type: []");
    }
    else if (literals.length === 1) {
        return buildLiteralZodObject(literals[0]);
    }
    else {
        return z.union(literals.map((v) => z.literal(v.slice(1, -1))));
    }
}
function buildEnumString(literals) {
    const isAllLiteral = literals.every((v) => typeof v === "string" && v.startsWith('"') && v.endsWith('"'));
    if (!isAllLiteral) {
        throw new Error(`Unsupported enum type: [${literals.join("|")}]`);
    }
    if (literals.length === 0) {
        throw new Error("Unsupported enum type: []");
    }
    else if (literals.length === 1) {
        return buildLiteralString(literals[0]);
    }
    else {
        return literals.join("|");
    }
}
function buildArrayOrEnumZodObject(value) {
    if (value.length === 0) {
        throw new Error("Unsupported type: []");
    }
    if (value.length === 1) {
        const v = value[0];
        if (typeof v === "object") {
            if (Array.isArray(v)) {
                // [JsonSchemaEnum]
                return buildEnumZodObject(v).array().catch([]);
            }
            else {
                // [JsonSchema]
                return jsonToZod(v).array().catch([]);
            }
        }
        else if (typeof v === "string") {
            // [JsonSchemaPrimitive] or JsonSchemaEnum ([JsonSchemaLiteral])
            return buildPrimaryOrLiteralZodObject(v)
                .array()
                .catch([]);
        }
        else {
            throw new Error(`Unsupported type: ${value}`);
        }
    }
    else {
        // JsonSchemaEnum ([JsonSchemaLiteral, JsonSchemaLiteral, ...JsonSchemaLiteral[]])
        return buildEnumZodObject(value);
    }
}
function buildArrayOrEnumString(value) {
    if (value.length === 0) {
        throw new Error("Unsupported type: []");
    }
    if (value.length === 1) {
        const v = value[0];
        if (typeof v === "object") {
            if (Array.isArray(v)) {
                // [JsonSchemaEnum]
                return `(${buildEnumString(v)})[]`;
            }
            else {
                // [JsonSchema]
                return `${jsonToString(v)}[]`;
            }
        }
        else if (typeof v === "string") {
            if (isJsonSchemaPrimitive(v)) {
                // [JsonSchemaPrimitive]
                return `${buildPrimaryString(v)}[]`;
            }
            else if (isJsonSchemaLiteral(v)) {
                // JsonSchemaEnum ([JsonSchemaLiteral])
                return `(${buildLiteralString(v)})[]`;
            }
            else {
                throw new Error(`Unsupported type: ${value}`);
            }
        }
        else {
            throw new Error(`Unsupported type: ${value}`);
        }
    }
    else {
        // JsonSchemaEnum ([JsonSchemaLiteral, JsonSchemaLiteral, ...JsonSchemaLiteral[]])
        return buildEnumString(value);
    }
}
function jsonToZod(json) {
    return Object.entries(json).reduce((acc, [key, value]) => {
        let obj;
        if (typeof value === "string") {
            obj = buildPrimaryOrLiteralZodObject(value);
        }
        else if (typeof value === "object" && Array.isArray(value)) {
            obj = buildArrayOrEnumZodObject(value);
        }
        else if (typeof value === "object" && Object.keys(value).length > 0) {
            obj = jsonToZod(value);
        }
        else {
            throw new Error(`Unsupported type: ${value}`);
        }
        return acc.extend({ [key]: obj.optional().catch(undefined) });
    }, z.object({}));
}
function jsonToString(json) {
    const newJson = Object.entries(json).reduce((acc, [key, value]) => {
        let s;
        if (typeof value === "string") {
            s = buildPrimaryOrLiteralString(value);
        }
        else if (typeof value === "object" && Array.isArray(value)) {
            s = buildArrayOrEnumString(value);
        }
        else if (typeof value === "object" && Object.keys(value).length > 0) {
            s = jsonToString(value);
        }
        else {
            throw new Error(`Unsupported type: ${value}`);
        }
        acc[key] = s;
        return acc;
    }, {});
    return JSON.stringify(newJson)
        .replace(/\\"/g, "\u0001")
        .replace(/"/g, "")
        .replace(/\u0001/g, '"');
}
//# sourceMappingURL=schema.js.map