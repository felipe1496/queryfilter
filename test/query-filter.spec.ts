import { queryFilter } from "../src";
import { StructuredCondition } from "../src/types";

describe("Should test eq operator", () => {
  test("Should correctly transform to structures condition", () => {
    const conditions = queryFilter(`"EMPRESA" eq '1000'`, {
      fields: [
        {
          name: "EMPRESA",
        },
      ],
    }).parse();

    if (!conditions.success) {
      throw new Error("Error in conditions");
    }

    expect(conditions.data).toHaveLength(1);
    expect((conditions.data[0] as StructuredCondition).field).toBe('"EMPRESA"');
    expect((conditions.data[0] as StructuredCondition).operator).toBe("=");
    expect((conditions.data[0] as StructuredCondition).value).toBe("'1000'");
  });
  test("Should accept str as value", () => {
    const conditions = queryFilter(`"EMPRESA" eq 'mystr'`, {
      fields: [
        {
          name: "EMPRESA",
        },
      ],
    }).parse();

    if (!conditions.success) {
      throw new Error("Error in conditions");
    }

    expect(conditions.data).toHaveLength(1);
    expect(
      (conditions.data[0] as StructuredCondition).value.startsWith("'")
    ).toBe(true);
    expect(
      (conditions.data[0] as StructuredCondition).value.endsWith("'")
    ).toBe(true);
  });
  test("Should accept number as value", () => {
    const conditions = queryFilter(`"EMPRESA" eq 111`, {
      fields: [
        {
          name: "EMPRESA",
        },
      ],
    }).parse();

    if (!conditions.success) {
      throw new Error("Error in conditions");
    }

    expect(conditions.data).toHaveLength(1);
    expect((conditions.data[0] as StructuredCondition).value).toMatch(/^\d+$/);
  });
  test("Should not accept number with letters", () => {
    const conditions = queryFilter(`"EMPRESA" eq 1aa11`, {
      fields: [
        {
          name: "EMPRESA",
        },
      ],
    }).parse();

    expect(conditions.success).toBe(false);
  });
  test("Should accept string with numbers", () => {
    const conditions = queryFilter(`"EMPRESA" eq '3030'`, {
      fields: [
        {
          name: "EMPRESA",
        },
      ],
    }).parse();

    if (!conditions.success) {
      throw new Error("Error in conditions");
    }

    expect(conditions.data).toHaveLength(1);

    expect(
      (conditions.data[0] as StructuredCondition).value.startsWith("'")
    ).toBe(true);
    expect(
      (conditions.data[0] as StructuredCondition).value.endsWith("'")
    ).toBe(true);
    const removeQuotes = (
      conditions.data[0] as StructuredCondition
    ).value.slice(1, -1);
    expect(removeQuotes).toMatch(/^\d+$/);
  });
  test("Should not accept list as value", () => {
    const conditions = queryFilter(`"EMPRESA" eq ('3030', 90)`, {
      fields: [
        {
          name: "EMPRESA",
        },
      ],
    }).parse();

    expect(conditions.success).toBe(false);
  });
  test("Should not accept null as value", () => {
    const conditions = queryFilter(`"EMPRESA" eq null`, {
      fields: [
        {
          name: "EMPRESA",
        },
      ],
    }).parse();

    expect(conditions.success).toBe(false);
  });
});

describe("Should test sw operator", () => {
  test("Should correctly transform to structures condition", () => {
    const conditions = queryFilter(`"EMPRESA" sw '1000'`, {
      fields: [
        {
          name: "EMPRESA",
        },
      ],
    }).parse();

    if (!conditions.success) {
      throw new Error("Error in conditions");
    }

    expect(conditions.data).toHaveLength(1);
    expect(conditions.data[0]).toHaveProperty("operator");
    expect((conditions.data[0] as StructuredCondition).operator).toBe("like");
    expect((conditions.data[0] as StructuredCondition).value).toMatch(/\%'$/);
  });
});
