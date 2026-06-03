import { Wrench, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const MaintenanceOverlay = () => {
  const maintenance = useAppSelector((state) => state.system.maintenance);
  if (!maintenance.active) return null;

  const minutes = maintenance.retryAfter ? Math.max(1, Math.ceil(maintenance.retryAfter / 60)) : null;

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-[#02110f]/88 px-4 backdrop-blur-xl">
      <Card className="w-full max-w-lg overflow-hidden border-emerald-300/20 bg-white text-slate-950 shadow-2xl dark:bg-[#071412] dark:text-white">
        <div className="h-1.5 bg-gradient-to-r from-[#01594B] via-emerald-400 to-[#01594B]" />
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#01594B]/12 text-[#01594B]">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#01594B]">Lipaxe maintenance</p>
              <h1 className="text-2xl font-bold tracking-tight">Service momentanement indisponible</h1>
            </div>
          </div>

          <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
            {maintenance.message || 'Nous faisons une mise a jour securisee. Les paiements deja envoyes restent suivis par le backend.'}
          </p>

          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/8 p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-[#01594B]">
              <ShieldCheck className="h-4 w-4" />
              Fonds proteges
            </div>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Les callbacks providers restent actifs pour eviter les transactions bloquees.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              {minutes ? `Nouvel essai conseille dans ${minutes} min` : 'Actualisez lorsque la maintenance est terminee'}
              {maintenance.version ? ` · v${maintenance.version}` : ''}
            </div>
            <Button className="bg-[#01594B] hover:bg-[#014438]" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
              Reessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
