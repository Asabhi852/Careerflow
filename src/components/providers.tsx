"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";
import { useEffect, useState } from "react";
import { I18nProvider } from '../i18n/I18nProvider';

export function Providers({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Ensure i18n context exists even before theme hydration to prevent hook errors
    return <I18nProvider>{children}</I18nProvider>;
  }

  return (
    <NextThemesProvider {...props} attribute="class" defaultTheme="system" enableSystem>
      <I18nProvider>
        {children}
      </I18nProvider>
    </NextThemesProvider>
  );
}
