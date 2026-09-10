/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";

export interface GeminiSchema {
  type: "STRING" | "NUMBER" | "INTEGER" | "BOOLEAN" | "ARRAY" | "OBJECT";
  description?: string;
  nullable?: boolean;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  items?: GeminiSchema;
  enum?: string[];
}

/**
 * Converts a Zod schema into a Gemini/OpenAPI-compatible responseSchema object.
 */
export function zodToGeminiSchema(schema: z.ZodTypeAny): GeminiSchema {
  return unwrapAndConvert(schema);
}

function unwrapAndConvert(schema: z.ZodTypeAny): GeminiSchema {
  // Handle ZodEffects / Preprocess / Pipeline
  if (schema instanceof z.ZodEffects) {
    return unwrapAndConvert(schema._def.schema);
  }
  if (schema instanceof z.ZodPipeline) {
    return unwrapAndConvert(schema._def.in);
  }

  // Handle Optional / Nullable / Default
  if (schema instanceof z.ZodOptional) {
    return unwrapAndConvert(schema._def.innerType);
  }
  if (schema instanceof z.ZodNullable) {
    const inner = unwrapAndConvert(schema._def.innerType);
    return { ...inner, nullable: true };
  }
  if (schema instanceof z.ZodDefault) {
    return unwrapAndConvert(schema._def.innerType);
  }

  // Primitive types
  if (schema instanceof z.ZodString) {
    const result: GeminiSchema = { type: "STRING" };
    if (schema.description) result.description = schema.description;
    return result;
  }

  if (schema instanceof z.ZodNumber) {
    const result: GeminiSchema = {
      type: schema._def.checks?.some((c: any) => c.kind === "int") ? "INTEGER" : "NUMBER",
    };
    if (schema.description) result.description = schema.description;
    return result;
  }

  if (schema instanceof z.ZodBoolean) {
    const result: GeminiSchema = { type: "BOOLEAN" };
    if (schema.description) result.description = schema.description;
    return result;
  }

  if (schema instanceof z.ZodEnum) {
    return {
      type: "STRING",
      enum: schema._def.values,
      description: schema.description,
    };
  }

  if (schema instanceof z.ZodNativeEnum) {
    const enumValues = Object.values(schema._def.values).filter((v) => typeof v === "string") as string[];
    return {
      type: "STRING",
      enum: enumValues.length > 0 ? enumValues : undefined,
      description: schema.description,
    };
  }

  if (schema instanceof z.ZodLiteral) {
    const val = schema._def.value;
    const type =
      typeof val === "number" ? "NUMBER" : typeof val === "boolean" ? "BOOLEAN" : "STRING";
    return {
      type,
      enum: [String(val)],
      description: schema.description,
    };
  }

  // Array type
  if (schema instanceof z.ZodArray) {
    const itemSchema = unwrapAndConvert(schema._def.type);
    const result: GeminiSchema = {
      type: "ARRAY",
      items: itemSchema,
    };
    if (schema.description) result.description = schema.description;
    return result;
  }

  // Object type
  if (schema instanceof z.ZodObject) {
    const shape = typeof schema._def.shape === "function" ? schema._def.shape() : schema._def.shape;
    const properties: Record<string, GeminiSchema> = {};
    const required: string[] = [];

    for (const [key, fieldSchema] of Object.entries(shape)) {
      const field = fieldSchema as z.ZodTypeAny;
      properties[key] = unwrapAndConvert(field);

      const isOptional =
        field instanceof z.ZodOptional ||
        (field instanceof z.ZodDefault && field._def.innerType instanceof z.ZodOptional);

      if (!isOptional) {
        required.push(key);
      }
    }

    const result: GeminiSchema = {
      type: "OBJECT",
      properties,
    };

    if (required.length > 0) {
      result.required = required;
    }

    if (schema.description) {
      result.description = schema.description;
    }

    return result;
  }

  // Union / Discriminated Union
  if (schema instanceof z.ZodUnion || schema instanceof z.ZodDiscriminatedUnion) {
    const options = schema._def.options as z.ZodTypeAny[];
    if (options && options.length > 0) {
      return unwrapAndConvert(options[0]);
    }
  }

  // Record / Any / Unknown fallback
  if (schema instanceof z.ZodRecord || schema instanceof z.ZodAny || schema instanceof z.ZodUnknown) {
    return { type: "OBJECT" };
  }

  return { type: "STRING" };
}

/**
 * Creates a clear human-readable and AI-friendly JSON schema representation.
 */
export function zodToSchemaShapeDescription(schema: z.ZodTypeAny): string {
  function describe(s: z.ZodTypeAny): any {
    if (s instanceof z.ZodEffects) return describe(s._def.schema);
    if (s instanceof z.ZodPipeline) return describe(s._def.in);
    if (s instanceof z.ZodOptional || s instanceof z.ZodDefault) return describe(s._def.innerType);
    if (s instanceof z.ZodNullable) return describe(s._def.innerType);

    if (s instanceof z.ZodString) return "string";
    if (s instanceof z.ZodNumber) return "number";
    if (s instanceof z.ZodBoolean) return "boolean";
    if (s instanceof z.ZodEnum) return s._def.values.join(" | ");
    if (s instanceof z.ZodLiteral) return JSON.stringify(s._def.value);

    if (s instanceof z.ZodArray) {
      return [describe(s._def.type)];
    }

    if (s instanceof z.ZodObject) {
      const shape = typeof s._def.shape === "function" ? s._def.shape() : s._def.shape;
      const res: Record<string, any> = {};
      for (const [k, v] of Object.entries(shape)) {
        res[k] = describe(v as z.ZodTypeAny);
      }
      return res;
    }

    if (s instanceof z.ZodUnion || s instanceof z.ZodDiscriminatedUnion) {
      const options = s._def.options as z.ZodTypeAny[];
      return options?.[0] ? describe(options[0]) : "any";
    }

    return "any";
  }

  try {
    const shape = describe(schema);
    return JSON.stringify(shape, null, 2);
  } catch {
    return "{}";
  }
}
