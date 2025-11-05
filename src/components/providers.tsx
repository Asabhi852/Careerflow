"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";
import { I18nProvider } from '../i18n/I18nProvider';

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      {...props} 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider>
        {children}
      </I18nProvider>
    </NextThemesProvider>
  );
}
