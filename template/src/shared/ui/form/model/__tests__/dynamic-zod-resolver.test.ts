import { ResolverOptions } from "react-hook-form";
import { z } from "zod";

import { dynamicZodResolver } from "../dynamic-zod-resolver";

const schema = z.object({
  customerType: z.enum(["person", "company"]),
  needsDelivery: z.boolean(),
  inn: z.string().regex(/^\d{10}$/, "Некорректный ИНН"),
  address: z.string().min(1, "Укажите адрес"),
});

type Values = z.input<typeof schema>;

const resolver = dynamicZodResolver(schema, values => ({
  inn: values.customerType !== "company",
  address: !values.needsDelivery,
}));

const options: ResolverOptions<Values> = {
  fields: {},
  shouldUseNativeValidation: false,
};

describe("dynamicZodResolver", () => {
  it("не валидирует и не возвращает исключённые поля", async () => {
    const result = await resolver(
      {
        customerType: "person",
        needsDelivery: false,
        inn: "старое невалидное значение",
        address: "",
      },
      undefined,
      options,
    );

    expect(result).toEqual({
      errors: {},
      values: {
        customerType: "person",
        needsDelivery: false,
      },
    });
  });

  it("проверяет поля, включённые независимыми условиями", async () => {
    const result = await resolver(
      {
        customerType: "company",
        needsDelivery: true,
        inn: "123",
        address: "",
      },
      undefined,
      options,
    );

    expect(result.values).toEqual({});
    expect(result.errors).toMatchObject({
      inn: { message: "Некорректный ИНН" },
      address: { message: "Укажите адрес" },
    });
  });

  it("дожидается асинхронного refine", async () => {
    const refine = jest.fn(
      async (values: { customerType: "person" | "company" }, context) => {
        await Promise.resolve();

        if (values.customerType === "company") {
          context.addIssue({
            code: "custom",
            path: ["customerType"],
            message: "Компания временно недоступна",
          });
        }
      },
    );
    const asyncResolver = dynamicZodResolver(
      schema,
      values => ({
        inn: values.customerType !== "company",
        address: !values.needsDelivery,
      }),
      refine,
    );
    const result = await asyncResolver(
      {
        customerType: "company",
        needsDelivery: false,
        inn: "1234567890",
        address: "",
      },
      undefined,
      options,
    );

    expect(refine).toHaveBeenCalledTimes(1);
    expect(result.errors).toMatchObject({
      customerType: { message: "Компания временно недоступна" },
    });
  });
});
