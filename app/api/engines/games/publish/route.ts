/**
 * Game Engine publish API — turns a DokuWorld into a REAL game on opendoku.com.
 *
 * POST { action: "preview" | "publish", modeId, templateId, world, overwrite? }
 *
 * Drivers:
 *  - local-git (works today): the opendoku repo checked out on this machine
 *    (OPENDOKU_REPO_PATH, default ~/OpenDoku/opendoku). Publish writes the
 *    game folder + homepage card, commits, and pushes main → Vercel deploys
 *    opendoku.com. This is the driver used while building/testing.
 *  - github-api (later): commit via the GitHub contents API using a
 *    GITHUB_TOKEN env var, so publishing works from stepinthering.com in
 *    production. Not implemented yet — the route says so honestly.
 *
 * Privileges: open during the build phase (see app/engines/games/privileges.ts).
 * When DJ adds roles, enforce them HERE too, not just in the UI.
 */

import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";
import {
  buildIconSvg, buildManifest, buildServiceWorker, getTemplate,
  instantiateTemplate, upsertHomepageCard, validateWorld, type DokuWorld,
} from "../../../../engines/games/game-modes";
import { canPublish } from "../../../../engines/games/privileges";

export const runtime = "nodejs";

const run = promisify(execFile);

function repoPath(): string {
  return process.env.OPENDOKU_REPO_PATH || path.join(os.homedir(), "OpenDoku", "opendoku");
}

async function localRepoAvailable(): Promise<boolean> {
  try {
    await fs.stat(path.join(repoPath(), ".git"));
    return true;
  } catch {
    return false;
  }
}

const bad = (status: number, error: string) => NextResponse.json({ error }, { status });

/**
 * Upsert this game into app/live/live-products.json and push the change, so
 * every engine publish lands on stepinthering.com/live automatically.
 * Runs in THIS repo (process.cwd() is the step-in-the-ring root in dev).
 */
async function registerLiveProduct(world: DokuWorld): Promise<string> {
  const registryPath = path.join(process.cwd(), "app", "live", "live-products.json");
  const raw = await fs.readFile(registryPath, "utf8");
  const products: Array<Record<string, string>> = JSON.parse(raw);
  const entry = {
    id: world.slug,
    name: world.name,
    emoji: world.emoji,
    url: `https://opendoku.com/${world.slug}/`,
    engine: "game",
    blurb: world.cardBlurb,
    pushedAt: new Date().toISOString().slice(0, 10),
    by: "Game Engine",
  };
  const i = products.findIndex((p) => p.id === world.slug);
  if (i >= 0) products[i] = { ...products[i], ...entry, pushedAt: products[i].pushedAt };
  else products.push(entry);
  await fs.writeFile(registryPath, JSON.stringify(products, null, 2) + "\n");

  const relPath = "app/live/live-products.json";
  const { stdout: dirty } = await run("git", ["status", "--porcelain", "--", relPath], { cwd: process.cwd() });
  if (!dirty.trim()) return "already registered";
  await run("git", ["add", relPath], { cwd: process.cwd() });
  await run("git", ["commit", "-m",
    `Live page: ${world.name} pushed by the Game Engine\n\nCo-Authored-By: Claude Fable 5 <noreply@anthropic.com>`,
    "--", relPath], { cwd: process.cwd() });
  await run("git", ["push", "origin", "main"], { cwd: process.cwd() });
  return "registered + pushed";
}

export async function POST(req: Request) {
  let body: { action?: string; modeId?: string; templateId?: string; world?: DokuWorld; overwrite?: boolean };
  try {
    body = await req.json();
  } catch {
    return bad(400, "Invalid JSON body.");
  }
  const { action, modeId = "", templateId = "", world, overwrite } = body;

  if (modeId !== "opendoku") return bad(400, `Unknown or unsupported mode "${modeId}". OpenDoku is the live mode.`);
  const template = getTemplate(modeId, templateId);
  if (!template) return bad(400, `Unknown template "${templateId}".`);
  if (!world) return bad(400, "Missing world.");
  const errors = validateWorld(world);
  if (errors.length) return bad(422, errors.join(" "));

  if (!(await localRepoAvailable())) {
    return bad(501,
      "No publish driver available here. Local driver needs the opendoku repo at " + repoPath() +
      " (set OPENDOKU_REPO_PATH). The github-api driver for production arrives with GITHUB_TOKEN later.");
  }

  const repo = repoPath();
  let templateHtml: string;
  try {
    templateHtml = await fs.readFile(path.join(repo, template.file), "utf8");
  } catch {
    return bad(500, `Template ${template.file} not found in the opendoku repo — pull latest main.`);
  }
  const gameHtml = instantiateTemplate(templateHtml, world);

  if (action === "preview") {
    return NextResponse.json({ ok: true, html: gameHtml });
  }

  if (action !== "publish") return bad(400, `Unknown action "${action}".`);
  if (!canPublish()) return bad(403, "You don't have publish privileges.");

  const gameDir = path.join(repo, world.slug);
  const exists = await fs.stat(gameDir).then(() => true).catch(() => false);
  if (exists && !overwrite) {
    return bad(409, `"${world.slug}" already exists on opendoku.com. Publish again with overwrite to update it.`);
  }

  try {
    // Make sure we build on top of the latest platform state.
    await run("git", ["pull", "--ff-only", "origin", "main"], { cwd: repo });

    await fs.mkdir(gameDir, { recursive: true });
    await fs.writeFile(path.join(gameDir, "index.html"), gameHtml);
    await fs.writeFile(path.join(gameDir, "manifest.json"), buildManifest(world));
    await fs.writeFile(path.join(gameDir, "sw.js"), buildServiceWorker(world));
    await fs.writeFile(path.join(gameDir, "icon.svg"), buildIconSvg(world));

    const indexPath = path.join(repo, "index.html");
    const indexHtml = await fs.readFile(indexPath, "utf8");
    await fs.writeFile(indexPath, upsertHomepageCard(indexHtml, world));

    await run("git", ["add", world.slug, "index.html"], { cwd: repo });
    const message =
      `${exists ? "Update" : "Launch"} ${world.name} (${world.slug}) — published by the StepInTheRing Game Engine\n\n` +
      `Template: ${template.name}. ${world.tagline}\n\n` +
      `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`;
    await run("git", ["commit", "-m", message], { cwd: repo });
    const { stdout: hash } = await run("git", ["rev-parse", "--short", "HEAD"], { cwd: repo });
    await run("git", ["push", "origin", "main"], { cwd: repo });

    // Register the push on stepinthering.com/live (best-effort — a failure
    // here must never fail the game publish itself).
    const liveRegistry = await registerLiveProduct(world).catch(
      (e) => `failed: ${e instanceof Error ? e.message : String(e)}`,
    );

    return NextResponse.json({
      ok: true,
      driver: "local-git",
      commit: hash.trim(),
      url: `https://opendoku.com/${world.slug}/`,
      updated: exists,
      liveRegistry,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return bad(500, "Publish failed: " + msg);
  }
}
