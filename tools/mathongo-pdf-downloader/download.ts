/**
 * Downloads JEE Main previous year question paper PDFs listed on
 * https://www.mathongo.com/iit-jee/jee-main-previous-year-question-paper
 *
 * The page lists each paper in a table (year/session sections marked by <h3>
 * headings) with a "Download PDF" link that goes to a links.mathongo.com
 * short link, which redirects to a Google Drive file. This script parses the
 * listing, resolves every link, and saves the PDFs to disk grouped by
 * section.
 *
 * Usage:
 *   npx tsx tools/mathongo-pdf-downloader/download.ts [options]
 *
 * Options:
 *   --out <dir>          Output directory (default: tools/mathongo-pdf-downloader/downloads)
 *   --concurrency <n>    Parallel downloads (default: 3)
 *   --limit <n>          Only process the first n papers (useful for testing)
 *   --year <text>        Only download sections whose heading includes this text (case-insensitive)
 *   --force              Re-download even if the destination file already exists
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

const LISTING_URL =
  "https://www.mathongo.com/iit-jee/jee-main-previous-year-question-paper";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

interface CliOptions {
  outDir: string;
  concurrency: number;
  limit: number | null;
  yearFilter: string | null;
  force: boolean;
}

interface PaperEntry {
  section: string;
  name: string;
  shortLink: string;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    outDir: path.join(import.meta.dirname, "downloads"),
    concurrency: 3,
    limit: null,
    yearFilter: null,
    force: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--out":
        options.outDir = argv[++i];
        break;
      case "--concurrency":
        options.concurrency = Number(argv[++i]);
        break;
      case "--limit":
        options.limit = Number(argv[++i]);
        break;
      case "--year":
        options.yearFilter = argv[++i];
        break;
      case "--force":
        options.force = true;
        break;
      default:
        console.warn(`Ignoring unknown argument: ${arg}`);
    }
  }

  return options;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#8211;/g, "-")
    .replace(/&#8217;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function sanitizeForFilesystem(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** "Download JEE Main 2025 (January) Previous Year Question Papers as PDF" -> "JEE Main 2025 (January)" */
function shortenSectionName(section: string): string {
  return section
    .replace(/^Download\s+/i, "")
    .replace(/\s+Previous Year Question Papers as PDF$/i, "");
}

