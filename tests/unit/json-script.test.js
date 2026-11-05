// JSON embedded in <script> (T10, #59): src/lib/content/json-script.ts.
import { describe, expect, it } from "vitest";
import { jsonForScript } from "../../src/lib/content/json-script.ts";

describe("jsonForScript", () => {
  const value = {
    headline: "</script><script>alert(1)</script>",
    other: "a & b > c <!-- d",
    separators: "\u2028\u2029",
  };

  it("escapes < > & and the line separators, so no </script> or <!-- appears", () => {
    const json = jsonForScript(value);
    expect(json).not.toMatch(/[<>&\u2028\u2029]/);
    expect(json).toContain("\\u003c/script\\u003e");
  });

  it("is the same JSON", () => {
    expect(JSON.parse(jsonForScript(value))).toEqual(value);
  });
});
