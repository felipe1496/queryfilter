import {
  conditionArrSchema,
  fieldSchema,
  operatorSchema,
  orGroupSchema,
  parseValue,
} from "./schemas";
import {
  ConfigType,
  Err,
  FieldType,
  OperatorType,
  StructuredCondition,
  Success,
} from "./types";

export function parseCondition(
  condition: string,
  fields: FieldType[]
): { success: true; data: StructuredCondition } | Err {
  const splitted = condition.split(" ");

  const isArr = conditionArrSchema.safeParse(splitted);
  if (!isArr.success) {
    return {
      success: false,
      message: `An error occured while trying to split condition "${condition}": ${
        isArr.error.errors[0]?.message || "Uncaught error"
      }`,
    };
  }

  const [field = "", operator = "", value = ""] = splitted;

  if (!fields.some((f) => f.name === field.slice(1, -1))) {
    return {
      success: false,
      message: `Unkown field ${field}`,
    };
  }

  const isField = fieldSchema.safeParse(field);
  if (!isField.success) {
    return {
      success: false,
      message: `An error occured while trying to parse field ${field}: ${
        isField.error.errors[0]?.message ?? "Uncaught error"
      }`,
    };
  }

  const isOperator = operatorSchema.safeParse(operator);
  if (!isOperator.success) {
    return {
      success: false,
      message: `An error occured while trying to parse operator ${operator}: ${
        isOperator.error.errors[0]?.message ?? "Uncaught error"
      }`,
    };
  }

  const parsedValue = parseValue(value, operator as OperatorType);

  if (!parsedValue.success) {
    return {
      success: false,
      message: parsedValue.message,
    };
  }

  return {
    success: true,
    data: {
      field,
      operator: isOperator.data,
      value: parsedValue.value,
    },
  };
}

function checkRequiredFields(
  conditions: (StructuredCondition | StructuredCondition[])[],
  fields: FieldType[]
): { success: true } | Err {
  const distinctFields: string[] = [];

  for (const cond of conditions) {
    if (
      typeof cond === "object" &&
      !Array.isArray(cond) &&
      !distinctFields.some((f) => f === cond.field)
    ) {
      distinctFields.push(cond.field);
    }
  }

  for (const fieldConfig of fields) {
    if (
      fieldConfig.required &&
      !distinctFields.some((f) => f.slice(1, -1) === fieldConfig.name)
    ) {
      return {
        success: false,
        message: `Field ${fieldConfig.name} is required as a superior condition`,
      };
    }
  }

  return {
    success: true,
  };
}

export function queryFilter(queryFilter: string, config: ConfigType) {
  const conditions = queryFilter.split(" and ");

  return {
    parse(): Success | Err {
      const parsedConditions: (StructuredCondition | StructuredCondition[])[] =
        [];

      for (const condition of conditions) {
        if (orGroupSchema.safeParse(condition).success) {
          const removeParentheses = condition.slice(1, -1);
          const splitted = removeParentheses.split(" or ");
          const parsedOrConditions: StructuredCondition[] = [];
          for (const cond of splitted) {
            const result = parseCondition(cond, config.fields);

            if (!result.success) {
              return result;
            }

            parsedOrConditions.push(result.data);
          }
          parsedConditions.push(parsedOrConditions);
        } else {
          const result = parseCondition(condition, config.fields);

          if (!result.success) {
            return result;
          }

          parsedConditions.push(result.data);
        }
      }

      const requireds = checkRequiredFields(parsedConditions, config.fields);

      if (!requireds.success) {
        return {
          success: false,
          message: requireds.message,
        };
      }

      return {
        success: true,
        data: parsedConditions,
      };
    },
  };
}
