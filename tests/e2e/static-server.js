// A minimal static file server for dist/ (T09, #58), used by the Playwright tests.
// It serves directory paths from index.html, answers unknown paths with 404.html and status
// 404 (as Cloudflare Workers static assets do), and listens on a free port on 127.0.0.1.
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

/** @type {Record<string, string>} */
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml",
  ".xsl": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

/** @param {string} file */
async function isFile(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

/**
 * Maps a URL path to a file under root, or null.
 * @param {string} root
 * @param {string} pathname
 */
export async function resolveFile(root, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const candidate = normalize(join(root, decoded));
  if (candidate !== root && !candidate.startsWith(root + sep)) return null;
  const options = decoded.endsWith("/")
    ? [join(candidate, "index.html")]
    : [candidate, join(candidate, "index.html"), `${candidate}.html`];
  for (const file of options) {
    if (await isFile(file)) return file;
  }
  return null;
}

/**
 * Starts the server. Resolves to { url, close }.
 * @param {string} [dir] the directory to serve, default dist/
 */
export async function startStaticServer(dir = "dist") {
  const root = resolve(dir);
  const server = createServer(async (req, res) => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");
    let file = await resolveFile(root, pathname);
    let status = 200;
    if (!file) {
      status = 404;
      file = join(root, "404.html");
      if (!(await isFile(file))) {
        res.writeHead(404, { "content-type": "text/plain" }).end("not found");
        return;
      }
    }
    const type = TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
    const { size } = await stat(file);
    res.writeHead(status, { "content-type": type, "content-length": size });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(file).pipe(res);
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", () => done(undefined)));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((done) => server.close(() => done(undefined))),
  };
}
