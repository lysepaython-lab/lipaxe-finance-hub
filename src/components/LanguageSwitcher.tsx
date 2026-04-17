import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLanguage } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const current = useAppSelector(s => s.ui.language);

  const change = (lang: 'en' | 'fr') => {
    i18n.changeLanguage(lang);
    dispatch(setLanguage(lang));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 rounded-full">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase">{current}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => change('en')}>🇺🇸 English</DropdownMenuItem>
        <DropdownMenuItem onClick={() => change('fr')}>🇫🇷 Français</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
