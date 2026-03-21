import { defineConfig, loadEnv } from "vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Vite only auto-loads `.env`, `.env.local`, etc. Many editors/users create `env.local` by mistake. */
function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

export default defineConfig(({ mode }) => {
  const root = __dirname;
  const fromVite = loadEnv(mode, root, "VITE_");
  const fromAlt = parseEnvFile(path.join(root, "env.local"));
  const merged = { ...fromVite };
  for (const [k, v] of Object.entries(fromAlt)) {
    if (k.startsWith("VITE_")) merged[k] = v;
  }

  const define = {};
  for (const [k, v] of Object.entries(merged)) {
    define[`import.meta.env.${k}`] = JSON.stringify(v ?? "");
  }

  return {
    // Root-relative assets so Vercel SPA rewrites (e.g. /any/path → index.html) still load /assets/* correctly.
    base: "/",
    server: { port: 5137 },
    define,
  };
});
