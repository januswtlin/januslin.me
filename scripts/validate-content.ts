// `pnpm validate` (T10, #59): checks content/ (or CONTENT_DIR) before the build. Prints every
// issue as `<level>: <file>: <field>: <message>` and exits 1 when any is an error. The rules are
// in src/lib/content/validate.ts; docs/content-model.md describes them.
import { contentSources } from "../src/lib/content/entries.ts";
import { formatIssue, validateContent } from "../src/lib/content/validate.ts";

const { contentDir } = contentSources({ CONTENT_DIR: process.env.CONTENT_DIR });
const issues = validateContent(process.cwd(), contentDir);
const errors = issues.filter((i) => i.level === "error");

for (const issue of issues) console.log(formatIssue(issue));
console.log(
  `validate: ${contentDir}: ${errors.length} error(s), ${issues.length - errors.length} warning(s)`,
);
process.exit(errors.length > 0 ? 1 : 0);
