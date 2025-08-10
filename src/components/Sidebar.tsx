"use client";

import { useMemo } from "react";
import { Badge, Button, Card, Heading, HStack, Input, Text, VStack } from "@chakra-ui/react";

type Props = {
  query: string;
  setQuery: (v: string) => void;
  selectedTopic: string;
  setSelectedTopic: (v: string) => void;
  selectedSources: Set<string>;
  setSelectedSources: (v: Set<string>) => void;
  groups: Array<{ topic: string; items: Array<{ source: string }> }>;
  allSources: string[];
  toggleSource: (v: string) => void;
};

export default function Sidebar(props: Props) {
  const {
    query,
    setQuery,
    selectedTopic,
    setSelectedTopic,
    selectedSources,
    setSelectedSources,
    groups,
    allSources,
    toggleSource,
  } = props;

  const topics = useMemo(() => {
    const set = new Set<string>(groups.map((g) => g.topic));
    return ["All", ...Array.from(set).sort()];
  }, [groups]);

  return (
    <Card.Root variant="outline">
      <Card.Header>
        <Card.Title>Browse</Card.Title>
      </Card.Header>
      <Card.Body>
        <VStack align="stretch" gap={3}>
          <Input placeholder="Search headlines…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Heading size="xs">Topics</Heading>
          <VStack align="stretch" gap={1}>
            {topics.map((t) => (
              <Button
                key={t}
                variant={t === selectedTopic ? "solid" : "ghost"}
                justifyContent="space-between"
                onClick={() => setSelectedTopic(t)}
              >
                <Text>{t}</Text>
                {t !== "All" && <Badge>{groups.filter((g) => g.topic === t).length}</Badge>}
              </Button>
            ))}
          </VStack>
          <Heading size="xs">Sources</Heading>
          <VStack align="stretch" gap={1}>
            <HStack>
              <Button size="xs" variant="subtle" onClick={() => setSelectedSources(new Set(allSources))}>
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
                  <Text>{s}</Text>
                  <Button size="xs" variant={active ? "solid" : "outline"} onClick={() => toggleSource(s)}>
                    {active ? "On" : "Off"}
                  </Button>
                </HStack>
              );
            })}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}


