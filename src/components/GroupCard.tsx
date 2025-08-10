"use client";

import { Alert, Badge, Button, Card, Collapsible, HStack, IconButton, Link, Separator, Spacer, Text, VStack } from "@chakra-ui/react";
import { extractDomain } from "@/lib/url";
import type { HeadlineGroup } from "@/types/news";

type Props = {
  group: HeadlineGroup;
  colorPalette?:
    | "gray"
    | "red"
    | "orange"
    | "yellow"
    | "green"
    | "teal"
    | "blue"
    | "cyan"
    | "purple"
    | "pink";
};

export default function GroupCard({ group, colorPalette }: Props) {
  return (
    <Card.Root variant="elevated" size="lg" colorPalette={colorPalette}>
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
            <VStack key={item.id} align="stretch" gap={1}>
              <Link href={item.url} target="_blank" rel="noopener noreferrer" fontSize="md" fontWeight="semibold" lineHeight="1.6">
                {item.title}
              </Link>
              <HStack gap={2}>
                <Badge colorPalette="blue">{item.source}</Badge>
                <Text color="fg.muted" fontSize="xs">{extractDomain(item.url)}</Text>
                <Spacer />
                <IconButton asChild aria-label="Open" size="xs" variant="subtle">
                  <Link href={item.url} target="_blank" rel="noopener noreferrer">Read</Link>
                </IconButton>
              </HStack>
              {idx < Math.min(2, group.items.length) - 1 && <Separator my={3} />}
            </VStack>
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
                  <VStack key={item.id} align="stretch" gap={1}>
                    <Link href={item.url} target="_blank" rel="noopener noreferrer" fontSize="md" fontWeight="semibold" lineHeight="1.6">
                      {item.title}
                    </Link>
                    <HStack gap={2}>
                      <Badge colorPalette="blue">{item.source}</Badge>
                      <Text color="fg.muted" fontSize="xs">{extractDomain(item.url)}</Text>
                      <Spacer />
                      <IconButton asChild aria-label="Open" size="xs" variant="subtle">
                        <Link href={item.url} target="_blank" rel="noopener noreferrer">Read</Link>
                      </IconButton>
                    </HStack>
                    {idx < group.items.slice(2).length - 1 && <Separator my={3} />}
                  </VStack>
                ))}
              </VStack>
            </Collapsible.Content>
          </Collapsible.Root>
        )}
      </Card.Body>
    </Card.Root>
  );
}