async function fetchListingHtml(): Promise<string> {
  const res = await fetch(LISTING_URL, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch listing page: HTTP ${res.status}`);
  }
  return res.text();
}

/**
 * The listing is a sequence of <h3>section title</h3> blocks, each followed
 * by a table whose rows look like:
 *   <tr><td>1</td><td>Paper name</td><td><a href="https://links.mathongo.com/xxxx">Download PDF</a></td></tr>
 */
function parsePapers(html: string): PaperEntry[] {
  const sectionSplit = html.split(/<h3[^>]*>/i);
  const papers: PaperEntry[] = [];

  // sectionSplit[0] is content before the first <h3>; skip it.
  for (let i = 1; i < sectionSplit.length; i++) {
    const chunk = sectionSplit[i];
    const headingMatch = chunk.match(/^(.*?)<\/h3>/i);
    const section = headingMatch
      ? decodeHtmlEntities(headingMatch[1].replace(/<[^>]+>/g, ""))
      : `Section ${i}`;

    const rowPattern =
      /<tr>\s*<td>\d+<\/td>\s*<td>(.*?)<\/td>\s*<td>\s*<a href="(https:\/\/links\.mathongo\.com\/[^"]+)"[^>]*>\s*Download PDF\s*<\/a>\s*<\/td>\s*<\/tr>/gi;

    let match: RegExpExecArray | null;
    while ((match = rowPattern.exec(chunk)) !== null) {
      papers.push({
        section,
        name: decodeHtmlEntities(match[1].replace(/<[^>]+>/g, "")),
        shortLink: match[2],
      });
    }
  }

  return papers;
}

/** Pulls hidden <input name=... value=...> pairs out of Google Drive's virus-scan warning page. */
function extractHiddenFormFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const inputPattern = /<input[^>]+type="hidden"[^>]+>/gi;
  let match: RegExpExecArray | null;
  while ((match = inputPattern.exec(html)) !== null) {
    const tag = match[0];
    const name = tag.match(/name="([^"]+)"/)?.[1];
    const value = tag.match(/value="([^"]*)"/)?.[1] ?? "";
    if (name) fields[name] = value;
  }
  return fields;
}

interface DownloadResult {
  ok: boolean;
  reason?: string;
}

async function downloadPaper(
  paper: PaperEntry,
  destPath: string,
): Promise<DownloadResult> {
  // Following the links.mathongo.com short link lands on the Google Drive
  // "view" page; pull the file id out of the final URL.
  const shortLinkRes = await fetch(paper.shortLink, {
    headers: { "User-Agent": USER_AGENT },
  });
  const driveIdMatch = shortLinkRes.url.match(
    /(?:\/file\/d\/|[?&]id=)([-\w]{10,})/,
  );
  await shortLinkRes.body?.cancel();
  if (!driveIdMatch) {
    return {
      ok: false,
      reason: `could not resolve a Google Drive file id from ${shortLinkRes.url}`,
    };
  }
  const fileId = driveIdMatch[1];

  let downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(downloadUrl, {
      headers: { "User-Agent": USER_AGENT },
    });
    const contentType = res.headers.get("content-type") ?? "";

    if (contentType.includes("text/html")) {
      const html = await res.text();
      if (/quota exceeded/i.test(html)) {
        return {
          ok: false,
          reason: "Google Drive download quota exceeded for this file, try again later",
        };
      }
      // Large-file virus-scan warning page: resubmit with its hidden fields.
      const fields = extractHiddenFormFields(html);
      if (fields.id) {
        const params = new URLSearchParams(fields);
        downloadUrl = `https://drive.usercontent.google.com/download?${params.toString()}`;
        continue;
      }
      return {
        ok: false,
        reason: "Google Drive returned an unexpected HTML page instead of the file",
      };
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0) {
      return { ok: false, reason: "downloaded file was empty" };
    }
    await fs.writeFile(destPath, buffer);
    return { ok: true };
  }

  return { ok: false, reason: "gave up after following Google Drive's confirmation page" };
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  async function next(): Promise<void> {
    const index = cursor++;
    if (index >= items.length) return;
    await worker(items[index], index);
    return next();
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log(`Fetching listing page: ${LISTING_URL}`);
  const html = await fetchListingHtml();
  let papers = parsePapers(html);
  console.log(`Found ${papers.length} papers across ${new Set(papers.map((p) => p.section)).size} sections.`);

  if (options.yearFilter) {
    papers = papers.filter((p) =>
      p.section.toLowerCase().includes(options.yearFilter!.toLowerCase()),
    );
    console.log(`Filtered to ${papers.length} papers matching "${options.yearFilter}".`);
  }
  if (options.limit !== null) {
    papers = papers.slice(0, options.limit);
  }

  await fs.mkdir(options.outDir, { recursive: true });

  let succeeded = 0;
  const failures: { paper: PaperEntry; reason: string }[] = [];

  await runWithConcurrency(papers, options.concurrency, async (paper) => {
    const sectionDir = path.join(
      options.outDir,
      sanitizeForFilesystem(shortenSectionName(paper.section)),
    );
    await fs.mkdir(sectionDir, { recursive: true });
    const destPath = path.join(sectionDir, `${sanitizeForFilesystem(paper.name)}.pdf`);

    if (!options.force) {
      try {
        const stat = await fs.stat(destPath);
        if (stat.size > 0) {
          console.log(`Skipping (already exists): ${paper.name}`);
          succeeded++;
          return;
        }
      } catch {
        // File doesn't exist yet, proceed with download.
      }
    }

    try {
      const result = await downloadPaper(paper, destPath);
      if (result.ok) {
        console.log(`Downloaded: ${paper.name}`);
        succeeded++;
      } else {
        console.warn(`Failed: ${paper.name} (${result.reason})`);
        failures.push({ paper, reason: result.reason ?? "unknown error" });
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.warn(`Failed: ${paper.name} (${reason})`);
      failures.push({ paper, reason });
    }
  });

  console.log(`\nDone: ${succeeded}/${papers.length} downloaded to ${options.outDir}`);
  if (failures.length > 0) {
    console.log(`\n${failures.length} failure(s):`);
    for (const { paper, reason } of failures) {
      console.log(`  - ${paper.name}: ${reason}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
