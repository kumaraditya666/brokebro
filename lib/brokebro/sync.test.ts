import { describe, expect, it } from "vitest";
import { unionById } from "./sync";

describe("cloud merge", () => {
  it("unions cloud + local by id without duplicating remapped rows", () => {
    const cloud = [{ id: "uuid-1", v: "cloud" }];
    const local = [
      { id: "uuid-1", v: "local-edited" }, // same row, pushed+remapped → no duplicate
      { id: "txn_local", v: "not-yet-pushed" },
    ];
    const out = unionById(cloud, local);
    expect(out).toHaveLength(2);
    expect(out.find((r) => r.id === "uuid-1")?.v).toBe("local-edited"); // local wins
    expect(out.find((r) => r.id === "txn_local")).toBeDefined();
  });

  it("empty cloud never wipes local (the 0-rows bug)", () => {
    const local = [{ id: "txn_1", v: "my-expense" }];
    expect(unionById([], local)).toEqual(local);
  });
});
