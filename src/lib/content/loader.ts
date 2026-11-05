// The loader for posts, topics, and pages (T10, #59): Astro's glob loader over
// `<content>/<collection>/*/index.*.md`, plus what the glob loader cannot do on its own:
// - entry ids `<slug>/<locale>`, with unknown locales rejected;
// - English versions inherit fields from their zh-TW source before validation;
// - with local drafts on (`pnpm dev:drafts` only), a second glob over the drafts folder loads its
//   entries as drafts; a slug in both folders loads from the content folder, with a warning;
// - every reference (topic, tags, related, startHere) must exist, checked after loading so cached
//   entries are checked too; the error names the file, the field, and the value;
// - schema errors name the file.
// Each glob's base is the collection's folder, so `astro dev` watches only that folder.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

import { parseFrontmatter } from "@astrojs/markdown-remark";
import { glob, type Loader, type LoaderContext } from "astro/loaders";

import { SOURCE_LOCALE, isFileLocale, type EntryCollection } from "./constants.ts";
import { entryId, includeDrafts, inheritFrontmatter, type ContentSources } from "./entries.ts";
import { entryFolders, scanContent, sourceSlugs, tagIds } from "./scan.ts";
import {
  checkReferences,
  draftPostSlugs,
  formatIssue,
  type EntryRefs,
  type KnownIds,
} from "./validate.ts";

const toPosix = (p: string) => p.split(sep).join("/");

/** Entry files relative to a collection folder: `<slug>/index.<locale>.md`. */
export const ENTRY_PATTERN = "*/index.*.md";

/** The id of an entry file relative to its collection folder, e.g. `v60-recipe/index.en.md`. */
export function idFromEntry(entry: string): string {
  const m = /^([^/]+)\/index\.([^./]+)\.md$/.exec(entry.replaceAll("\\", "/"));
  if (!m) throw new Error(`${entry}: not an entry file`);
  return entryId(m[1], m[2]);
}

/** Slugs in the drafts folder that the content folder also has: those load from content. */
export function shadowedDrafts(root: string, sources: ContentSources, collection: EntryCollection) {
  if (!sources.draftsDir) return [];
  const inContent = new Set(entryFolders(root, sources.contentDir, collection));
  return entryFolders(root, sources.draftsDir, collection).filter((slug) => inContent.has(slug));
}

interface StoreEntry {
  id: string;
  data: Record<string, unknown>;
  filePath?: string;
}

const refId = (v: unknown) =>
  v && typeof v === "object" && "id" in v ? String((v as { id: unknown }).id) : undefined;

/** `coffee/zh-tw` → `coffee`: a topic reference points at the hub's zh-TW entry. */
const topicSlug = (v: unknown) => refId(v)?.replace(new RegExp(`/${SOURCE_LOCALE}$`), "");

/**
 * The store as one glob sees it: only the entries from its own folder. The glob loader deletes
 * every entry it did not see in its folder, which would otherwise remove the other folder's.
 * English entries always read as missing, so they are parsed again: what they inherit lives in
 * another file, which the glob loader's per-file cache does not know about.
 */
