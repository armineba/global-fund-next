import { spawnSync } from "node:child_process";
import { constants } from "node:fs";
import {
  access,
  copyFile,
  lstat,
  mkdir,
  readdir,
  rename,
  rm,
  symlink,
  stat,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const web = path.join(root, "apps", "web");
const releases = path.join(web, ".releases");
const dist = path.join(web, "dist");
const next = path.join(web, "dist.next");
const vite = path.join(web, "node_modules", "vite", "bin", "vite.js");
const id = `${new Date().toISOString().replaceAll(/[:.]/g, "-")}-${process.pid}`;
const stage = path.join(releases, `.stage-${id}`);
const release = path.join(releases, id);

function isHashedAsset(name) {
  // Vite emits names such as app-D8x2kLmQ.js and chunk.abc12345.css.
  return /(?:^|[-.])[A-Za-z0-9_-]{8,}(?=\.)/.test(name);
}

async function copyPreviousHashedAssets(source, target) {
  let entries;
  try {
    entries = await readdir(source, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return 0;
    throw error;
  }

  let copied = 0;
  for (const entry of entries) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copied += await copyPreviousHashedAssets(from, to);
    } else if (entry.isFile() && isHashedAsset(entry.name)) {
      try {
        await access(to, constants.F_OK);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        await mkdir(path.dirname(to), { recursive: true });
        await copyFile(from, to, constants.COPYFILE_EXCL);
        copied += 1;
      }
    }
  }
  return copied;
}

async function existingDistKind() {
  try {
    const entry = await lstat(dist);
    if (entry.isSymbolicLink()) return (await stat(dist)).isDirectory() ? "symlink" : "invalid";
    return entry.isDirectory() ? "directory" : "invalid";
  } catch (error) {
    if (error.code === "ENOENT") return "missing";
    throw error;
  }
}

async function run() {
  await mkdir(releases, { recursive: true });
  await mkdir(stage, { recursive: false });
  console.log("[web build] Building into a private staging directory…");

  const result = spawnSync(process.execPath, [vite, "build", "--outDir", stage, "--emptyOutDir"], {
    cwd: web,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const details = (result.stderr || result.stdout || "").trim();
    throw new Error(`Vite build failed with status ${result.status}${details ? `:\n${details}` : "."}`);
  }

  const index = path.join(stage, "index.html");
  await access(index, constants.R_OK);
  const kind = await existingDistKind();
  if (kind === "invalid") throw new Error("apps/web/dist exists but is neither a directory nor a directory symlink.");

  let retained = 0;
  if (kind !== "missing") retained = await copyPreviousHashedAssets(path.join(dist, "assets"), path.join(stage, "assets"));
  await rename(stage, release);

  try {
    const nextEntry = await lstat(next).catch((error) => error.code === "ENOENT" ? null : Promise.reject(error));
    if (nextEntry) {
      if (!nextEntry.isSymbolicLink()) throw new Error("apps/web/dist.next exists and is not a symlink; refusing to replace it.");
      await rm(next);
    }
    await symlink(path.relative(web, release), next, "dir");

    if (kind === "directory") {
      const legacy = path.join(releases, `legacy-${id}`);
      await rename(dist, legacy);
      try {
        await rename(next, dist);
      } catch (error) {
        await rename(legacy, dist).catch(() => {});
        throw error;
      }
      console.log("[web build] First conversion moved the prior physical dist into .releases/legacy-*. The dist pathname is briefly absent during this one-time switch.");
    } else {
      await rename(next, dist);
    }
  } catch (error) {
    await rm(next, { force: true }).catch(() => {});
    throw error;
  }

  console.log(`[web build] Published ${path.relative(web, release)}; kept ${retained} prior hashed asset${retained === 1 ? "" : "s"}.`);
  console.log("[web build] Releases are retained; monitor disk usage and remove old releases manually when safe.");
}

run().catch(async (error) => {
  await rm(stage, { recursive: true, force: true }).catch(() => {});
  console.error(`[web build] ${error.message}`);
  process.exitCode = 1;
});
