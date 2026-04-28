import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLanguage } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const dispatch = useAppDispatch();
  const current = useAppSelector((s) => s.ui.language);

  const change = (lang: 'en' | 'fr') => {
    i18n.changeLanguage(lang);
    dispatch(setLanguage(lang));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 rounded-full border border-transparent bg-card/60 hover:border-border hover:bg-accent/70">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase">{current}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => change('en')}>{t('common.english')}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => change('fr')}>{t('common.french')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
