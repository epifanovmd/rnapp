import { ValueHolder } from "../value-holder";

describe("ValueHolder", () => {
  it("resolves direct and lazy values and reports changes", async () => {
    const holder = new ValueHolder(1);

    expect(holder.value).toBe(1);
    expect(holder.isLambda).toBe(false);

    const changed = holder.whenChanged();

    holder.setValue(() => 2);
    await changed;

    expect(holder.value).toBe(2);
    expect(holder.isLambda).toBe(true);
  });
});
