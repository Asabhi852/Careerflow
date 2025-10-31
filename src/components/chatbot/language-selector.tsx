'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages, Check } from 'lucide-react';
import { useI18n, LANGUAGE_NAMES } from '@/i18n/I18nProvider';
import { cn } from '@/lib/utils';

export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n();

  const languages: Array<'en' | 'hi' | 'te' | 'ta' | 'kn'> = ['en', 'hi', 'kn', 'ta', 'te'];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-white hover:bg-white/20"
          title={t('chatbot_select_language', 'Select Language')}
        >
          <Languages className="h-4 w-4" />
          <span className="sr-only">{t('chatbot_select_language', 'Select Language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('chatbot_select_language', 'Select Language')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={cn(
              'cursor-pointer flex items-center justify-between',
              language === lang && 'bg-accent'
            )}
          >
            <span className="font-medium">{LANGUAGE_NAMES[lang]}</span>
            {language === lang && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
