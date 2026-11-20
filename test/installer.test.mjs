import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, beforeEach, test } from "node:test";
import { MANIFEST, SKILL_NAME, run } from "../installer/install.mjs";

const made = [];
const tmp = () => {
  const d = realpathSync(mkdtempSync(join(tmpdir(), "cis-")));
  made.push(d);
  return d;
};
after(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

let home;
let cwd;
beforeEach(() => {
  home = tmp();
  cwd = tmp();
});

function cli(args) {
  let out = "";
  let err = "";
  const code = run(["--home", home, ...args], { cwd, out: (s) => (out += s), err: (s) => (err += s) });
  return { code, out, err };
}
const skillDir = (base, sub) => join(base, sub, SKILL_NAME);
const tree = (dir, base = dir, acc = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) tree(p, base, acc);
    else acc.push(p.slice(base.length + 1));
  }
  return acc.sort();
};

test("install --agent all writes the skill to the Claude and universal directories, with a manifest", () => {
  const r = cli(["install", "--agent", "all"]);
  assert.equal(r.code, 0, r.err);
  for (const sub of [".claude/skills", ".agents/skills"]) {
    const d = skillDir(home, sub);
    assert.ok(existsSync(join(d, "SKILL.md")));
    assert.ok(existsSync(join(d, "references/findings.md")));
    const m = JSON.parse(readFileSync(join(d, MANIFEST), "utf8"));
    assert.equal(m.package, "code-intelligence-skills");
    assert.ok(Object.keys(m.files).includes("SKILL.md"));
  }
  assert.match(r.out, /OpenAI Codex, OpenCode, Pi, Gentle Shell: install/, "agents sharing a directory are installed once");
});

test("nothing is installed without naming an agent; unknown agents and commands are usage errors", () => {
  assert.equal(cli(["install"]).code, 2);
  assert.equal(cli(["install", "--agent", "emacs"]).code, 2);
  assert.equal(cli(["frobnicate"]).code, 2);
  assert.equal(cli([]).code, 2);
  assert.equal(readdirSync(home).length, 0);
});

test("a second install is a no-op", () => {
  cli(["install", "--agent", "claude"]);
  const before = tree(home);
  const r = cli(["install", "--agent", "claude"]);
  assert.equal(r.code, 0);
  assert.match(r.out, /up-to-date/);
  assert.deepEqual(tree(home), before);
});

test("refuses to overwrite a directory it did not create, and leaves it untouched", () => {
  const d = skillDir(home, ".claude/skills");
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, "SKILL.md"), "someone else's skill\n");
  const r = cli(["install", "--agent", "claude"]);
  assert.equal(r.code, 1);
  assert.match(r.out, /refused.*not installed by this tool/);
  assert.equal(readFileSync(join(d, "SKILL.md"), "utf8"), "someone else's skill\n");
  assert.equal(existsSync(join(d, MANIFEST)), false);
  assert.equal(cli(["uninstall", "--agent", "claude"]).code, 1, "uninstall must not touch it either");
  assert.equal(readFileSync(join(d, "SKILL.md"), "utf8"), "someone else's skill\n");
});

test("never writes through a symlink", { skip: process.platform === "win32" }, () => {
  const elsewhere = tmp();
  mkdirSync(join(home, ".claude/skills"), { recursive: true });
  symlinkSync(elsewhere, skillDir(home, ".claude/skills"));
  const r = cli(["install", "--agent", "claude"]);
  assert.equal(r.code, 1);
  assert.match(r.out, /symlink/);
  assert.deepEqual(readdirSync(elsewhere), []);
  assert.equal(cli(["uninstall", "--agent", "claude"]).code, 1);
});

test("local modifications block update and uninstall unless --force", () => {
  cli(["install", "--agent", "claude"]);
  const d = skillDir(home, ".claude/skills");
  writeFileSync(join(d, "SKILL.md"), "my edits\n");
  const upd = cli(["install", "--agent", "claude"]);
  assert.equal(upd.code, 1);
  assert.match(upd.out, /modified locally \(SKILL\.md\)/);
  assert.equal(readFileSync(join(d, "SKILL.md"), "utf8"), "my edits\n");
  assert.equal(cli(["uninstall", "--agent", "claude"]).code, 1);
  assert.equal(cli(["install", "--agent", "claude", "--force"]).code, 0);
  assert.match(readFileSync(join(d, "SKILL.md"), "utf8"), /^---\nname: code-intelligence/);
});

test("uninstall removes exactly what was installed and keeps files the user added", () => {
  cli(["install", "--agent", "claude"]);
  const d = skillDir(home, ".claude/skills");
  writeFileSync(join(d, "my-notes.md"), "keep me\n");
  const r = cli(["uninstall", "--agent", "claude"]);
  assert.equal(r.code, 0);
  assert.match(r.out, /directory kept because it contains files you added/);
  assert.deepEqual(tree(d), ["my-notes.md"]);
  rmSync(join(d, "my-notes.md"));
  cli(["install", "--agent", "claude"]);
  assert.equal(cli(["uninstall", "--agent", "claude"]).code, 0);
  assert.equal(existsSync(d), false, "a clean uninstall leaves nothing behind");
});

