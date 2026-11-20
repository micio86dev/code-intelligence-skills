import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (p) => readFileSync(join(root, p), "utf8");
const json = (p) => JSON.parse(read(p));

function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  assert.ok(m, "SKILL.md must start with YAML frontmatter");
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = /^([a-z-]+):\s*(.*)$/.exec(line);
    if (kv) out[kv[1]] = kv[2].replace(/^"(.*)"$/, "$1");
  }
  return out;
}

test("SKILL.md follows the Agent Skills constraints every supported agent relies on", () => {
  const fm = frontmatter(read("skills/code-intelligence/SKILL.md"));
  assert.equal(fm.name, "code-intelligence", "name must equal its directory");
  assert.match(fm.name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  assert.ok(fm.name.length <= 64);
  assert.ok(fm.description.length > 0 && fm.description.length <= 1024, `description is ${fm.description.length} chars`);
  assert.ok((fm.compatibility ?? "").length <= 500);
  assert.match(fm.description, /^Trigger:/, "descriptions start with the trigger phrases");
});

test("every file the SKILL.md links to exists", () => {
  const body = read("skills/code-intelligence/SKILL.md");
  const refs = [...body.matchAll(/`(references\/[\w.-]+\.md)`/g)].map((m) => m[1]);
  assert.ok(refs.length >= 4);
  for (const r of refs) assert.ok(existsSync(join(root, "skills/code-intelligence", r)), `missing ${r}`);
});

test("versions agree across package.json, plugin.json and the changelog", () => {
  const v = json("package.json").version;
  assert.equal(json(".claude-plugin/plugin.json").version, v);
  assert.match(read("CHANGELOG.md"), new RegExp(`## \\[${v.replaceAll(".", "\\.")}\\]`));
});

test("the Claude marketplace points at the plugin that lives in this repository", () => {
  const mp = json(".claude-plugin/marketplace.json");
  const plugin = json(".claude-plugin/plugin.json");
  assert.equal(mp.plugins.length, 1);
  assert.equal(mp.plugins[0].name, plugin.name);
  assert.equal(mp.plugins[0].source, "./");
  assert.ok(existsSync(join(root, "skills", plugin.name, "SKILL.md")), "plugin skills/ directory layout");
});

test("the Pi package manifest exposes the skills directory", () => {
  const p = json("package.json");
  assert.deepEqual(p.pi.skills, ["./skills"]);
  assert.ok(p.keywords.includes("pi-package"));
  assert.ok(readdirSync(join(root, "skills")).includes("code-intelligence"));
});

test("the package has no runtime dependencies and ships only what it needs", () => {
  const p = json("package.json");
  assert.equal(Object.keys(p.dependencies ?? {}).length, 0);
  for (const f of ["installer", "skills", ".claude-plugin"]) assert.ok(p.files.includes(f));
  assert.equal(p.files.includes("test"), false);
});

test("no tracked file anywhere contains a local path, a personal identifier, or a secret-shaped string", () => {
  // Every file git tracks (not a hand-picked list: a generated .atl/ registry once slipped past a narrower check).
  const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
  assert.ok(tracked.length > 10, "expected to list the repository's files");
  const ignoredByName = /^(\.atl|node_modules)\//;
  for (const f of tracked) {
    assert.equal(ignoredByName.test(f), false, `${f}: generated local tooling output must not be tracked`);
    const t = readFileSync(join(root, f), "utf8");
    assert.equal(/\/Users\/|\/home\/[a-z]+\/|C:\\Users\\/.test(t), false, `${f} contains a local path`);
    assert.equal(/@gmail\.com|@users\.noreply\.github\.com/.test(t), false, `${f} contains a personal email address`);
    assert.equal(/AKIA[A-Z0-9]{16}|ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}/.test(t), false, `${f} looks like it contains a secret`);
  }
});

