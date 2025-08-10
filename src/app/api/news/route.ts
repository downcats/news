import Parser from "rss-parser";
import { getOpenAIClient, MODEL_EMBEDDING, MODEL_SUMMARY } from "@/lib/openai";
import { NEWS_SOURCES } from "@/lib/news/sources";
import type { NextRequest } from "next/server";

export const revalidate = 600;

type RawItem = {
  title?: string;
  link?: string;
  contentSnippet?: string;
  content?: string;
  isoDate?: string;
};

export type SummarizedItem = {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt?: string;
  headline: string;
  topic: Topic;
  angle: Angle;
};

export type HeadlineGroup = {
  id: string;
  title: string;
  items: SummarizedItem[];
  topic: Topic;
  uniqueSources: number;
  corroborationScore: number; // 0..1
  angleBreakdown: Record<Angle, number>;
};

export type Overview = {
  title: string;
  bullets: string[];
};

export async function GET(req: NextRequest) {
  try {
    const parser = new Parser<unknown, RawItem>();
    const perSourceLimit = Number(process.env.NEWS_PER_SOURCE ?? 50);
    const totalCap = Number(process.env.NEWS_TOTAL_CAP ?? 300);
    const days = Number(process.env.NEWS_DAYS ?? 7);
    const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
    const feeds = await Promise.all(
      NEWS_SOURCES.map(async (src) => {
        try {
          const xml = await fetchWithTimeout(src.url, 8000);
          if (!xml) return [];
          const feed = await parser.parseString(xml);
          const items = (feed.items || [])
            .map((it) => ({
              source: src.name,
              title: it.title ?? "Untitled",
              url: it.link ?? src.homepage ?? "",
              contentSnippet: it.contentSnippet ?? it.content ?? "",
              publishedAt: it.isoDate,
            }))
            .filter((it) => {
              if (!it.publishedAt) return false; // ignore undated for week-range test
              const t = Date.parse(it.publishedAt);
              return !Number.isNaN(t) && t >= cutoffMs;
            })
            .slice(0, perSourceLimit);
          return items;
        } catch {
          return [];
        }
      })
    );

    const flat = feeds.flat();
    const dedupedAll = dedupeByUrl(flat);

    // sort newest first, then cap total
    const sorted = dedupedAll.sort((a, b) => {
      const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return tb - ta;
    });
    const totalItems = sorted.length;
    const deduped = sorted.slice(0, totalCap);

    // pagination
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const defaultPageSize = Number(process.env.NEWS_PAGE_SIZE ?? 60);
    const pageSize = Math.max(1, Math.min(200, Number(searchParams.get("pageSize") ?? defaultPageSize)));
    const totalPages = Math.max(1, Math.ceil(deduped.length / pageSize));
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageSlice = deduped.slice(start, end);

    const headlines = await summarizeHeadlines(pageSlice);

    const data: SummarizedItem[] = headlines.map((h) => ({
      id: `${hashString(h.url)}-${hashString(h.title)}`,
      source: h.source,
      title: h.title,
      url: h.url,
      publishedAt: h.publishedAt,
      headline: h.headline,
      topic: normalizeTopic(h.topic),
      angle: normalizeAngle(h.angle),
    }));

    const groups = await groupHeadlines(data);
    const overview = page === 1 ? await composeOverview(groups) : undefined;

    return Response.json(
      {
        overview,
        groups,
        page,
        pageSize,
        totalItems,
        totalPages,
        generatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

function dedupeByUrl<T extends { url?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const key = it.url;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "force-cache",
      next: { revalidate: revalidate },
      headers: { "user-agent": "Mozilla/5.0 (NewsAggregatorBot)" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

type Topic =
  | "World"
  | "US"
  | "Business"
  | "Markets"
  | "Technology"
  | "Science"
  | "Health"
  | "Sports"
  | "Entertainment"
  | "Politics"
  | "Climate"
  | "Other";

const TOPICS: Topic[] = [
  "World",
  "US",
  "Business",
  "Markets",
  "Technology",
  "Science",
  "Health",
  "Sports",
  "Entertainment",
  "Politics",
  "Climate",
  "Other",
];

type Angle =
  | "Breaking"
  | "Analysis"
  | "Opinion"
  | "Explainer"
  | "Investigative"
  | "Interview"
  | "Live"
  | "PressRelease"
  | "Other";

const ANGLES: Angle[] = [
  "Breaking",
  "Analysis",
  "Opinion",
  "Explainer",
  "Investigative",
  "Interview",
  "Live",
  "PressRelease",
  "Other",
];

async function summarizeHeadlines(items: Array<{ source: string; title: string; url: string; contentSnippet: string; publishedAt?: string }>) {
  const client = getOpenAIClient();

  const chunks: typeof items[] = [];
  const chunkSize = Number(process.env.NEWS_SUMMARY_CHUNK_SIZE ?? 10);
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  const results: Array<{
    source: string;
    title: string;
    url: string;
    publishedAt?: string;
    headline: string;
    topic: Topic | string;
    angle: Angle | string;
  }> = [];

  const responses = await Promise.all(
    chunks.map(async (chunk) => {
      const prompt = buildPrompt(chunk);
      const response = await client.responses.create({
        model: MODEL_SUMMARY,
        input: [
          {
            role: "system",
            content:
              "You are a news assistant. For each item, return: headline (<= 14 words, neutral), topic (one of: " +
              TOPICS.join(", ") +
              "), and angle (one of: " +
              ANGLES.join(", ") +
              "). Return a JSON array of objects with keys: source, title, url, publishedAt, headline, topic, angle. Return JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      });
      return response.output_text?.trim() ?? "";
    })
  );

  for (const text of responses) {
    const parsed = safeJsonParse(text);
    if (Array.isArray(parsed)) {
      for (const p of parsed) {
        if (p && p.url) results.push(p);
      }
    }
  }

  return results;
}

function buildPrompt(items: Array<{ source: string; title: string; url: string; contentSnippet: string; publishedAt?: string }>) {
  const snippetLimit = Number(process.env.NEWS_SNIPPET_LIMIT ?? 300);
  const list = items
    .map((it, idx) => {
      return `${idx + 1}. source=${it.source}\n   title=${it.title}\n   snippet=${truncate(it.contentSnippet, snippetLimit)}\n   url=${it.url}\n   published=${it.publishedAt ?? ""}`;
    })
    .join("\n\n");

  return `Summarize the following news items into a JSON array where each element is an object with keys: source, title, url, publishedAt, headline, topic, angle. The topic must be exactly one of: ${TOPICS.join(", ")}. The angle must be exactly one of: ${ANGLES.join(", ")}. Keep headline <= 14 words, neutral tone.

Items:
${list}

Return JSON only.`;
}

function truncate(text: string, max: number) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

function safeJsonParse(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    // try to extract JSON block
    const start = input.indexOf("[");
    const end = input.lastIndexOf("]");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(input.slice(start, end + 1));
      } catch {
        return [];
      }
    }
    return [];
  }
}

async function groupHeadlines(items: SummarizedItem[]): Promise<HeadlineGroup[]> {
  if (items.length === 0) return [];
  const client = getOpenAIClient();

  const inputs = items.map((it) => `${it.headline} — ${it.title}`);
  const { data: embeds } = await client.embeddings.create({
    model: MODEL_EMBEDDING,
    input: inputs,
  });

  const vectors: number[][] = embeds.map((e) => e.embedding as unknown as number[]);

  const threshold = Number(process.env.NEWS_SIMILARITY ?? 0.86); // similarity threshold for grouping
  const n = vectors.length;
  const adj: number[][] = Array.from({ length: n }, () => []);

  const norms = vectors.map((v) => Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = cosine(vectors[i], vectors[j], norms[i], norms[j]);
      if (sim >= threshold) {
        adj[i].push(j);
        adj[j].push(i);
      }
    }
  }

  const visited = new Array<boolean>(n).fill(false);
  const components: number[][] = [];
  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    const comp: number[] = [];
    const stack = [i];
    visited[i] = true;
    while (stack.length) {
      const u = stack.pop()!;
      comp.push(u);
      for (const v of adj[u]) {
        if (!visited[v]) {
          visited[v] = true;
          stack.push(v);
        }
      }
    }
    components.push(comp);
  }

  // Build groups from components
  const groups: HeadlineGroup[] = components.map((idxs) => {
    // pick representative: node with highest degree (or shortest headline fallback)
    let best = idxs[0];
    let bestScore = -1;
    for (const i of idxs) {
      const score = adj[i].length;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }

    const rep = items[best];
    const groupItems = idxs.map((i) => items[i]).sort((a, b) => (a.source > b.source ? 1 : -1));
    const id = hashString(groupItems.map((g) => g.id).join("-"));
    const topic = majorityTopic(groupItems);

    // triangulation metrics
    const uniqueSources = new Set(groupItems.map((g) => g.source)).size;
    const corroborationScore = Math.max(0, Math.min(1, uniqueSources / 5));
    const angleBreakdown: Record<Angle, number> = ANGLES.reduce((acc, a) => {
      acc[a] = 0;
      return acc;
    }, {} as Record<Angle, number>);
    for (const it of groupItems) {
      const a = it.angle;
      angleBreakdown[a] = (angleBreakdown[a] ?? 0) + 1;
    }

    return {
      id,
      title: rep.headline,
      items: groupItems,
      topic,
      uniqueSources,
      corroborationScore,
      angleBreakdown,
    };
  });

  return groups.sort((a, b) => b.items.length - a.items.length);
}

function cosine(a: number[], b: number[], na: number, nb: number): number {
  let dot = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  return dot / (na * nb);
}

function majorityTopic(items: SummarizedItem[]): Topic {
  const counts = new Map<Topic, number>();
  for (const it of items) {
    const t = normalizeTopic(it.topic);
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  let best: Topic = "Other";
  let bestCount = -1;
  for (const [t, c] of counts) {
    if (c > bestCount) {
      best = t;
      bestCount = c;
    }
  }
  return best;
}

function normalizeTopic(input: string | Topic | undefined): Topic {
  const candidate = (input ?? "Other").toString().trim().toLowerCase();
  const match = TOPICS.find((t) => t.toLowerCase() === candidate);
  if (match) return match;
  // map some common aliases
  if (["tech", "technology news"].includes(candidate)) return "Technology";
  if (["market", "finance"].includes(candidate)) return "Markets";
  if (["us news", "usa"].includes(candidate)) return "US";
  return "Other";
}

async function composeOverview(groups: HeadlineGroup[]): Promise<Overview> {
  const client = getOpenAIClient();
  const top = groups.slice(0, 12).map((g) => `${g.topic}: ${g.title} (sources=${g.uniqueSources})`).join("\n");
  const prompt = `You are an impartial news editor. Create a concise, 3-6 bullet summary of the overall news landscape from the following grouped headlines. Avoid speculation and avoid duplication. Focus on the most important themes and regional balance. Return JSON with { "title": string, "bullets": string[] }.

Groups:\n${top}\n\nReturn JSON only.`;

  const response = await client.responses.create({
    model: MODEL_SUMMARY,
    input: [
      {
        role: "system",
        content: "Summarize grouped headlines into 3-6 neutral, factual bullets. Return JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });

  const text = response.output_text?.trim() ?? "";
  const parsed = safeJsonParse(text);
  if (parsed && typeof parsed === "object" && Array.isArray(parsed.bullets)) {
    return { title: parsed.title ?? "Today at a glance", bullets: parsed.bullets };
  }
  // Fallback: derive a simple overview from top groups
  return {
    title: "Today at a glance",
    bullets: groups.slice(0, 5).map((g) => `${g.topic}: ${g.title}`),
  };
}

function normalizeAngle(input: string | Angle | undefined): Angle {
  const candidate = (input ?? "Other").toString().trim().toLowerCase();
  const match = ANGLES.find((t) => t.toLowerCase() === candidate);
  if (match) return match;
  if (["breaking news", "urgent"].includes(candidate)) return "Breaking";
  if (["analysis", "deep dive"].includes(candidate)) return "Analysis";
  if (["opinion", "editorial"].includes(candidate)) return "Opinion";
  if (["explainer", "guide"].includes(candidate)) return "Explainer";
  if (["investigation", "investigative"].includes(candidate)) return "Investigative";
  if (["interview", "q&a"].includes(candidate)) return "Interview";
  if (["live", "liveblog"].includes(candidate)) return "Live";
  if (["press release", "pressrelease"].includes(candidate)) return "PressRelease";
  return "Other";
}


