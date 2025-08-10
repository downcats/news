"use client";

import React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemesProvider>
  );
}

export default ColorModeProvider;


