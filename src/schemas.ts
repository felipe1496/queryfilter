import { z } from "zod";
import { Err, OperatorType, Success } from "./types.js";

export const conditionArrSchema = z.array(z.string()).length(3);

export const fieldSchema = z
  .string()
  .startsWith(`"`)
  .endsWith(`"`)
  .superRefine((value, ctx) => {
    const removedQuotes = value.slice(1, -1);

    if (!removedQuotes.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `field ${value} must have length greater than 0`,
      });
    }
  })
  .superRefine((value, ctx) => {
    const removedQuotes = value.slice(1, -1);
    const numbersAndLetters = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;
    if (!numbersAndLetters.test(removedQuotes)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `field ${value} is not a valid column name`,
      });
    }
  });

export const operatorSchema = z
  .enum([
    "eq",
    "sw",
    "ew",
    "like",
    "ge",
    "gt",
    "le",
    "lt",
    "ne",
    "is",
    "isnot",
    "in",
    "notin",
  ])
  .transform((op) => {
    switch (op) {
      case "eq":
        return "=";
      case "sw":
      case "ew":
      case "like":
        return "like";
      case "ge":
        return ">=";
      case "gt":
        return ">";
      case "le":
        return "<=";
      case "lt":
        return "<";
      case "ne":
        return "!=";
      case "is":
        return "is";
      case "isnot":
        return "is not";
      case "in":
        return "in";
      case "notin":
        return "not in";
      default:
        return "";
    }
  });

const strValue = z
  .string()
  .startsWith("'")
  .endsWith("'")
  .refine((value) => {
    const removedQuotes = value.slice(1, -1);

    if (!removedQuotes.length) {
      return false;
    }

    return true;
  });
const numberValue = z.string().refine((value) => {
  const numbers = /^[0-9]+$/;

  if (!numbers.test(value)) {
    return false;
  }

  return true;
});

export function parseValue(
  value: string,
  operator: string
): { success: true; value: string } | Err {
  switch (operator) {
    case "ge":
    case "gt":
    case "le":
    case "lt":
    case "ne":
    case "eq": {
      if (
        !strValue.safeParse(value).success &&
        !numberValue.safeParse(value).success
      ) {
        return {
          success: false,
          message: `Value ${value} must be number or start with ' and end with ' if intend to be string`,
        };
      }
      return {
        success: true,
        value,
      };
    }
    case "sw": {
      if (!strValue.safeParse(value).success) {
        return {
          success: false,
          message: `value ${value} must be string`,
        };
      }

      return {
        success: true,
        value: `'${value}%'`,
      };
    }
    case "ew": {
      if (!strValue.safeParse(value).success) {
        return {
          success: false,
          message: `value ${value} must be string`,
        };
      }

      return {
        success: true,
        value: `'%${value}'`,
      };
    }
    case "like": {
      if (!strValue.safeParse(value).success) {
        return {
          success: false,
          message: `value ${value} must be string`,
        };
      }

      return {
        success: true,
        value,
      };
    }
    case "notin":
    case "in":
      if (!z.string().startsWith("(").endsWith(")").safeParse(value).success) {
        return {
          success: false,
          message: `value ${value} is not list`,
        };
      }

      return {
        success: true,
        value,
      };
    case "isnot":
    case "is": {
      if (value !== "null") {
        return {
          success: false,
          message: "value must be null",
        };
      }
      return {
        success: true,
        value,
      };
    }
    default:
      return {
        success: false,
        message: "An error occured while trying to parse value",
      };
  }
}

export const orGroupSchema = z.string().startsWith("(").endsWith(")");
