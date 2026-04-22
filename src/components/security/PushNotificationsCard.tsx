import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import {
  isPushSupported, getPermission, subscribeToPush, unsubscribeFromPush, showLocalNotification,
} from '@/lib/pushNotifications';
import { getDeviceId, getDeviceLabel } from '@/lib/deviceFingerprint';
import { useVapidKeyQuery, usePushSubscribeMutation, usePushUnsubscribeMutation } from '@/store/api/securityApi';
import { toast } from 'sonner';

export const PushNotificationsCard = () => {
  const supported = isPushSupported();
  const { data: vapid } = useVapidKeyQuery(undefined, { skip: !supported });
  const [subscribe] = usePushSubscribeMutation();
  const [unsubscribe] = usePushUnsubscribeMutation();
  const [perm, setPerm] = useState<NotificationPermission>('default');
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [endpoint, setEndpoint] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;
    getPermission().then(setPerm);
    navigator.serviceWorker.getRegistration().then(async (r) => {
      const sub = await r?.pushManager.getSubscription();
      if (sub) { setEnabled(true); setEndpoint(sub.endpoint); }
    });
  }, [supported]);

  const enable = async () => {
    setBusy(true);
    try {
      const sub = await subscribeToPush(vapid?.public_key);
      if (!sub) { toast.error('Permission refusée'); return; }
      const device_id = await getDeviceId();
      await subscribe({
        subscription: sub.toJSON() as PushSubscriptionJSON,
        device_id, label: getDeviceLabel(),
      }).unwrap().catch(() => {});
      setEnabled(true);
      setEndpoint(sub.endpoint);
      setPerm('granted');
      toast.success('Notifications push activées');
      showLocalNotification('Lipaxe', 'Vous recevrez les alertes importantes ici.', { tag: 'welcome' });
    } catch (e: any) {
      toast.error(e?.message || 'Impossible d\'activer');
    } finally { setBusy(false); }
  };

  const disable = async () => {
    setBusy(true);
    try {
      if (endpoint) await unsubscribe({ endpoint }).unwrap().catch(() => {});
      await unsubscribeFromPush();
      setEnabled(false); setEndpoint(null);
      toast.success('Notifications désactivées');
    } finally { setBusy(false); }
  };

  if (!supported) {
    return (
      <Card className="shadow-elegant border-border/60">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><BellOff className="h-5 w-5 text-muted-foreground" />Notifications push</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Votre navigateur ne supporte pas les notifications push. Ajoutez Lipaxe à votre écran d'accueil pour les activer.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-elegant border-border/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-brand ${enabled ? 'bg-gradient-brand text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {enabled ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          </div>
          <div>
            <CardTitle className="font-display">Notifications push</CardTitle>
            <p className="text-sm text-muted-foreground">Recevez les alertes Lipaxe directement sur cet appareil — même quand l'onglet est fermé.</p>
          </div>
        </div>
        <Badge variant={enabled ? 'default' : 'secondary'}>{enabled ? 'Actives' : 'Inactives'}</Badge>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-3">
        {enabled ? (
          <>
            <Button variant="outline" onClick={() => showLocalNotification('Lipaxe', 'Notification de test 🔔', { tag: 'test' })}>
              Envoyer un test
            </Button>
            <Button variant="destructive" onClick={disable} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Désactiver
            </Button>
          </>
        ) : (
          <Button onClick={enable} disabled={busy || perm === 'denied'} className="bg-gradient-brand shadow-brand">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Bell className="mr-2 h-4 w-4" />
            {perm === 'denied' ? 'Permission bloquée — autorisez dans le navigateur' : 'Activer les notifications'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
