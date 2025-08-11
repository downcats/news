<div align="center">
  <h1>🗞️ newsboy • AI‑powered daily brief</h1>
  <p>Next.js + Chakra UI v3 • OpenAI 4o‑mini summarization • Embedding‑based clustering • Topic & source filtering • Weekly window • Pagination</p>
  <p>
    <a href="https://nextjs.org">Next.js</a> ·
    <a href="https://chakra-ui.com">Chakra UI v3</a> ·
    <a href="https://platform.openai.com">OpenAI</a>
  </p>
</div>

---

## ✨ What this app does

- Generates ultra‑short, neutral headlines from multiple sources using OpenAI `gpt-4o-mini`
- Clusters related stories with embeddings (`text-embedding-3-small`) to avoid duplicates
- Classifies topics (World, US, Business, Technology, etc.) and groups items
- Lets you filter by topic and source, and search within the results
- Shows an AI “Today at a glance” overview (page 1) with 3–6 bullet highlights
- Supports a 7‑day window, pagination, and 10‑minute server caching for performance

## 🧱 Tech stack

- Framework: Next.js App Router (TypeScript)
- UI: Chakra UI v3 (Provider, cards, alert, grid, native select, etc.)
- Data: RSS feeds via `rss-parser` with fetch timeouts and response caching
- AI: OpenAI Responses + Embeddings API (configurable models)

## 🚀 Quick start

1) Install deps

```bash
npm i
```

2) Create `.env.local`

```bash
OPENAI_API_KEY=sk-...
# Optional model/behavior overrides
OPENAI_SUMMARY_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Fetch & grouping knobs
NEWS_DAYS=7
NEWS_PER_SOURCE=50
NEWS_TOTAL_CAP=300
NEWS_PAGE_SIZE=60
NEWS_SNIPPET_LIMIT=300
NEWS_SUMMARY_CHUNK_SIZE=10
NEWS_SIMILARITY=0.86
```

3) Run dev server

```bash
npm run dev
```

Open `http://localhost:3000`.

## 🧭 Key features in the UI

- Independent, sticky sidebar with:
  - Search box
  - Topic filter with counts
  - Source toggles (All/None)
- Main content:
  - AI headline per group in a labeled info banner
  - Original site headlines listed beneath, grouped by similarity
  - Pagination controls (Previous/Next)
  - Refresh action, last‑updated time, light/dark toggle

## 🔌 API shape

`GET /api/news?page=1&pageSize=60`

Response

```json
{
  "overview": { "title": "Today at a glance", "bullets": ["..."] },
  "groups": [
    {
      "id": "...",
      "title": "AI generated headline",
      "topic": "Technology",
      "items": [
        { "source": "...", "title": "Original headline", "url": "..." }
      ]
    }
  ],
  "page": 1,
  "pageSize": 60,
  "totalItems": 123,
  "totalPages": 3,
  "generatedAt": "2025-01-01T12:34:56.000Z"
}
```

## ⚙️ Configuration notes

- Caching: route‑level revalidate set to 600 seconds (10 min)
- Weekly window: `NEWS_DAYS` filters out older items server‑side
- Summarization is batched (chunk size configurable) and runs in parallel
- Overview is only generated for page 1 to save tokens

## 💡 Cost and performance tips

- Reduce `NEWS_SNIPPET_LIMIT` to trim tokens if volume rises
- Lower `NEWS_PER_SOURCE`/`NEWS_TOTAL_CAP` or increase `NEWS_PAGE_SIZE` for paging behavior
- Swap to a cheaper summary model via `OPENAI_SUMMARY_MODEL` if needed

## 📁 Project layout

- `src/app/api/news/route.ts` — fetch + summarize + cluster + paginate + overview
- `src/app/page.tsx` — Chakra UI layout and interactions
- `src/components/ui/provider.tsx` — Chakra provider
- `src/lib/openai.ts` — OpenAI client + model constants
- `src/lib/news/sources.ts` — RSS sources list

## 📝 License

MIT — use freely and responsibly. Be mindful of each source’s terms and robots.

---

Made with ❤️ using Next.js and Chakra UI.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
