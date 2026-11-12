// Bundles the app into one self-contained HTML page (hash routing, assets inlined).
// Usage: node prototype/build.mjs [out.html]
import { build } from "esbuild";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const out = process.argv[2] ?? path.join(root, "prototype/dist/index.html");

const result = await build({
  entryPoints: [path.join(root, "prototype/main.tsx")],
  bundle: true,
  minify: true,
  write: false,
  outdir: "out",
  jsx: "automatic",
  loader: { ".module.css": "local-css", ".woff2": "dataurl", ".woff": "dataurl" },
  define: { "process.env.NODE_ENV": '"production"' },
  plugins: [{
    name: "at-alias",
    setup(b) {
      b.onResolve({ filter: /^@\// }, (a) => {
        // Hash routing instead of Next's router.
        if (a.path === "@/lib/router") return { path: path.join(root, "prototype/router.ts") };
        const base = path.join(root, a.path.slice(2));
        for (const ext of ["", ".ts", ".tsx"]) if (existsSync(base + ext) && !base.endsWith("/")) { try { if (readFileSync(base + ext)) return { path: base + ext }; } catch {} }
        return undefined;
      });
    },
  }],
});

let js = "", css = "";
for (const f of result.outputFiles) (f.path.endsWith(".css") ? (css += f.text) : (js += f.text));

const mime = { svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", webp: "image/webp" };
const inline = (s) => s.replace(/\/figma\/([\w.-]+\.(svg|png|jpg|webp))/g, (_, f, ext) =>
  `data:${mime[ext]};base64,${readFileSync(path.join(root, "public/figma", f)).toString("base64")}`);

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>ChatApp v2</title><style>${inline(css)}</style></head><body><div id="root"></div><script>${inline(js).replace(/<\/script/g, "<\\/script")}</script></body></html>`;
writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1e6).toFixed(2)} MB)`);
