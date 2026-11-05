// JSON for a <script> element (T10, #59). JSON.stringify leaves "</script>" in a string as is,
// which would end the element early: a title such as `</script><script>alert(1)</script>` would
// run. Escaping <, >, and & as <, >, and & keeps the JSON equal and the HTML inert;
// the line and paragraph separators (U+2028, U+2029) are escaped for old JavaScript parsers.
const UNSAFE = new RegExp("[<>&\\u2028\\u2029]", "g");

const escape = (c: string) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`;

export function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(UNSAFE, escape);
}
