#!/usr/bin/env node
/**
 * Copies the template into a new project directory and fills in its names.
 *
 *   node scaffold.mjs --name "Mi App" --slug mi-app --dir ./mi-app \
 *     [--description "Qué hace, en una frase."] [--tenancy multi|single] \
 *     [--port-offset 300]
 *
 * --tenancy single overlays variants/single/ (the organization never appears
 * in the URL) and removes what that variant lists in REMOVE. The data model
 * and RLS are the same either way. Text between {{#multi}} and {{/multi}} is
 * kept only for multi-tenant projects, {{#single}}…{{/single}} only for single.
 *
 * Placeholders in the template are __UPPER_SNAKE__ words. Supabase's local
 * ports are the CLI defaults shifted by --port-offset (a multiple of 100,
 * derived from the slug when omitted) so several projects' stacks can run side
 * by side. Refuses to write into a directory that is not empty.
 */
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const here = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.resolve(here, "../template");

const { values } = parseArgs({
  options: {
    name: { type: "string" },
    slug: { type: "string" },
    dir: { type: "string" },
    description: { type: "string", default: "" },
    tenancy: { type: "string", default: "multi" },
    "port-offset": { type: "string" },
  },
});

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!values.name || !values.slug || !values.dir) {
  fail('Usage: scaffold.mjs --name "Mi App" --slug mi-app --dir ./mi-app [--description "…"] [--port-offset 300]');
}
if (!["multi", "single"].includes(values.tenancy)) {
  fail("--tenancy must be multi or single.");
}
if (!/^[a-z][a-z0-9-]*$/.test(values.slug)) {
  fail("--slug must be lowercase letters, digits and dashes, starting with a letter.");
}

const offset =
  values["port-offset"] !== undefined
    ? Number(values["port-offset"])
    : 100 * (1 + (createHash("sha256").update(values.slug).digest()[0] % 9));
if (!Number.isInteger(offset) || offset < 0 || offset > 5000 || offset % 100 !== 0) {
  fail("--port-offset must be a multiple of 100 between 0 and 5000.");
}

const dest = path.resolve(values.dir);
if (existsSync(dest) && readdirSync(dest).filter((f) => f !== ".git").length > 0) {
  fail(`${dest} is not empty. Choose a new directory.`);
}

const replacements = {
  __APP_NAME__: values.name,
  __APP_SLUG__: values.slug,
  __APP_DESCRIPTION__: values.description || values.name,
  __API_PORT__: 54321 + offset,
  __DB_PORT__: 54322 + offset,
  __SHADOW_PORT__: 54320 + offset,
  __STUDIO_PORT__: 54323 + offset,
  __MAIL_PORT__: 54324 + offset,
  __SMTP_PORT__: 54325 + offset,
  __POOLER_PORT__: 54329 + offset,
};

cpSync(templateDir, dest, { recursive: true });

const variantDir = path.resolve(here, "../variants", values.tenancy);
if (existsSync(variantDir)) {
  const removeList = path.join(variantDir, "REMOVE");
  if (existsSync(removeList)) {
    for (const entry of readFileSync(removeList, "utf8").split("\n").filter(Boolean)) {
      rmSync(path.join(dest, entry), { recursive: true, force: true });
    }
  }
  cpSync(variantDir, dest, { recursive: true, filter: (src) => path.basename(src) !== "REMOVE" });
}

// npm and some zip tools drop dotfiles named .gitignore; the template keeps it
// as _gitignore and it becomes .gitignore here.
renameSync(path.join(dest, "_gitignore"), path.join(dest, ".gitignore"));

const textFile = /\.(ts|tsx|mjs|js|json|md|toml|yaml|yml|css|sql|sh|example)$|^\.gitignore$/;

function fill(dir) {
  for (const entry of readdirSync(dir)) {
    const file = path.join(dir, entry);
    if (statSync(file).isDirectory()) {
      if (entry !== "node_modules" && entry !== ".git") fill(file);
      continue;
    }
    if (!textFile.test(entry)) continue;
    const before = readFileSync(file, "utf8");
    const other = values.tenancy === "multi" ? "single" : "multi";
    let after = before
      .replace(new RegExp(`\\{\\{#${other}\\}\\}[\\s\\S]*?\\{\\{/${other}\\}\\}\\n?`, "g"), "")
      .replace(new RegExp(`\\{\\{[#/]${values.tenancy}\\}\\}\\n?`, "g"), "");
    for (const [key, value] of Object.entries(replacements)) after = after.replaceAll(key, String(value));
    if (after !== before) writeFileSync(file, after);
  }
}
fill(dest);

console.log(`Scaffolded ${values.name} (${values.tenancy}-tenant) in ${dest}`);
console.log(`Supabase ports: API ${replacements.__API_PORT__}, database ${replacements.__DB_PORT__}, Studio ${replacements.__STUDIO_PORT__}, Mailpit ${replacements.__MAIL_PORT__}`);
