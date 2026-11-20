#!/usr/bin/env node
// Installs the code-intelligence skill for the agents you use. Zero dependencies.
// Safe by construction: never overwrites a directory it did not create, never writes through
// symlinks, records what it installed, and uninstalls only that.
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  rmdirSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

export const SKILL_NAME = "code-intelligence";
export const MANIFEST = ".code-intelligence-skills.json";
const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(PKG_ROOT, "skills", SKILL_NAME);

/** Where each agent reads skills from. Several agents share the universal `.agents/skills` directory. */
export const AGENTS = {
  claude: { dir: ".claude/skills", label: "Claude Code" },
  codex: { dir: ".agents/skills", label: "OpenAI Codex" },
  opencode: { dir: ".agents/skills", label: "OpenCode" },
  pi: { dir: ".agents/skills", label: "Pi" },
  "gentle-shell": { dir: ".agents/skills", label: "Gentle Shell" },
};

const sha = (buf) => createHash("sha256").update(buf).digest("hex");

function listFiles(dir, base = dir, out = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isSymbolicLink()) continue; // never follow or copy links
    if (ent.isDirectory()) listFiles(p, base, out);
    else if (ent.isFile() && ent.name !== MANIFEST) out.push(relative(base, p).split(sep).join("/"));
  }
  return out.sort();
}

export function packageVersion() {
  return JSON.parse(readFileSync(join(PKG_ROOT, "package.json"), "utf8")).version;
}

