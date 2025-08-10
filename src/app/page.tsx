"use client";

import useSWR from "swr";
import HeaderBar from "@/components/HeaderBar";
import Sidebar from "@/components/Sidebar";
import GroupCard from "@/components/GroupCard";
import type { HeadlineGroup } from "@/types/news";
import { useTheme } from "next-themes";
import { Box, Container, HStack, VStack, Text, Badge, Skeleton, Grid, SimpleGrid, Button, Card } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";

// types are in src/types/news.ts

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

  // topics are computed inside Sidebar

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
      <HeaderBar
        updatedAt={data?.generatedAt}
        isMounted={isMounted}
        isValidating={isValidating}
        onRefresh={() => mutate()}
        themeLabel={theme === "dark" ? "Light" : "Dark"}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      />

      <Grid templateColumns={{ base: "1fr", xl: "320px 1fr" }} gap={8} alignItems="start">
        {/* Sidebar (independently scrollable) */}
        <Box position={{ base: "static", xl: "sticky" }} top="6" maxH={{ base: "auto", xl: "calc(100vh - 72px)" }} overflowY={{ base: "visible", xl: "auto" }} pr={{ base: 0, xl: 2 }}>
          <Sidebar
            query={query}
            setQuery={setQuery}
            selectedTopic={selectedTopic}
            setSelectedTopic={setSelectedTopic}
            selectedSources={selectedSources}
            setSelectedSources={setSelectedSources}
            groups={data?.groups ?? []}
            allSources={allSources}
            toggleSource={toggleSource}
          />
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
                  <GroupCard key={group.id} group={group} colorPalette={topicToPalette(group.topic)} />
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

function toggleSourceValue(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}


