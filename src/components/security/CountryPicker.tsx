import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCountriesQuery } from '@/store/api/platformApi';
import { cn } from '@/lib/utils';

/** Convert ISO 3166-1 alpha-2 code to its 🇫🇷-style emoji flag (no static images). */
export const flagEmoji = (alpha2: string): string => {
  if (!alpha2 || alpha2.length !== 2) return '🏳️';
  const A = 0x1f1e6;
  return String.fromCodePoint(A + alpha2.toUpperCase().charCodeAt(0) - 65) +
    String.fromCodePoint(A + alpha2.toUpperCase().charCodeAt(1) - 65);
};

interface CountryPickerProps {
  value?: string; // alpha_2
  onChange: (alpha2: string, name: string) => void;
  placeholder?: string;
  label?: string;
  /** Filter countries to only those served by the given payment methods. */
  paymentMethods?: { countries: { country: { alpha_2: string } }[] }[];
}

export const CountryPicker = ({ value, onChange, placeholder, label, paymentMethods }: CountryPickerProps) => {
  const { data: countries, isLoading } = useCountriesQuery();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const allowed = useMemo(() => {
    if (!paymentMethods) return null;
    const set = new Set<string>();
    paymentMethods.forEach((m) =>
      m.countries.forEach((c) => set.add(c.country.alpha_2.toUpperCase())),
    );
    return set;
  }, [paymentMethods]);

  const list = useMemo(() => {
    const base = (countries || []).map((c) => c.country);
    return base
      .filter((c) => !allowed || allowed.has(c.alpha_2.toUpperCase()))
      .filter((c) =>
        !q ? true : c.name.toLowerCase().includes(q.toLowerCase()) || c.alpha_2.toLowerCase().includes(q.toLowerCase()),
      );
  }, [countries, allowed, q]);

  const selected = (countries || []).find((c) => c.country.alpha_2 === value)?.country;

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={isLoading}
            className="w-full h-11 rounded-xl justify-between font-normal"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg leading-none">{selected ? flagEmoji(selected.alpha_2) : '🌍'}</span>
              <span className={cn(!selected && 'text-muted-foreground')}>
                {selected?.name || placeholder || 'Choisir un pays'}
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher…"
                className="pl-8 h-9"
                autoFocus
              />
            </div>
          </div>
          <ScrollArea className="max-h-72">
            <div className="p-1">
              {list.map((c) => (
                <button
                  key={c.alpha_2}
                  type="button"
                  onClick={() => {
                    onChange(c.alpha_2, c.name);
                    setOpen(false);
                    setQ('');
                  }}
                  className={cn(
                    'w-full text-left flex items-center gap-2 rounded-md px-2.5 py-2 text-sm hover:bg-muted',
                    value === c.alpha_2 && 'bg-muted',
                  )}
                >
                  <span className="text-lg leading-none">{flagEmoji(c.alpha_2)}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.alpha_2}</span>
                  {value === c.alpha_2 && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
              {list.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">Aucun pays trouvé</p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};