function isLink(p) {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

/** The first path component below `root`, down to and including `path`, that is a symlink (or null). */
function firstLinkBelow(root, path) {
  const rel = relative(root, path);
  if (!rel || rel.startsWith("..")) return null;
  let cur = root;
  for (const part of rel.split(sep)) {
    cur = join(cur, part);
    if (isLink(cur)) return cur;
  }
  return null;
}

/** Manifest keys must be plain relative paths made of safe characters: no `..`, no absolute paths. */
export function isSafeManifestPath(rel) {
  return (
    typeof rel === "string" &&
    /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/.test(rel) &&
    !rel.split("/").some((seg) => seg === "." || seg === "..")
  );
}

/** Returns the manifest, null when absent/not ours, or "invalid" when it is ours but malformed or hostile. */
function readManifest(dir) {
  let m;
  try {
    m = JSON.parse(readFileSync(join(dir, MANIFEST), "utf8"));
  } catch {
    return null;
  }
  if (!m || m.package !== "code-intelligence-skills") return null;
  if (!m.files || typeof m.files !== "object" || Array.isArray(m.files)) return "invalid";
  for (const [rel, hash] of Object.entries(m.files)) {
    if (!isSafeManifestPath(rel) || typeof hash !== "string" || !/^[0-9a-f]{64}$/.test(hash)) return "invalid";
  }
  return m;
}

/** Compare what is on disk with what the manifest says we installed. `linkRoot` bounds the symlink checks. */
function inspect(dir, linkRoot) {
  const link = firstLinkBelow(linkRoot, dir);
  if (link) return { state: "symlink", at: link };
  if (!existsSync(dir)) return { state: "absent" };
  const manifestFile = join(dir, MANIFEST);
  if (isLink(manifestFile)) return { state: "symlink", at: manifestFile };
  const m = readManifest(dir);
  if (m === "invalid") return { state: "foreign", reason: "its manifest is malformed or lists unsafe paths" };
  if (!m) {
    // Without a manifest the directory is someone else's, unless installing would not touch anything
    // in it (an empty directory, or one that only holds files we would never write).
    const ours = listFiles(SOURCE);
    for (const f of ours) {
      const l = firstLinkBelow(dir, join(dir, f));
      if (l) return { state: "symlink", at: l };
    }
    const conflicts = ours.filter((f) => existsSync(join(dir, f)));
    return conflicts.length === 0 ? { state: "unmanaged-free" } : { state: "foreign" };
  }
  for (const rel of Object.keys(m.files)) {
    const l = firstLinkBelow(dir, join(dir, rel));
    if (l) return { state: "symlink", at: l };
  }
  const modified = [];
  const missing = [];
  for (const [rel, hash] of Object.entries(m.files)) {
    try {
      if (sha(readFileSync(join(dir, rel))) !== hash) modified.push(rel);
    } catch {
      missing.push(rel);
    }
  }
  return { state: modified.length || missing.length ? "modified" : "installed", manifest: m, modified, missing };
}

/**
 * Resolve the target directory for each requested agent, grouping agents that share one.
 * `linkRoot` is where symlink checking starts: in --project mode the whole path below the repository root
 * (the repository is untrusted); in user scope only the skill directory itself and below, so dotfile
 * managers that symlink ~/.claude keep working.
 */
export function resolveTargets(agents, { project, home, cwd }) {
  const base = project ? cwd : home;
  const byDir = new Map();
  for (const a of agents) {
    const spec = AGENTS[a];
    if (!spec) throw new UsageError(`Unknown agent '${a}'. Known: ${Object.keys(AGENTS).join(", ")}, all`);
    const dir = join(base, spec.dir, SKILL_NAME);
    const entry = byDir.get(dir) ?? { dir, agents: [], linkRoot: project ? base : join(base, spec.dir) };
    entry.agents.push(a);
    byDir.set(dir, entry);
  }
  return [...byDir.values()];
}

export class UsageError extends Error {}

const symlinkRefusal = (target, st) => ({
  ...target,
  action: "refused",
  reason: `a symlink was found at ${st.at}; refusing to read or write through it`,
});
const foreignRefusal = (target, st, verb) => ({
  ...target,
  action: "refused",
  reason: st.reason
    ? `${target.dir} ${verb}: ${st.reason}`
    : `${target.dir} exists and was not installed by this tool; refusing to ${verb === "overwrite" ? "overwrite it" : "touch it"}`,
});

export function install(target, { dryRun = false, force = false } = {}) {
  const { dir } = target;
  const st = inspect(dir, target.linkRoot);
  const files = listFiles(SOURCE);
  const hashes = Object.fromEntries(files.map((f) => [f, sha(readFileSync(join(SOURCE, f)))]));

  if (st.state === "symlink") return symlinkRefusal(target, st);
  if (st.state === "foreign") return foreignRefusal(target, st, "overwrite");
  if (st.state === "modified" && !force) {
    return { ...target, action: "refused", reason: `installed files were modified locally (${[...st.modified, ...st.missing].join(", ")}); use --force to replace them` };
  }
  const unchanged = st.state === "installed" && st.manifest.version === packageVersion() && JSON.stringify(st.manifest.files) === JSON.stringify(hashes);
  if (unchanged) return { ...target, action: "up-to-date", version: packageVersion() };

  const action = st.state === "absent" || st.state === "unmanaged-free" ? "install" : "update";
  if (dryRun) return { ...target, action: `would-${action}`, files };

  if (st.manifest) {
    for (const rel of Object.keys(st.manifest.files)) rmSync(join(dir, rel), { force: true });
  }
  mkdirSync(dir, { recursive: true });
  // Re-check after creating directories: nothing below the target may have become a link meanwhile.
  const late = firstLinkBelow(target.linkRoot, dir);
  if (late) return symlinkRefusal(target, { at: late });
  cpSync(SOURCE, dir, { recursive: true, dereference: false, filter: (src) => !isLink(src) });
  writeFileSync(
    join(dir, MANIFEST),
    `${JSON.stringify({ package: "code-intelligence-skills", version: packageVersion(), installedAt: new Date().toISOString(), files: hashes }, null, 2)}\n`,
  );
  return { ...target, action, version: packageVersion() };
}

export function uninstall(target, { dryRun = false, force = false } = {}) {
  const { dir } = target;
  const st = inspect(dir, target.linkRoot);
  if (st.state === "absent" || st.state === "unmanaged-free") return { ...target, action: "not-installed" };
  if (st.state === "symlink") return symlinkRefusal(target, st);
  if (st.state === "foreign") return foreignRefusal(target, st, "touch");
  if (st.state === "modified" && !force) {
    return { ...target, action: "refused", reason: `files were modified locally (${st.modified.join(", ")}); use --force to remove them anyway` };
  }
  const owned = Object.keys(st.manifest.files);
  if (dryRun) return { ...target, action: "would-uninstall", files: owned };
  for (const rel of owned) rmSync(join(dir, rel), { force: true });
  rmSync(join(dir, MANIFEST), { force: true });
  // Remove now-empty directories, deepest first; anything the user added stays.
  const dirs = [...new Set(owned.map((r) => dirname(r)).filter((d) => d !== "."))].sort((a, b) => b.length - a.length);
  for (const d of dirs) {
    try {
      rmdirSync(join(dir, d));
    } catch {
      /* not empty: leave it */
    }
  }
  let leftover = false;
  try {
    rmdirSync(dir);
  } catch {
    leftover = true;
  }
  return { ...target, action: "uninstalled", ...(leftover ? { note: "directory kept because it contains files you added" } : {}) };
}

export function status(target) {
  const st = inspect(target.dir, target.linkRoot);
  return { ...target, state: st.state, version: st.manifest?.version ?? null, modified: st.modified ?? [] };
}

const HELP = `code-intelligence-skills ${packageVersion()}

Install the code-intelligence skill for the agents you use. Installs nothing unless you name an agent.

Usage:
  code-intelligence-skills install   --agent <list> [--project] [--dry-run] [--force]
  code-intelligence-skills uninstall --agent <list> [--project] [--dry-run] [--force]
  code-intelligence-skills status    [--agent <list>] [--project]
  code-intelligence-skills list

Agents: ${Object.keys(AGENTS).join(", ")}, all   (comma separated)
  claude   -> ~/.claude/skills/${SKILL_NAME}
  others   -> ~/.agents/skills/${SKILL_NAME}   (Codex, OpenCode, Pi and Gentle Shell read this directory)
With --project the same paths are used relative to the current directory instead of your home.

Options:
  --dry-run   Show what would change, change nothing
  --force     Replace/remove files even if they were modified after installation
  --home <p>  Use <p> instead of your home directory
  -h, --help / -v, --version

The skill needs the code-intel CLI: https://github.com/micio86dev/code-intelligence
Exit codes: 0 ok, 1 something was refused, 2 usage error.
`;

export function run(argv, { cwd = process.cwd(), out = (s) => process.stdout.write(s), err = (s) => process.stderr.write(s) } = {}) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        agent: { type: "string", short: "a" },
        project: { type: "boolean" },
        "dry-run": { type: "boolean" },
        force: { type: "boolean" },
        home: { type: "string" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
    });
  } catch (e) {
    err(`error: ${e.message}\n`);
    return 2;
  }
  const { values: v, positionals } = parsed;
  if (v.version) {
    out(`${packageVersion()}\n`);
    return 0;
  }
  const cmd = positionals[0];
  if (v.help || !cmd) {
    out(HELP);
    return cmd || v.help ? 0 : 2;
  }
  try {
    if (cmd === "list") {
      for (const [a, s] of Object.entries(AGENTS)) out(`${a.padEnd(13)} ${s.label.padEnd(14)} ~/${s.dir}/${SKILL_NAME}\n`);
      return 0;
    }
    if (!["install", "uninstall", "status"].includes(cmd)) throw new UsageError(`Unknown command '${cmd}'`);
    if (positionals.length > 1) throw new UsageError(`Unexpected argument '${positionals[1]}'`);

    let agents = (v.agent ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (agents.includes("all")) agents = Object.keys(AGENTS);
    if (agents.length === 0) {
      if (cmd !== "status") throw new UsageError("Name the agent(s) to use: --agent claude,codex,opencode,pi,gentle-shell (or all)");
      agents = Object.keys(AGENTS);
    }
    const home = v.home ? resolve(cwd, v.home) : homedir();
    const targets = resolveTargets(agents, { project: Boolean(v.project), home, cwd });
    const opts = { dryRun: Boolean(v["dry-run"]), force: Boolean(v.force) };
    let refused = false;
    for (const t of targets) {
      const who = t.agents.map((a) => AGENTS[a].label).join(", ");
      if (cmd === "status") {
        const s = status(t);
        out(`${who}: ${s.state}${s.version ? ` (v${s.version})` : ""}${s.modified.length ? ` modified: ${s.modified.join(", ")}` : ""}\n  ${t.dir}\n`);
        continue;
      }
      const r = cmd === "install" ? install(t, opts) : uninstall(t, opts);
      if (r.action === "refused") refused = true;
      out(`${who}: ${r.action}${r.reason ? `: ${r.reason}` : ""}${r.note ? ` (${r.note})` : ""}\n  ${t.dir}\n`);
    }
    return refused ? 1 : 0;
  } catch (e) {
    if (e instanceof UsageError) {
      err(`error: ${e.message}\n`);
      return 2;
    }
    err(`internal error: ${e.message}\n`);
    return 70;
  }
}

// Run only when executed directly. npm's bin shim is a symlink, so compare real paths (a plain
// path comparison silently does nothing when installed through npm).
function isMain() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}
if (isMain()) {
  process.exitCode = run(process.argv.slice(2));
}
