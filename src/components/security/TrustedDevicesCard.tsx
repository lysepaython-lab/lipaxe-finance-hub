import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Smartphone, Monitor, Tablet, Trash2, ShieldCheck, ShieldAlert, Loader2, MapPin } from 'lucide-react';
import { useDevicesQuery, useRevokeDeviceMutation, useTrustDeviceMutation } from '@/store/api/securityApi';
import { getDeviceId } from '@/lib/deviceFingerprint';
import { relativeTime } from '@/lib/format';
import { toast } from 'sonner';

const iconFor = (label: string) => {
  if (/iPhone|Android|Mobile/i.test(label)) return Smartphone;
  if (/iPad|Tablet/i.test(label)) return Tablet;
  return Monitor;
};

export const TrustedDevicesCard = () => {
  const { data: devices = [], isLoading, refetch } = useDevicesQuery();
  const [revoke] = useRevokeDeviceMutation();
  const [trust] = useTrustDeviceMutation();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => { getDeviceId().then(setCurrentId); }, []);

  return (
    <Card className="shadow-elegant border-border/60">
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Appareils de confiance
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Sessions actives sur tous vos appareils. Révoquez celles que vous ne reconnaissez pas immédiatement.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>Actualiser</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
        {!isLoading && devices.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">Aucun appareil enregistré.</p>
        )}
        <AnimatePresence>
          {devices.map((d) => {
            const Icon = iconFor(d.label);
            const isCurrent = d.current || d.device_id === currentId;
            return (
              <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 transition-smooth hover:border-primary/40"
              >
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${isCurrent ? 'bg-gradient-brand text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-semibold truncate">{d.label}</div>
                    {isCurrent && <Badge variant="default" className="text-[10px] py-0">Actuel</Badge>}
                    {d.trusted && <Badge variant="secondary" className="text-[10px] py-0">De confiance</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{d.ip}</span>
                    <span>·</span>
                    <span>{relativeTime(d.last_seen)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Switch
                      checked={d.trusted}
                      onCheckedChange={async (v) => {
                        setBusyId(d.id);
                        try { await trust({ id: d.id, trusted: v }).unwrap(); toast.success(v ? 'Marqué de confiance' : 'Confiance retirée'); }
                        catch { toast.error('Erreur'); } finally { setBusyId(null); }
                      }}
                      disabled={busyId === d.id || isCurrent}
                    />
                  </div>
                  {!isCurrent && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" /> Révoquer cet appareil ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette session sera déconnectée immédiatement. L'utilisateur de cet appareil devra se reconnecter avec mot de passe + 2FA.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={async () => {
                              setBusyId(d.id);
                              try { await revoke({ id: d.id }).unwrap(); toast.success('Appareil révoqué'); }
                              catch { toast.error('Erreur'); } finally { setBusyId(null); }
                            }}
                          >
                            Révoquer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
