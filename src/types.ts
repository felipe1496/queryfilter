import { z } from "zod";
import { operatorSchema } from "./schemas.js";

export type StructuredCondition = {
  field: string;
  operator: string;
  value: string;
};

export type Err = {
  success: false;
  message: string;
};

export type Success = {
  success: true;
  data: (StructuredCondition | StructuredCondition[])[];
};

export type FieldType = {
  name: string;
  required?: boolean;
};

export type ConfigType = {
  fields: FieldType[];
};

export type OperatorType = z.infer<typeof operatorSchema>;
