import assert from "node:assert/strict";
import { it } from "node:test";
import { add } from "../build/debug.js";

it("add", () => {
  assert.equal(add(1, 2), 3);
});
