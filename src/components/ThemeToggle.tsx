import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const ThemeToggle = () => {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-full border border-transparent bg-card/60 hover:border-border hover:bg-accent/70"
    >
      {theme === 'light' ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
    </Button>
  );
};
