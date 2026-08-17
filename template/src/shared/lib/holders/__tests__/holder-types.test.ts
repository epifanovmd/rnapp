import {
  isCancelError,
  isCancelResponse,
  toHolderError,
} from "../holder.types";
import { cancelError, cancelResponse } from "./holder-test-utils";

describe("holder types", () => {
  it("normalizes errors and recognizes cancellations", () => {
    const coded = Object.assign(new Error("failed"), { code: "E_FAIL" });

    expect(toHolderError(coded)).toEqual({ message: "failed", code: "E_FAIL" });
    expect(toHolderError("failed")).toEqual({ message: "failed" });
    expect(toHolderError({ reason: 1 })).toEqual({
      message: "Unknown error",
      details: { reason: 1 },
    });
    expect(isCancelResponse(cancelResponse)).toBe(true);
    expect(isCancelResponse(null)).toBe(false);
    expect(isCancelError(cancelError)).toBe(true);
    expect(isCancelError(new Error("failed"))).toBe(false);
  });
});