function scopedStore(store: LoaderContext["store"], folder: string): LoaderContext["store"] {
  const mine = (id: string) =>
    (store.get(id) as StoreEntry | undefined)?.filePath?.startsWith(`${folder}/`) ?? false;
  return new Proxy(store, {
    get(target, prop, receiver) {
      if (prop === "keys") return () => target.keys().filter(mine);
      if (prop === "get")
        return (id: string) => (id.endsWith(`/${SOURCE_LOCALE}`) ? target.get(id) : undefined);
      const value = Reflect.get(target, prop, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

export function entryLoader(collection: EntryCollection, sources: ContentSources): Loader {
  const root = process.cwd();
  const folders = [sources.contentDir, sources.draftsDir].filter((d): d is string => !!d);

  return {
    name: `januslin-${collection}`,
    load: async (ctx: LoaderContext) => {
      const shadowed = shadowedDrafts(root, sources, collection);
      for (const slug of shadowed) {
        ctx.logger.warn(
          `${sources.draftsDir}/${collection}/${slug} is also in ${sources.contentDir}/${collection}/: loading the one in ${sources.contentDir}/`,
        );
      }

      // Entries cached from another content or drafts folder (an earlier CONTENT_DIR, or an earlier
      // `pnpm dev:drafts`) must not survive into this build.
      const current = folders.map((dir) => `${dir}/${collection}/`);
      for (const e of ctx.store.values() as StoreEntry[]) {
        if (!current.some((prefix) => e.filePath?.startsWith(prefix))) ctx.store.delete(e.id);
      }

      for (const dir of folders) {
        const isDrafts = dir === sources.draftsDir;
        const folder = `${dir}/${collection}`;
        const parseData: LoaderContext["parseData"] = async (props) => {
          const file = props.filePath ?? "";
          const rel = toPosix(relative(root, file));
          const locale = props.id.slice(props.id.lastIndexOf("/") + 1);
          if (!isFileLocale(locale)) {
            throw new Error(
              `${rel}: unknown locale "${locale}" in the file name: use index.zh-tw.md or index.en.md`,
            );
          }
          let data: Record<string, unknown> = props.data;
          if (locale !== SOURCE_LOCALE) {
            const source = join(dirname(file), `index.${SOURCE_LOCALE}.md`);
            if (existsSync(source)) {
              const { frontmatter } = parseFrontmatter(readFileSync(source, "utf8"));
              data = inheritFrontmatter(
                collection,
                locale,
                data,
                frontmatter as Record<string, unknown>,
              );
            }
          }
          // Local drafts are always drafts; topics have no draft field.
          if (isDrafts && collection !== "topics") data = { ...data, draft: true };
          try {
            return await ctx.parseData({ ...props, data: data as typeof props.data });
          } catch (e) {
            if (e instanceof Error) e.message = `${rel}: ${e.message}`;
            throw e;
          }
        };
        const pattern = isDrafts
          ? [ENTRY_PATTERN, ...shadowed.map((slug) => `!${slug}/**`)]
          : ENTRY_PATTERN;
        const inner = glob({
          base: folder,
          pattern,
          generateId: ({ entry }) => idFromEntry(entry),
        });
        // A missing drafts folder is fine; the glob loader would warn about it.
        if (isDrafts && !existsSync(resolve(root, folder))) continue;
        await inner.load({ ...ctx, parseData, store: scopedStore(ctx.store, folder) });
      }

      // References, against what is on disk (collections load in parallel). Without drafts (a
      // production build), a published entry may not link to a draft, which would not be built.
      const withDrafts = includeDrafts(process.env);
      const known: KnownIds = {
        topics: new Set<string>(),
        posts: new Set<string>(),
        tags: new Set<string>(),
        draftPosts: withDrafts ? undefined : new Set<string>(),
        contentDir: sources.contentDir,
      };
      for (const dir of folders) {
        const scan = scanContent(root, dir);
        sourceSlugs(scan, "topics").forEach((s) => known.topics.add(s));
        sourceSlugs(scan, "posts").forEach((s) => known.posts.add(s));
        if (dir === sources.contentDir) tagIds(scan).forEach((t) => known.tags.add(t));
        // Everything in the local drafts folder is a draft.
        const drafts =
          dir === sources.draftsDir ? sourceSlugs(scan, "posts") : draftPostSlugs(scan);
        drafts.forEach((s) => known.draftPosts?.add(s));
      }
      const refs: EntryRefs[] = (ctx.store.values() as StoreEntry[]).map((e) => ({
        file: e.filePath ?? e.id,
        collection,
        topic: topicSlug(e.data.topic),
        tags: ((e.data.tags as unknown[] | undefined) ?? []).map((t) => refId(t) ?? String(t)),
        related: (e.data.related as string[] | undefined) ?? [],
        startHere: (e.data.startHere as string[] | undefined) ?? [],
        draft: e.data.draft === true,
      }));
      const issues = checkReferences(refs, known);
      if (issues.length > 0) {
        throw new Error(`${collection}: invalid references\n${issues.map(formatIssue).join("\n")}`);
      }
    },
  };
}
