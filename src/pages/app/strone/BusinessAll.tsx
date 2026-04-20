import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Users, Calendar, Crown, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useTontinesQuery, useCreateTontineMutation, useContributeTontineMutation,
} from '@/store/api/businessApi';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { formatMoney, relativeTime } from '@/lib/format';
import { toast } from 'sonner';

const BusinessAll = () => {
  const { t } = useTranslation();
  const { data: tontines, isLoading } = useTontinesQuery();
  const [createTontine, { isLoading: creating }] = useCreateTontineMutation();
  const [contribute] = useContributeTontineMutation();
  const pin = usePinGate();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [contribution, setContribution] = useState('50');
  const [currency, setCurrency] = useState('USD');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [duration, setDuration] = useState('6');
  const [selection, setSelection] = useState<'random' | 'ordered'>('ordered');
  const [members, setMembers] = useState('@alex, @marie.d, @john.k');

  const [contribOpen, setContribOpen] = useState(false);
  const [contribTontineId, setContribTontineId] = useState<string | null>(null);
  const [contribWallet, setContribWallet] = useState<string>();
  const [contribAmount, setContribAmount] = useState('50');

  const submitCreate = async () => {
    if (!name) { toast.error('Nom requis'); return; }
    try {
      await createTontine({
        name, contribution: Number(contribution), currency,
        frequency, duration_months: Number(duration), selection,
        members: members.split(',').map((m) => m.trim()).filter(Boolean),
      }).unwrap();
      toast.success('Tontine créée');
      setOpen(false);
    } catch (e) {
      toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
    }
  };

  const submitContribute = () => {
    if (!contribTontineId || !contribWallet) { toast.error('Champs requis'); return; }
    pin.guard(async () => {
      try {
        await contribute({ tontine_id: contribTontineId, wallet_id: contribWallet, amount: Number(contribAmount) }).unwrap();
        toast.success('Contribution enregistrée');
        setContribOpen(false);
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  return (
    <div>
      <PageHeader
        title={t('nav.businessAll')}
        subtitle={t('strone.businessSubtitle')}
        icon={<Briefcase className="h-6 w-6" />}
        actions={<Button onClick={() => setOpen(true)} className="bg-gradient-brand shadow-brand"><Plus className="mr-2 h-4 w-4" />Nouvelle tontine</Button>}
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(tontines || []).map((tn, i) => (
            <motion.div key={tn.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/60">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold">{tn.name}</h3>
                      <div className="text-xs text-muted-foreground capitalize">
                        {tn.frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuel'} · {tn.duration_months} mois · {tn.selection === 'ordered' ? 'Ordonné' : 'Aléatoire'}
                      </div>
                    </div>
                    <Badge variant={tn.status === 'active' ? 'default' : 'secondary'}>{tn.status}</Badge>
                  </div>
                  <div className="rounded-xl bg-muted/40 p-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Contribution</div>
                      <div className="font-display font-bold tabular">{formatMoney(tn.contribution, tn.currency)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground"><Users className="inline h-3 w-3 mr-1" />Membres</div>
                      <div className="font-semibold">{tn.members.length}</div>
                    </div>
                    {tn.next_beneficiary && (
                      <div className="col-span-2 border-t border-border pt-2">
                        <div className="text-xs text-muted-foreground"><Crown className="inline h-3 w-3 mr-1 text-warning" />Prochain bénéficiaire</div>
                        <div className="font-semibold">{tn.next_beneficiary} · {tn.next_payout_at && relativeTime(tn.next_payout_at)}</div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    {tn.members.slice(0, 4).map((m) => (
                      <div key={m.user} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">#{m.position} {m.user}</span>
                        {m.received && <Badge variant="outline" className="h-4 text-[10px]">Reçu</Badge>}
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => { setContribTontineId(tn.id); setContribAmount(String(tn.contribution)); setContribOpen(true); }} className="w-full bg-gradient-brand shadow-brand">
                    Contribuer
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {(tontines || []).length === 0 && (
            <Card className="md:col-span-2 p-12 text-center">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-display text-xl font-bold mb-2">Aucune tontine</h3>
              <p className="text-muted-foreground mb-4">Créez votre première tontine pour commencer.</p>
              <Button onClick={() => setOpen(true)} className="bg-gradient-brand shadow-brand"><Plus className="mr-2 h-4 w-4" />Créer une tontine</Button>
            </Card>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouvelle tontine</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2"><Label>Nom</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Contribution</Label><Input type="number" value={contribution} onChange={(e) => setContribution(e.target.value)} /></div>
              <div className="space-y-2">
                <Label>Devise</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="BIF">BIF</SelectItem><SelectItem value="CDF">CDF</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fréquence</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as 'weekly' | 'monthly')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="weekly">Hebdomadaire</SelectItem><SelectItem value="monthly">Mensuel</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Durée (mois)</Label><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
            </div>
            <div className="space-y-2">
              <Label>Sélection</Label>
              <Select value={selection} onValueChange={(v) => setSelection(v as 'random' | 'ordered')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ordered">Ordonné</SelectItem><SelectItem value="random">Aléatoire</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Membres (séparés par virgules)</Label><Input value={members} onChange={(e) => setMembers(e.target.value)} placeholder="@alex, @marie" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={submitCreate} disabled={creating} className="bg-gradient-brand shadow-brand">
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contribOpen} onOpenChange={setContribOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Contribuer</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <WalletSelector label="Portefeuille" value={contribWallet} onChange={(id) => setContribWallet(id)} />
            <div className="space-y-2"><Label>Montant</Label><Input type="number" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContribOpen(false)}>Annuler</Button>
            <Button onClick={submitContribute} className="bg-gradient-brand shadow-brand">Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default BusinessAll;
