"use client";

import useSWR from "swr";
import { useTheme } from "next-themes";
import {
  Box,
  Container,
  Heading,
  HStack,
  VStack,
  Text,
  Link,
  Badge,
  Skeleton,
  IconButton,
  Spacer,
  Input,
  Card,
  Collapsible,
  Separator,
  Grid,
  SimpleGrid,
  Button,
  Sticky,
  Alert,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";

type NewsItem = {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt?: string;
  headline: string;
};

type HeadlineGroup = {
  id: string;
  title: string;
  items: NewsItem[];
  topic: string;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 60;
  const { data, isLoading, mutate, isValidating, error } = useSWR<{
    overview?: { title: string; bullets: string[] };
    groups: HeadlineGroup[];
    page?: number;
    pageSize?: number;
    totalItems?: number;
    totalPages?: number;
    generatedAt?: string;
  }, Error>(`/api/news?page=${page}&pageSize=${PAGE_SIZE}`, fetcher, {
    refreshInterval: 10 * 60 * 1000,
    dedupingInterval: 60 * 1000,
    revalidateOnFocus: false,
  });

  const [query, setQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("All");
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());
  const toggleSource = (value: string) =>
    setSelectedSources((prev) => toggleSourceValue(prev, value));

  const allTopics = useMemo(() => {
    const set = new Set<string>((data?.groups ?? []).map((g) => g.topic));
    return ["All", ...Array.from(set).sort()];
  }, [data?.groups]);

  const groups = useMemo(() => {
    const list = data?.groups ?? [];
    let filtered = list;
    if (selectedTopic !== "All") filtered = filtered.filter((g) => g.topic === selectedTopic);
    if (!query) return filtered;
    const q = query.toLowerCase();
    return filtered
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) =>
            g.title.toLowerCase().includes(q) ||
            it.headline.toLowerCase().includes(q) ||
            it.title.toLowerCase().includes(q) ||
            it.source.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [data?.groups, query, selectedTopic]);

  const allSources = useMemo(() => {
    const set = new Set<string>();
    for (const g of data?.groups ?? []) {
      for (const it of g.items) set.add(it.source);
    }
    return Array.from(set).sort();
  }, [data?.groups]);

  const groupsBySource = useMemo(() => {
    if (selectedSources.size === 0) return groups;
    const filtered: HeadlineGroup[] = [];
    for (const g of groups) {
      const items = g.items.filter((it) => selectedSources.has(it.source));
      if (items.length > 0) filtered.push({ ...g, items });
    }
    return filtered;
  }, [groups, selectedSources]);

  return (
    <Container maxW="7xl" py={6}>
      <HStack mb={6}>
        <Heading size="lg">News Digest</Heading>
        <Spacer />
        <Text color="fg.muted" fontSize="sm">
          {isMounted && data?.generatedAt ? `Updated ${new Date(data.generatedAt).toLocaleTimeString()}` : ""}
        </Text>
        <IconButton
          aria-label="Toggle theme"
          size="sm"
          variant="subtle"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {isMounted ? (theme === "dark" ? "Light" : "Dark") : "Theme"}
        </IconButton>
        <IconButton
          aria-label="Refresh"
          size="sm"
          variant="subtle"
          onClick={() => mutate()}
          disabled={isValidating}
        >
          {isValidating ? "Refreshing…" : "Refresh"}
        </IconButton>
      </HStack>

      <Grid templateColumns={{ base: "1fr", xl: "320px 1fr" }} gap={8} alignItems="start">
        {/* Sidebar (independently scrollable) */}
        <Box
          position={{ base: "static", xl: "sticky" }}
          top="6"
          maxH={{ base: "auto", xl: "calc(100vh - 72px)" }}
          overflowY={{ base: "visible", xl: "auto" }}
          pr={{ base: 0, xl: 2 }}
        >
          <Card.Root variant="outline">
            <Card.Header>
              <Card.Title>Browse</Card.Title>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={3}>
                <Input
                  placeholder="Search headlines…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Separator />
                <Heading size="xs">Topics</Heading>
                <VStack align="stretch" gap={1}>
                  {allTopics.map((t) => (
                    <Button
                      key={t}
                      variant={t === selectedTopic ? "solid" : "ghost"}
                      colorPalette={t === selectedTopic ? topicToPalette(t) : undefined}
                      justifyContent="space-between"
                      onClick={() => setSelectedTopic(t)}
                    >
                      <Text>{t}</Text>
                      {t !== "All" && (
                        <Badge>{(data?.groups ?? []).filter((g) => g.topic === t).length}</Badge>
                      )}
                    </Button>
                  ))}
                </VStack>
                <Separator />
                <Heading size="xs">Sources</Heading>
                <VStack align="stretch" gap={1}>
                  <HStack>
                    <Button
                      size="xs"
                      variant="subtle"
                      onClick={() => setSelectedSources(new Set(allSources))}
                    >
                      All
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => setSelectedSources(new Set())}>
                      None
                    </Button>
                  </HStack>
                  {allSources.map((s) => {
                    const active = selectedSources.size === 0 || selectedSources.has(s);
                    return (
                      <HStack key={s} justify="space-between">
                        <HStack>
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(
                              extractDomainFromSource(s)
                            )}&sz=32`}
                            alt=""
            width={16}
            height={16}
                            style={{ borderRadius: 4 }}
                          />
                          <Text>{s}</Text>
                        </HStack>
                        <Button
                          size="xs"
                          variant={active ? "solid" : "outline"}
                          onClick={() => toggleSource(s)}
                        >
                          {active ? "On" : "Off"}
                        </Button>
                      </HStack>
                    );
                  })}
                </VStack>
              </VStack>
            </Card.Body>
          </Card.Root>
        </Box>

        {/* Main content */}
        <Box>
          {data?.overview && (
            <Card.Root mb={6} variant="subtle" size="lg">
              <Card.Header>
                <Card.Title>{data.overview.title || "Today"}</Card.Title>
              </Card.Header>
              <Card.Body>
                <VStack align="stretch" gap={2}>
                  {data.overview.bullets.map((b, i) => (
                    <HStack key={i} align="start" gap={3}>
                      <Badge colorPalette="purple">{i + 1}</Badge>
                      <Text>{b}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Card.Body>
            </Card.Root>
          )}
          {error ? (
            <Card.Root>
              <Card.Header>
                <Card.Title>Could not load news</Card.Title>
              </Card.Header>
              <Card.Body>
                <Text color="fg.muted">{error.message}</Text>
              </Card.Body>
            </Card.Root>
          ) : isLoading ? (
            <VStack align="stretch" gap={4}>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} h="28" />
              ))}
            </VStack>
          ) : (
            <VStack align="stretch" gap={6}>
              <SimpleGrid columns={{ base: 1, xl: 2 }} gap={6}>
                {groupsBySource.map((group) => (
                  <Card.Root
                    key={group.id}
                    variant="elevated"
                    size="lg"
                    colorPalette={topicToPalette(group.topic)}
                  >
                    <Card.Header>
                      <VStack align="stretch" gap={2}>
                        <HStack>
                          <Badge>{group.topic}</Badge>
                          <Spacer />
                          <Badge>{group.items.length}</Badge>
                        </HStack>
                        <Alert.Root status="info" variant="subtle">
                          <Alert.Indicator />
                          <Alert.Content>
                            <Alert.Title fontSize="sm">AI headline</Alert.Title>
                            <Alert.Description fontSize="md" lineHeight="1.6">
                              {group.title}
                            </Alert.Description>
                          </Alert.Content>
                        </Alert.Root>
                      </VStack>
                    </Card.Header>
                    <Card.Body>
                      <VStack align="stretch" gap={4}>
                        {group.items.slice(0, 2).map((item, idx) => (
                          <Box key={item.id}>
                            <VStack align="stretch" gap={1}>
                              <Link
                                href={item.url}
          target="_blank"
          rel="noopener noreferrer"
                                fontSize="md"
                                fontWeight="semibold"
                                lineHeight="1.6"
                              >
                                {item.title}
                              </Link>
                              <HStack gap={2}>
                                <Badge colorPalette="blue">{item.source}</Badge>
                                <Text color="fg.muted" fontSize="xs">
                                  {extractDomain(item.url)}
                                </Text>
                                <Spacer />
                                <IconButton asChild aria-label="Open" size="xs" variant="subtle">
                                  <Link href={item.url} target="_blank" rel="noopener noreferrer">
                                    Read
                                  </Link>
                                </IconButton>
                              </HStack>
                            </VStack>
                            {idx < Math.min(2, group.items.length) - 1 && <Separator my={3} />}
                          </Box>
                        ))}
                      </VStack>
                      {group.items.length > 2 && (
                        <Collapsible.Root>
                          <Collapsible.Trigger asChild>
                            <Button mt={4} size="sm" variant="subtle" width="full">
                              Show {group.items.length - 2} more
                            </Button>
                          </Collapsible.Trigger>
                          <Collapsible.Content>
                            <VStack align="stretch" gap={3} mt={3}>
                              {group.items.slice(2).map((item, idx) => (
                                <Box key={item.id}>
                                  <VStack align="stretch" gap={1}>
                                    <Link
                                      href={item.url}
          target="_blank"
          rel="noopener noreferrer"
                                      fontSize="md"
                                      fontWeight="semibold"
                                      lineHeight="1.6"
                                    >
                                      {item.title}
                                    </Link>
                                    <HStack gap={2}>
                                      <Badge colorPalette="blue">{item.source}</Badge>
                                      <Text color="fg.muted" fontSize="xs">
                                        {extractDomain(item.url)}
                                      </Text>
                                      <Spacer />
                                      <IconButton asChild aria-label="Open" size="xs" variant="subtle">
                                        <Link href={item.url} target="_blank" rel="noopener noreferrer">
                                          Read
                                        </Link>
                                      </IconButton>
                                    </HStack>
                                  </VStack>
                                  {idx < group.items.slice(2).length - 1 && <Separator my={3} />}
                                </Box>
                              ))}
                            </VStack>
                          </Collapsible.Content>
                        </Collapsible.Root>
                      )}
                    </Card.Body>
                  </Card.Root>
                ))}
              </SimpleGrid>
              <HStack mt={8} justify="center" gap={4}>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Text color="fg.muted" fontSize="sm">
                  Page {page} {data?.totalPages ? `of ${data.totalPages}` : ""}
                </Text>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => (data?.totalPages ? Math.min(data.totalPages, p + 1) : p + 1))}
                  disabled={data?.totalPages ? page >= data.totalPages : false}
                >
                  Next
                </Button>
              </HStack>
            </VStack>
          )}
        </Box>
      </Grid>
    </Container>
  );
}

function topicToPalette(topic: string):
  | "gray"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "cyan"
  | "purple"
  | "pink" {
  const t = topic.toLowerCase();
  if (t === "world") return "cyan";
  if (t === "us") return "blue";
  if (t === "business") return "teal";
  if (t === "markets") return "yellow";
  if (t === "technology") return "purple";
  if (t === "science") return "green";
  if (t === "health") return "pink";
  if (t === "sports") return "orange";
  if (t === "entertainment") return "red";
  if (t === "politics") return "cyan";
  if (t === "climate") return "green";
  return "gray";
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function extractDomainFromSource(source: string): string {
  // best-effort mapping; for favicon service any domain works
  // use source as-is if it looks like a domain
  if (/^[\w.-]+\.[A-Za-z]{2,}$/.test(source)) return source;
  // map some known sources
  const map: Record<string, string> = {
    "BBC World": "bbc.com",
    "Reuters Top News": "reuters.com",
    "The Verge": "theverge.com",
    "Hacker News": "news.ycombinator.com",
  };
  return map[source] ?? source;
}

function toggleSourceValue(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function toggleSource(value: string) {
  // placeholder; replaced at runtime by closure below
}