test("uninstall of something that is not installed is a harmless no-op", () => {
  const r = cli(["uninstall", "--agent", "all"]);
  assert.equal(r.code, 0);
  assert.match(r.out, /not-installed/);
});

test("--dry-run changes nothing for install and uninstall", () => {
  const r = cli(["install", "--agent", "all", "--dry-run"]);
  assert.match(r.out, /would-install/);
  assert.equal(readdirSync(home).length, 0);
  cli(["install", "--agent", "claude"]);
  const before = tree(home);
  assert.match(cli(["uninstall", "--agent", "claude", "--dry-run"]).out, /would-uninstall/);
  assert.deepEqual(tree(home), before);
});

test("--project installs relative to the current directory, not the home", () => {
  const r = cli(["install", "--agent", "claude,pi", "--project"]);
  assert.equal(r.code, 0, r.err);
  assert.ok(existsSync(join(skillDir(cwd, ".claude/skills"), "SKILL.md")));
  assert.ok(existsSync(join(skillDir(cwd, ".agents/skills"), "SKILL.md")));
  assert.equal(readdirSync(home).length, 0);
});

test("status reports installed, modified and absent states", () => {
  assert.match(cli(["status", "--agent", "claude"]).out, /absent/);
  cli(["install", "--agent", "claude"]);
  assert.match(cli(["status", "--agent", "claude"]).out, /installed \(v\d+\.\d+\.\d+\)/);
  writeFileSync(join(skillDir(home, ".claude/skills"), "SKILL.md"), "x");
  assert.match(cli(["status", "--agent", "claude"]).out, /modified: SKILL\.md/);
});

// ---- verifier findings ----

test("a hostile manifest cannot make uninstall or update delete files outside the skill directory (verifier repro)", () => {
  const precious = join(cwd, "precious.txt");
  writeFileSync(precious, "do not delete");
  const d = skillDir(cwd, ".claude/skills");
  mkdirSync(d, { recursive: true });
  const hash = createHash("sha256").update("do not delete").digest("hex");
  for (const evil of ["../../../precious.txt", "/etc/hosts", "a/../../../../precious.txt", "..\\..\\x"]) {
    writeFileSync(join(d, MANIFEST), JSON.stringify({ package: "code-intelligence-skills", version: "0.0.1", files: { [evil]: hash } }));
    for (const cmd of ["uninstall", "install"]) {
      const r = cli([cmd, "--agent", "claude", "--project", "--force"]);
      assert.equal(r.code, 1, `${cmd} ${evil}: ${r.out}`);
      assert.match(r.out, /refused.*(malformed or lists unsafe paths)/);
    }
    assert.equal(readFileSync(precious, "utf8"), "do not delete", `${evil} must not be deleted`);
  }
});

test("manifest path validation accepts only plain relative paths", async () => {
  const { isSafeManifestPath } = await import("../installer/install.mjs");
  for (const ok of ["SKILL.md", "references/findings.md", "a-b_c.d/e.txt"]) assert.equal(isSafeManifestPath(ok), true, ok);
  for (const bad of ["../x", "a/../b", "/abs", "a//b", "a/./b", "", ".", "..", "a b", "a\\b", "x\0y", 42, null]) assert.equal(isSafeManifestPath(bad), false, String(bad));
});

test("never installs through a symlinked subdirectory of the skill directory (verifier repro)", { skip: process.platform === "win32" }, () => {
  const victim = tmp();
  const d = skillDir(cwd, ".claude/skills");
  mkdirSync(d, { recursive: true });
  symlinkSync(victim, join(d, "references"));
  const r = cli(["install", "--agent", "claude", "--project"]);
  assert.equal(r.code, 1);
  assert.match(r.out, /symlink was found at .*references/);
  assert.deepEqual(readdirSync(victim), [], "nothing was written through the link");
  assert.equal(cli(["uninstall", "--agent", "claude", "--project"]).code, 1);
});

test("in --project mode a symlinked parent directory is refused; in user scope a symlinked ~/.claude is allowed", { skip: process.platform === "win32" }, () => {
  const victim = tmp();
  symlinkSync(victim, join(cwd, ".claude"));
  const proj = cli(["install", "--agent", "claude", "--project"]);
  assert.equal(proj.code, 1);
  assert.match(proj.out, /symlink was found at .*\.claude/);
  assert.deepEqual(readdirSync(victim), []);

  // Dotfile managers (stow, chezmoi) symlink ~/.claude; that is the user's own layout and must keep working.
  const dotfiles = tmp();
  symlinkSync(dotfiles, join(home, ".claude"));
  const usr = cli(["install", "--agent", "claude"]);
  assert.equal(usr.code, 0, usr.out + usr.err);
  assert.ok(existsSync(join(dotfiles, "skills/code-intelligence/SKILL.md")));
  assert.equal(cli(["uninstall", "--agent", "claude"]).code, 0);
});

test("a symlinked manifest file is refused, never written through", { skip: process.platform === "win32" }, () => {
  const victim = tmp();
  const d = skillDir(cwd, ".claude/skills");
  mkdirSync(d, { recursive: true });
  symlinkSync(join(victim, "target.json"), join(d, MANIFEST)); // dangling link
  const r = cli(["install", "--agent", "claude", "--project"]);
  assert.equal(r.code, 1);
  assert.equal(existsSync(join(victim, "target.json")), false);
});
