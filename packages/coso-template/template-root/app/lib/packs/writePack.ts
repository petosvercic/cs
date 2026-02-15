import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

type ProductConfig = {
  engine?: {
    subject?: string;
    activePackId?: string;
    availablePackIds?: string[];
  };
};

type UnknownItem = { title: string; blurredHint: string };

type NotesShape = {
  westernZodiac: string[];
  chineseZodiac: string[];
  chineseZodiacByAnimal: Record<string, string[]>;
  daysAlive: string[];
  famous: string[];
  blurredIntro: string[];
};

type PaywallCopyShape = {
  title: string;
  intro: string[];
  unlockTitle: string;
  unlockBullets: string[];
  sharingTitle: string;
  sharingText: string[];
  howToContinue: string;
  fastPayBtn: string;
  fastPayNote: string;
  smsBtn: string;
  smsTitle: string;
  smsText: string[];
  smsNote: string;
  priceLine: string;
  closing: string;
  postPaidTitle: string;
  postPaidIntro: string[];
  postPaidFooterPool: string[];
};

export type WritePackPayload = {
  unknownList?: unknown;
  notes?: unknown;
  paywallCopy?: unknown;
};

export type WritePackOptions = {
  commitMessage?: string;
  setActive?: boolean;
};

type PublishResult = {
  packId: string;
  availablePackIds: string[];
  activePackId: string;
  publishMode: "github" | "local";
  branchName: string | null;
  prUrl: string | null;
  commitSha: string | null;
};

type PreparedPack = {
  packPath: string;
  files: Record<string, string>;
  configPath: string;
  configContent: string;
  availablePackIds: string[];
  activePackId: string;
};

const PACK_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validatePackId(packId: string): void {
  if (!PACK_ID_RE.test(packId) || packId.length < 3 || packId.length > 64) {
    throw new Error("invalid-pack-id");
  }
}

function normalizeUnknownList(input: unknown): UnknownItem[] {
  if (!Array.isArray(input)) {
    return [{ title: "Default unknown", blurredHint: "Približne {n}." }];
  }

  const normalized = input
    .map((entry): UnknownItem | null => {
      if (typeof entry === "string") {
        return { title: entry, blurredHint: "Približne {n}." };
      }
      if (entry && typeof entry === "object") {
        const title = typeof (entry as { title?: unknown }).title === "string" ? (entry as { title: string }).title : "Default unknown";
        const blurredHint =
          typeof (entry as { blurredHint?: unknown }).blurredHint === "string"
            ? (entry as { blurredHint: string }).blurredHint
            : "Približne {n}.";
        return { title, blurredHint };
      }
      return null;
    })
    .filter((entry): entry is UnknownItem => Boolean(entry));

  return normalized.length > 0 ? normalized : [{ title: "Default unknown", blurredHint: "Približne {n}." }];
}

function normalizeStringArray(input: unknown, fallback: string[]): string[] {
  if (!Array.isArray(input)) return fallback;
  const values = input.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
  return values.length > 0 ? values : fallback;
}

function normalizeNotes(input: unknown): NotesShape {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return {
    westernZodiac: normalizeStringArray(source.westernZodiac, ["Default western zodiac note."]),
    chineseZodiac: normalizeStringArray(source.chineseZodiac, ["Default chinese zodiac note."]),
    chineseZodiacByAnimal:
      source.chineseZodiacByAnimal && typeof source.chineseZodiacByAnimal === "object"
        ? Object.fromEntries(
            Object.entries(source.chineseZodiacByAnimal as Record<string, unknown>).map(([key, value]) => [
              key,
              normalizeStringArray(value, ["Default animal note."]),
            ])
          )
        : { Potkan: ["Default animal note."] },
    daysAlive: normalizeStringArray(source.daysAlive, ["{days} dní."]),
    famous: normalizeStringArray(source.famous, ["Default famous note."]),
    blurredIntro: normalizeStringArray(source.blurredIntro, ["Čo ďalej určite nevieš:"]),
  };
}

