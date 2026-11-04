// Markdown directives (T09, #58): callouts, and every other directive turned back into text.
//
// remark-directive parses `:name`, `::name`, and `:::name` anywhere in a document. Callouts
// (`:::note`, `:::tip`, `:::important`, `:::warning`, `:::caution`, docs/content-model.md) become
// <blockquote class="admonition-<type>"> with a title, as in Retypeset's plugin (MIT), which this
// ports. Any text or leaf directive that no plugin handles is put back as its source text: without
// that, the `:15` in "1:15" or the `:30` in "10:30" is parsed as a text directive, and
// mdast-util-to-hast renders an unknown node as an empty <div> that splits the paragraph
// (docs/reports/theme-reevaluation.md).
import { SKIP, visit } from "unist-util-visit";

/** Callout types and their titles. */
export const CALLOUTS = {
  note: "NOTE",
  tip: "TIP",
  important: "IMPORTANT",
  warning: "WARNING",
  caution: "CAUTION",
} as const;

export type CalloutType = keyof typeof CALLOUTS;

interface Point {
  offset?: number;
}

interface MdNode {
  type: string;
  name?: string;
  value?: string;
  attributes?: Record<string, string | null | undefined> | null;
  children?: MdNode[];
  data?: {
    directiveLabel?: boolean;
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
  position?: { start: Point; end: Point };
}

const isCallout = (name: string | undefined): name is CalloutType =>
  name !== undefined && Object.hasOwn(CALLOUTS, name);

/** Plain text of a node's children, for a callout's custom title. */
function plainText(node: MdNode | undefined): string {
  if (!node) return "";
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(plainText).join("");
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * The Markdown a directive was written as: the exact source slice when positions are known,
 * otherwise a reconstruction from its name, label, and attributes.
 */
export function directiveSource(node: MdNode, source: string | undefined): string {
  const start = node.position?.start.offset;
  const end = node.position?.end.offset;
  if (source !== undefined && start !== undefined && end !== undefined) {
    return source.slice(start, end);
  }
  const marker = node.type === "leafDirective" ? "::" : ":";
  const label = node.children?.length ? `[${plainText(node)}]` : "";
  const attrs = Object.entries(node.attributes ?? {})
    .map(([k, v]) => (v ? `${k}="${v}"` : k))
    .join(" ");
  return `${marker}${node.name ?? ""}${label}${attrs ? `{${attrs}}` : ""}`;
}

function toCallout(node: MdNode, type: CalloutType) {
  const children = node.children ?? [];
  let title: string = CALLOUTS[type];
  if (children[0]?.data?.directiveLabel) {
    const custom = plainText(children[0]).trim();
    if (custom) title = custom;
    children.shift();
  }
  children.unshift({
    type: "html",
    value: `<span class="admonition-title">${escapeHtml(title)}</span>`,
  });
  node.children = children;
  node.data = {
    ...node.data,
    hName: "blockquote",
    hProperties: { className: [`admonition-${type}`] },
  };
}

/** The remark plugin. Runs after remark-directive. */
export function remarkDirectives() {
  // `tree` is mdast; typed loosely so the plugin needs no mdast type packages.
  return (tree: unknown, file: { value?: unknown }) => {
    const source = typeof file.value === "string" ? file.value : undefined;
    visit(tree as never, (n: unknown, index: number | undefined, parent: unknown) => {
      const node = n as MdNode;
      const siblings = (parent as MdNode | undefined)?.children;
      if (node.type === "containerDirective" && isCallout(node.name)) {
        toCallout(node, node.name);
        return;
      }
      if (index === undefined || !siblings) return;
      if (node.type === "textDirective") {
        siblings[index] = { type: "text", value: directiveSource(node, source) };
        return [SKIP, index];
      }
      if (node.type === "leafDirective") {
        siblings[index] = {
          type: "paragraph",
          children: [{ type: "text", value: directiveSource(node, source) }],
        };
        return [SKIP, index];
      }
    });
  };
}
