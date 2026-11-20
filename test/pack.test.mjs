import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const win = process.platform === "win32";
const npm = win ? "npm.cmd" : "npm";
// A clean environment: nothing from the surrounding `npm run` may steer the nested npm commands.
const env = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.toLowerCase().startsWith("npm_") && k !== "NODE_TEST_CONTEXT"));

let work;
let prefix;
let bin;
let home;

before(() => {
  work = realpathSync(mkdtempSync(join(tmpdir(), "cis-pack-")));
  prefix = join(work, "prefix");
  home = join(work, "home");
  // Fixed arguments, no user input: a shell is only needed to run npm.cmd on Windows.
  const sh = { env: env(), encoding: "utf8", shell: win };
  const out = execFileSync(npm, ["pack", "--silent", "--pack-destination", work], { cwd: root, ...sh });
  const tgz = join(work, out.trim().split("\n").pop());
  execFileSync(npm, ["install", "--global", "--prefix", prefix, "--no-audit", "--no-fund", tgz], { ...sh, stdio: "ignore" });
  bin = join(prefix, win ? "code-intelligence-skills.cmd" : "bin/code-intelligence-skills");
}, { timeout: 120_000 });
after(() => rmSync(work, { recursive: true, force: true }));

const run = (args) => spawnSync(bin, ["--home", home, ...args], { env: env(), encoding: "utf8", shell: win });

test("the packed tarball installs, runs, installs the skill and removes it again", () => {
  assert.ok(existsSync(bin));
  assert.match(run(["--version"]).stdout, /^\d+\.\d+\.\d+/);
  const i = run(["install", "--agent", "claude,pi"]);
  assert.equal(i.status, 0, i.stderr + i.stdout);
  assert.ok(existsSync(join(home, ".claude/skills/code-intelligence/SKILL.md")));
  assert.ok(existsSync(join(home, ".agents/skills/code-intelligence/references/findings.md")));
  const u = run(["uninstall", "--agent", "all"]);
  assert.equal(u.status, 0, u.stderr + u.stdout);
  assert.equal(existsSync(join(home, ".claude/skills/code-intelligence")), false);
  assert.equal(existsSync(join(home, ".agents/skills/code-intelligence")), false);
});

test("the tarball ships the skill, installer and plugin manifests, and nothing else", () => {
  const pkg = join(prefix, win ? "node_modules" : "lib/node_modules", "code-intelligence-skills");
  const top = readdirSync(pkg).sort();
  for (const must of ["installer", "skills", ".claude-plugin", "LICENSE", "package.json"]) assert.ok(top.includes(must), `${must} missing`);
  for (const never of ["test", ".github", "scripts"]) assert.equal(top.includes(never), false, `${never} must not be published`);
});