function normalizePaywallCopy(input: unknown): PaywallCopyShape {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return {
    title: typeof source.title === "string" ? source.title : "Toto bola len časť.",
    intro: normalizeStringArray(source.intro, ["Doteraz si videl len časť."]),
    unlockTitle: typeof source.unlockTitle === "string" ? source.unlockTitle : "Po odomknutí uvidíš:",
    unlockBullets: normalizeStringArray(source.unlockBullets, ["Rozmazané čísla a súvislosti."]),
    sharingTitle: typeof source.sharingTitle === "string" ? source.sharingTitle : "Zdieľanie",
    sharingText: normalizeStringArray(source.sharingText, ["Po odomknutí sa zobrazí tlačidlo zdieľania."]),
    howToContinue: typeof source.howToContinue === "string" ? source.howToContinue : "Ako chceš pokračovať?",
    fastPayBtn: typeof source.fastPayBtn === "string" ? source.fastPayBtn : "Rýchla platba",
    fastPayNote: typeof source.fastPayNote === "string" ? source.fastPayNote : "Najrýchlejšia cesta.",
    smsBtn: typeof source.smsBtn === "string" ? source.smsBtn : "Platba cez SMS",
    smsTitle: typeof source.smsTitle === "string" ? source.smsTitle : "SMS (alternatíva)",
    smsText: Array.isArray(source.smsText)
      ? normalizeStringArray(source.smsText, ["SMS flow je dostupný ako alternatíva."])
      : typeof source.smsText === "string"
        ? [source.smsText]
        : ["SMS flow je dostupný ako alternatíva."],
    smsNote: typeof source.smsNote === "string" ? source.smsNote : "Ak nechceš riešiť kartu.",
    priceLine: typeof source.priceLine === "string" ? source.priceLine : "Zaplatíš raz. Dostaneš celý výsledok.",
    closing: typeof source.closing === "string" ? source.closing : "Nie je to veštba.",
    postPaidTitle: typeof source.postPaidTitle === "string" ? source.postPaidTitle : "Teraz už vidíš celý obraz.",
    postPaidIntro: normalizeStringArray(source.postPaidIntro, ["Teraz sa rozmazané veci dávajú do súvislostí."]),
    postPaidFooterPool: normalizeStringArray(source.postPaidFooterPool, ["Nie všetko sa dá zmerať."]),
  };
}

function moduleSource(name: string, value: unknown): string {
  return `export const ${name} = ${JSON.stringify(value, null, 2)} as const;\n`;
}

function ensureGitAvailable(repoRoot: string): void {
  const result = spawnSync("git", ["--version"], { cwd: repoRoot, encoding: "utf8" });
  if (result.error || result.status !== 0) {
    throw new Error("git-not-available");
  }
}

function runGit(args: string[], repoRoot: string, env: NodeJS.ProcessEnv): string {
  const result = spawnSync("git", args, { cwd: repoRoot, encoding: "utf8", env });
  if (result.error || result.status !== 0) {
    const message = result.stderr?.trim() || result.stdout?.trim() || `git ${args.join(" ")} failed`;
    throw new Error(message);
  }
  return (result.stdout || "").trim();
}

function resolveTemplateRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..", "..", "..");
}

function timestampForBranch(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
}

async function preparePackFiles(templateRoot: string, packId: string, payload: WritePackPayload, opts?: WritePackOptions): Promise<PreparedPack> {
  const unknownList = normalizeUnknownList(payload.unknownList);
  const notes = normalizeNotes(payload.notes);
  const paywallCopy = normalizePaywallCopy(payload.paywallCopy);

  const configPath = path.join(templateRoot, "product.config.json");
  const rawConfig = await fs.readFile(configPath, "utf8");
  const config = JSON.parse(rawConfig) as ProductConfig;

  const available = Array.isArray(config.engine?.availablePackIds)
    ? config.engine?.availablePackIds.filter((id): id is string => typeof id === "string")
    : ["default"];

  if (!available.includes(packId)) {
    available.push(packId);
  }

  config.engine = {
    ...(config.engine ?? {}),
    availablePackIds: available,
    activePackId: opts?.setActive ? packId : config.engine?.activePackId,
  };

  const configContent = `${JSON.stringify(config, null, 2)}\n`;
  const packPath = `app/data/packs/${packId}`;

  return {
    packPath,
    files: {
      [`${packPath}/unknownList.ts`]: moduleSource("unknownItems", unknownList),
      [`${packPath}/notes.ts`]: moduleSource("notes", notes),
      [`${packPath}/paywallCopy.ts`]: moduleSource("paywallCopy", paywallCopy),
    },
    configPath: "product.config.json",
    configContent,
    availablePackIds: available,
    activePackId: config.engine.activePackId ?? "default",
  };
}

async function writePreparedToDisk(templateRoot: string, prepared: PreparedPack) {
  await fs.mkdir(path.join(templateRoot, prepared.packPath), { recursive: true });

  const writes = Object.entries(prepared.files).map(([relativePath, content]) =>
    fs.writeFile(path.join(templateRoot, relativePath), content, "utf8")
  );

  writes.push(fs.writeFile(path.join(templateRoot, prepared.configPath), prepared.configContent, "utf8"));
  await Promise.all(writes);
}

