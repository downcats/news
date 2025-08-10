"use client";

import { HStack, Heading, IconButton, Spacer, Text } from "@chakra-ui/react";

type Props = {
  updatedAt?: string;
  isMounted: boolean;
  isValidating: boolean;
  onRefresh: () => void;
  themeLabel: string;
  onToggleTheme: () => void;
};

export default function HeaderBar({ updatedAt, isMounted, isValidating, onRefresh, themeLabel, onToggleTheme }: Props) {
  return (
    <HStack mb={6}>
      <Heading size="lg">News Digest</Heading>
      <Spacer />
      <Text color="fg.muted" fontSize="sm">
        {isMounted && updatedAt ? `Updated ${new Date(updatedAt).toLocaleTimeString()}` : ""}
      </Text>
      <IconButton aria-label="Toggle theme" size="sm" variant="subtle" onClick={onToggleTheme}>
        {isMounted ? themeLabel : "Theme"}
      </IconButton>
      <IconButton aria-label="Refresh" size="sm" variant="subtle" onClick={onRefresh} disabled={isValidating}>
        {isValidating ? "Refreshing…" : "Refresh"}
      </IconButton>
    </HStack>
  );
}


