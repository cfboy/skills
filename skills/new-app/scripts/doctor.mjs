#!/usr/bin/env node
/**
 * Is this machine ready for new-app? Checks, and with --fix repairs, what it
 * safely can. What needs an administrator (installing a container runtime) is
 * never done here: it is printed as the exact command, for the agent to put to
 * the user.
 *
 *   node doctor.mjs          # report only
 *   node doctor.mjs --fix    # also: pnpm, start a stopped Docker/Podman,
 *                            # install the verification skills
 *
 * Exit 0 when everything required is ready. The Supabase CLI is not checked:
 * each project pins it as a dev dependency. Mailpit, the local inbox, comes
 * with the Supabase stack.
 */
import { execSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const FIX = process.argv.includes("--fix");
const platform = process.platform; // darwin | linux | win32
const has = (cmd) =>
  spawnSync(platform === "win32" ? "where" : "which", [cmd], { stdio: "ignore" }).status === 0;
const ok = (cmd) => spawnSync(cmd, { shell: true, stdio: "ignore", timeout: 30000 }).status === 0;
const out = (cmd) => {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"], timeout: 30000 }).toString().trim();
  } catch {
    return "";
  }
};
const run = (cmd) => {
  console.log(`  $ ${cmd}`);
  return spawnSync(cmd, { shell: true, stdio: "inherit", timeout: 600000 }).status === 0;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
const report = (status, name, detail, action) => results.push({ status, name, detail, action });

// --- Node ------------------------------------------------------------------
const major = Number(process.versions.node.split(".")[0]);
if (major >= 22) report("ok", "Node", process.versions.node);
else
  report("missing", "Node", `${process.versions.node}, needs 22+`, {
    needsUser: true,
    command:
      platform === "win32"
        ? "winget install OpenJS.NodeJS.LTS"
        : platform === "darwin" && has("brew")
          ? "brew install node@24"
          : "install Node 24 with your version manager (fnm, nvm, mise) or from nodejs.org",
  });

// --- git -------------------------------------------------------------------
if (has("git")) report("ok", "git", out("git --version"));
else
  report("missing", "git", "not found", {
    needsUser: true,
    command:
      platform === "darwin" ? "xcode-select --install" : platform === "win32" ? "winget install Git.Git" : "sudo apt install git",
  });

// --- pnpm ------------------------------------------------------------------
if (has("pnpm")) report("ok", "pnpm", out("pnpm -v"));
else if (FIX && (run("corepack enable pnpm") || run("npm install -g pnpm")) && has("pnpm"))
  report("fixed", "pnpm", out("pnpm -v"));
else report("missing", "pnpm", "not found", { command: "npm install -g pnpm" });

// --- Container runtime: Docker or Podman -------------------------------------
// The Supabase CLI runs its local stack (Postgres, the API, Studio, Mailpit) in
// containers. Docker Desktop, OrbStack, Colima and Podman all work; the
// project's scripts/supabase.sh points the CLI at Podman's socket by itself.
const dockerUp = () => has("docker") && ok("docker info");
const podmanUp = () =>
  has("podman") &&
  (platform === "linux" ? ok("podman info") : out("podman machine list --format {{.Running}}").includes("true"));

async function startRuntime() {
  if (has("podman") && !has("docker")) {
    if (platform === "linux") return run("systemctl --user start podman.socket") || true;
    if (!out("podman machine list --format {{.Name}}")) run("podman machine init");
    return run("podman machine start");
  }
  if (platform === "darwin") {
    if (existsSync("/Applications/OrbStack.app")) return run("open -a OrbStack");
    if (existsSync("/Applications/Docker.app")) return run("open -a Docker");
    if (has("colima")) return run("colima start");
  }
  if (platform === "win32") return run('powershell -Command "Start-Process \'Docker Desktop\'"');
  return false; // Linux Docker needs sudo: the user's call.
}

if (dockerUp()) report("ok", "Containers", `Docker ${out("docker version --format {{.Server.Version}}")}`);
else if (podmanUp()) report("ok", "Containers", `Podman ${out("podman --version").replace(/^podman version /, "")}`);
else if (has("docker") || has("podman")) {
  const which = has("podman") && !has("docker") ? "Podman" : "Docker";
  if (FIX && (await startRuntime())) {
    for (let i = 0; i < 60 && !(dockerUp() || podmanUp()); i++) await sleep(2000);
  }
  if (dockerUp() || podmanUp()) report("fixed", "Containers", `${which} started`);
  else
    report("missing", "Containers", `${which} is installed but not running`, {
      needsUser: true,
      command:
        which === "Podman"
          ? platform === "linux"
            ? "systemctl --user start podman.socket"
            : "podman machine start"
          : platform === "linux"
            ? "sudo systemctl start docker"
            : "open the Docker Desktop (or OrbStack) app",
    });
} else
  report("missing", "Containers", "no Docker or Podman", {
    needsUser: true,
    command:
      platform === "darwin"
        ? "brew install --cask orbstack    # or: brew install --cask docker / brew install podman"
        : platform === "win32"
          ? "winget install RedHat.Podman-Desktop    # or: winget install Docker.DockerDesktop"
          : "sudo apt install podman    # or Docker: curl -fsSL https://get.docker.com | sh",
  });

// --- Verification skills (pstack) ---------------------------------------------
// Optional: without them new-app builds and verifies everything but the
// browser, and says so.
const skillDirs = [
  path.join(process.cwd(), ".agents/skills"),
  path.join(process.cwd(), ".claude/skills"),
  path.join(os.homedir(), ".agents/skills"),
  path.join(os.homedir(), ".claude/skills"),
  path.join(os.homedir(), ".cursor/skills"),
  path.join(os.homedir(), ".codex/skills"),
];
const hasSkill = (name) => skillDirs.some((d) => existsSync(path.join(d, name, "SKILL.md")));
const VERIFY = ["create-verification-skill", "maintain-verification-skill"];
const INSTALL_VERIFY =
  "npx -y skills add cursor/plugins --skill create-verification-skill --skill maintain-verification-skill -g -y";
if (VERIFY.every(hasSkill)) report("ok", "Verification skills", "pstack's create/maintain-verification-skill");
else if (FIX && run(INSTALL_VERIFY) && VERIFY.every(hasSkill))
  report("fixed", "Verification skills", "installed for your user (restart the agent to load them)");
else
  report("optional", "Verification skills", "not installed: browser verification will be skipped", {
    command: INSTALL_VERIFY,
  });

// --- Report ------------------------------------------------------------------
const icon = { ok: "ok   ", fixed: "fixed", missing: "MISS ", optional: "opt  " };
console.log("\nnew-app — machine check\n");
for (const r of results) {
  console.log(`  ${icon[r.status]}  ${r.name.padEnd(20)} ${r.detail}`);
  if (r.action) console.log(`         ${r.action.needsUser ? "ask the user, then run:" : "run:"} ${r.action.command}`);
}
const blocking = results.filter((r) => r.status === "missing");
console.log(blocking.length ? `\n${blocking.length} required item(s) missing.` : "\nReady.");
process.exit(blocking.length ? 1 : 0);