async function githubRequest<T>(
  token: string,
  owner: string,
  repo: string,
  endpoint: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}${body ? `: ${body}` : ""}`);
  }

  return (await response.json()) as T;
}

async function publishWithGitHub(
  prepared: PreparedPack,
  packId: string,
  commitMessage: string
): Promise<Pick<PublishResult, "publishMode" | "branchName" | "prUrl" | "commitSha">> {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const base = process.env.GITHUB_BASE_BRANCH || "main";

  if (!token || !owner || !repo) {
    throw new Error("missing-github-env");
  }

  const branchName = `builder/pack-${packId}-${timestampForBranch()}`;

  const baseRef = await githubRequest<{ object: { sha: string } }>(token, owner, repo, `/git/ref/heads/${base}`);
  const baseCommitSha = baseRef.object.sha;

  await githubRequest(token, owner, repo, `/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseCommitSha }),
  });

  const baseCommit = await githubRequest<{ tree: { sha: string } }>(token, owner, repo, `/git/commits/${baseCommitSha}`);

  const entries = [
    ...Object.entries(prepared.files),
    [prepared.configPath, prepared.configContent] as const,
  ];

  const tree = await Promise.all(
    entries.map(async ([filePath, content]) => {
      const blob = await githubRequest<{ sha: string }>(token, owner, repo, `/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content, encoding: "utf-8" }),
      });
      return {
        path: `packages/coso-template/template-root/${filePath}`,
        mode: "100644",
        type: "blob",
        sha: blob.sha,
      };
    })
  );

  const newTree = await githubRequest<{ sha: string }>(token, owner, repo, `/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree }),
  });

  const commit = await githubRequest<{ sha: string }>(token, owner, repo, `/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message: commitMessage, tree: newTree.sha, parents: [baseCommitSha] }),
  });

  await githubRequest(token, owner, repo, `/git/refs/heads/${branchName}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  const pr = await githubRequest<{ html_url: string }>(token, owner, repo, `/pulls`, {
    method: "POST",
    body: JSON.stringify({
      title: `builder: publish pack ${packId}`,
      head: branchName,
      base,
      body: `Automated publish for content pack \`${packId}\`.`,
    }),
  });

  return {
    publishMode: "github",
    branchName,
    prUrl: pr.html_url,
    commitSha: commit.sha,
  };
}

async function publishWithLocalGit(
  templateRoot: string,
  prepared: PreparedPack,
  commitMessage: string
): Promise<Pick<PublishResult, "publishMode" | "branchName" | "prUrl" | "commitSha">> {
  await writePreparedToDisk(templateRoot, prepared);

  const committerName = process.env.BUILDER_GIT_COMMITTER_NAME;
  const committerEmail = process.env.BUILDER_GIT_COMMITTER_EMAIL;

  if (!committerName || !committerEmail) {
    throw new Error("missing-git-committer-env");
  }

  const repoRoot = path.resolve(templateRoot, "..", "..", "..");
  ensureGitAvailable(repoRoot);

  const gitEnv = {
    ...process.env,
    GIT_AUTHOR_NAME: committerName,
    GIT_AUTHOR_EMAIL: committerEmail,
    GIT_COMMITTER_NAME: committerName,
    GIT_COMMITTER_EMAIL: committerEmail,
  };

  runGit(
    [
      "add",
      `packages/coso-template/template-root/${prepared.packPath}`,
      `packages/coso-template/template-root/${prepared.configPath}`,
    ],
    repoRoot,
    gitEnv
  );

  runGit(["commit", "-m", commitMessage], repoRoot, gitEnv);
  const commitSha = runGit(["rev-parse", "HEAD"], repoRoot, gitEnv);

  return {
    publishMode: "local",
    branchName: null,
    prUrl: null,
    commitSha: commitSha || null,
  };
}

function hasGitHubEnv(): boolean {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO);
}

export async function writePackToRepo(packId: string, payload: WritePackPayload, opts?: WritePackOptions): Promise<PublishResult> {
  validatePackId(packId);

  const templateRoot = resolveTemplateRoot();
  const prepared = await preparePackFiles(templateRoot, packId, payload, opts);
  const commitMessage = opts?.commitMessage || `builder: publish pack ${packId}`;

  let publishMeta: Awaited<ReturnType<typeof publishWithGitHub>> | Awaited<ReturnType<typeof publishWithLocalGit>>;

  if (hasGitHubEnv()) {
    try {
      publishMeta = await publishWithGitHub(prepared, packId, commitMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`github-publish-failed: ${message}`);
    }
  } else {
    publishMeta = await publishWithLocalGit(templateRoot, prepared, commitMessage);
  }

  return {
    packId,
    availablePackIds: prepared.availablePackIds,
    activePackId: prepared.activePackId,
    ...publishMeta,
  };
}
