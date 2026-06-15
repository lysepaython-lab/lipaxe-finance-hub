import { useState } from 'react';
import { motion } from 'framer-motion';
import { BellRing, Briefcase, Plus, Users, Crown, Loader2, X, Check, UserPlus, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useTontinesQuery, useCreateTontineMutation, useUpdateTontineMutation, useContributeTontineMutation, useInviteTontineMembersMutation, useLazyTontineEligibilityQuery, useRemindTontineMembersMutation, useRespondTontineInvitationMutation,
} from '@/store/api/businessApi';
import { WalletSelector } from '@/components/security/WalletSelector';
import { PinModal, usePinGate } from '@/components/security/PinModal';
import { formatMoney, relativeTime } from '@/lib/format';
import { toast } from 'sonner';

const selectionLabel: Record<'random' | 'ordered' | 'credit_score', string> = {
  random: 'Aléatoire',
  ordered: 'Ordonné',
  credit_score: 'Score crédit',
};

const tontineSteps = [
  { title: '1. Creer le groupe', text: 'Nom, devise, contribution, frequence et regles.' },
  { title: '2. Inviter les membres', text: 'Email ou numero de compte Lipaxe, puis acceptation.' },
  { title: '3. Contribuer', text: 'Chaque membre paie avec PIN depuis son wallet.' },
  { title: '4. Distribuer', text: 'Le beneficiaire recoit selon l ordre ou le score.' },
];

const BusinessAll = () => {
  const { t } = useTranslation();
  const { data: tontines, isLoading } = useTontinesQuery();
  const [createTontine, { isLoading: creating }] = useCreateTontineMutation();
  const [updateTontine, { isLoading: updating }] = useUpdateTontineMutation();
  const [contribute] = useContributeTontineMutation();
  const [respondInvitation, { isLoading: respondingInvitation }] = useRespondTontineInvitationMutation();
  const [inviteMembers, { isLoading: invitingMembers }] = useInviteTontineMembersMutation();
  const [remindMembers, { isLoading: remindingMembers }] = useRemindTontineMembersMutation();
  const pin = usePinGate();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [contribution, setContribution] = useState('50');
  const [currency, setCurrency] = useState('USD');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [duration, setDuration] = useState('6');
  const [selection, setSelection] = useState<'random' | 'ordered' | 'credit_score'>('ordered');
  const [members, setMembers] = useState('');
  const [maxMembers, setMaxMembers] = useState('12');
  const [minCreditScore, setMinCreditScore] = useState('600');
  const [inviteOnly, setInviteOnly] = useState(true);
  const [payoutCommission, setPayoutCommission] = useState('1.50');
  const [reservePercent, setReservePercent] = useState('0.00');
  const [escrowWalletId, setEscrowWalletId] = useState<string>();
  const [treasuryWalletId, setTreasuryWalletId] = useState<string>();

  const [contribOpen, setContribOpen] = useState(false);
  const [contribTontineId, setContribTontineId] = useState<string | null>(null);
  const [contribWallet, setContribWallet] = useState<string>();
  const [contribAmount, setContribAmount] = useState('50');
  const [loadEligibility] = useLazyTontineEligibilityQuery();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteTontineId, setInviteTontineId] = useState<string | null>(null);
  const [inviteText, setInviteText] = useState('');

  const parseMembers = (value: string) => value.split(/[\n,;]+/).map((m) => m.trim()).filter(Boolean);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setContribution('50');
    setCurrency('USD');
    setFrequency('monthly');
    setDuration('6');
    setSelection('ordered');
    setMembers('');
    setMaxMembers('12');
    setMinCreditScore('600');
    setInviteOnly(true);
    setPayoutCommission('1.50');
    setReservePercent('0.00');
    setEscrowWalletId(undefined);
    setTreasuryWalletId(undefined);
  };

  const openCreateDialog = () => {
    resetForm();
    setOpen(true);
  };

  const openEditDialog = (tn: NonNullable<typeof tontines>[number]) => {
    setEditingId(tn.id);
    setName(tn.name);
    setContribution(String(tn.contribution));
    setCurrency(tn.currency);
    setFrequency(tn.frequency);
    setDuration(String(tn.duration_months));
    setSelection(tn.selection);
    setMembers('');
    setMaxMembers(String(tn.max_members || Math.max(tn.members.length, 12)));
    setMinCreditScore(String(tn.min_credit_score ?? 600));
    setInviteOnly(Boolean(tn.invite_only ?? true));
    setPayoutCommission(String(tn.payout_commission_percent ?? '1.50'));
    setReservePercent(String(tn.reserve_percent ?? '0.00'));
    setEscrowWalletId(tn.escrow_wallet_id || tn.escrow_wallet);
    setTreasuryWalletId(tn.treasury_wallet_id || tn.treasury_wallet);
    setOpen(true);
  };

  const submitCreate = async () => {
    if (!name) { toast.error('Nom requis'); return; }
    const invitedMembers = parseMembers(members);
    if (!editingId && invitedMembers.length < 3) {
      toast.error('Ajoutez au moins 3 membres par email ou numero de compte');
      return;
    }
    if (editingId) {
      try {
        await updateTontine({
          tontine_id: editingId,
          name,
          contribution: Number(contribution),
          currency,
          frequency,
          duration_months: Number(duration),
          selection,
          max_members: Number(maxMembers),
          min_credit_score: Number(minCreditScore),
          require_kyc_verified: true,
          invite_only: inviteOnly,
          payout_commission_percent: Number(payoutCommission),
          reserve_percent: Number(reservePercent),
          escrow_wallet_id: escrowWalletId,
          treasury_wallet_id: treasuryWalletId,
          policy: {
            invite_only: inviteOnly,
            min_credit_score: Number(minCreditScore),
            payout_commission_percent: payoutCommission,
            reserve_percent: reservePercent,
            contract_version: 'v1',
          },
        }).unwrap();
        toast.success('Tontine mise a jour');
        setOpen(false);
        resetForm();
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
      return;
    }
    try {
      await createTontine({
        name, contribution: Number(contribution), currency,
        frequency, duration_months: Number(duration), selection,
        members: invitedMembers,
        max_members: Number(maxMembers),
        min_credit_score: Number(minCreditScore),
        require_kyc_verified: true,
        invite_only: inviteOnly,
        payout_commission_percent: Number(payoutCommission),
        reserve_percent: Number(reservePercent),
        escrow_wallet_id: escrowWalletId,
        treasury_wallet_id: treasuryWalletId,
        policy: {
          invite_only: inviteOnly,
          min_credit_score: Number(minCreditScore),
          payout_commission_percent: payoutCommission,
          reserve_percent: reservePercent,
          contract_version: 'v1',
        },
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
        const currentEligibility = await loadEligibility(contribTontineId).unwrap();
        if (currentEligibility && !currentEligibility.eligible) {
          toast.error(currentEligibility.reasons?.[0] || 'Non éligible pour rejoindre cette tontine');
          return;
        }
        await contribute({ tontine_id: contribTontineId, wallet_id: contribWallet, amount: Number(contribAmount) }).unwrap();
        toast.success('Contribution enregistrée');
        setContribOpen(false);
      } catch (e) {
        toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
      }
    });
  };

  const submitInviteMembers = async () => {
    if (!inviteTontineId) return;
    const invitedMembers = parseMembers(inviteText);
    if (!invitedMembers.length) {
      toast.error('Ajoutez au moins un email ou numero de compte');
      return;
    }
    try {
      const result = await inviteMembers({ tontine_id: inviteTontineId, members: invitedMembers }).unwrap();
      toast.success(`${result.added.length} invitation(s) envoyee(s)`);
      setInviteText('');
      setInviteOpen(false);
    } catch (e) {
      toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
    }
  };

  const submitReminder = async (tontineId: string) => {
    try {
      const result = await remindMembers({ tontine_id: tontineId }).unwrap();
      toast.success(`${result.notified.length} rappel(s) envoye(s)`);
    } catch (e) {
      toast.error((e as { data?: { detail?: string } })?.data?.detail || t('common.error'));
    }
  };

  const handleInvitationDecision = (tontineId: string, action: 'accept' | 'reject') => {
    pin.guard(async () => {
      try {
        await respondInvitation({ tontine_id: tontineId, action }).unwrap();
        toast.success(action === 'accept' ? 'Invitation acceptée' : 'Invitation refusée');
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
        actions={<Button onClick={openCreateDialog} className="bg-gradient-brand shadow-brand"><Plus className="mr-2 h-4 w-4" />Nouvelle tontine</Button>}
      />

      <section className="mb-6 overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-primary/10 via-background to-emerald-400/10 p-4 shadow-elegant sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-3">
            <Badge className="rounded-full bg-primary/12 text-primary hover:bg-primary/12">Tontine guidee</Badge>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Montez un groupe, collectez, puis distribuez sans chaos.</h2>
            <p className="max-w-xl text-sm text-muted-foreground">
              Invitations, wallets, PIN, eligibilite KYC et rappels automatiques gardent le groupe clair.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {tontineSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm"
              >
                <svg viewBox="0 0 120 54" className="mb-3 h-12 w-full text-primary" fill="none" aria-hidden="true">
                  <circle cx="22" cy="27" r="14" className="fill-primary/15" />
                  <circle cx="60" cy="27" r="14" className="fill-emerald-400/20" />
                  <circle cx="98" cy="27" r="14" className="fill-primary/15" />
                  <path d="M36 27h10M74 27h10" className="stroke-primary" strokeWidth="3" strokeLinecap="round" />
                  <path d="M18 27l4 4 8-10M56 27l4 4 8-10M94 27l4 4 8-10" className="stroke-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="font-semibold">{step.title}</div>
                <p className="mt-1 text-xs text-muted-foreground">{step.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
                        {tn.frequency === 'weekly' ? 'Hebdomadaire' : 'Mensuel'} · {tn.duration_months} mois · {selectionLabel[tn.selection]}
                      </div>
                    </div>
                    <Badge variant={tn.status === 'active' ? 'default' : 'secondary'}>{tn.status}</Badge>
                  </div>
                  {tn.status === 'pending' && (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-xs space-y-2">
                      <div className="font-semibold">En attente de quorum</div>
                      <div>Le groupe reste bloqué jusqu'à au moins 3 acceptations validées.</div>
                      {tn.my_join_status === 'pending' && (
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleInvitationDecision(tn.id, 'reject')}
                            disabled={respondingInvitation}
                          >
                            Refuser
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleInvitationDecision(tn.id, 'accept')}
                            disabled={respondingInvitation}
                            className="bg-gradient-brand shadow-brand"
                          >
                            Accepter
                          </Button>
                        </div>
                      )}
                      {tn.my_join_status && tn.my_join_status !== 'pending' && (
                        <div className="text-muted-foreground">Votre statut: {tn.my_join_status}</div>
                      )}
                    </div>
                  )}
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
                    <div className="col-span-2 border-t border-border pt-2 text-xs text-muted-foreground space-y-1">
                      <div>Score minimum: {tn.min_credit_score ?? 0}</div>
                      <div>KYC requis: {tn.require_kyc_verified ? 'Oui' : 'Non'}</div>
                      <div>Commission payout: {tn.payout_commission_percent ?? '0.00'}%</div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {tn.members.slice(0, 4).map((m) => (
                      <div key={m.user} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">#{m.position} {m.user}</span>
                        {m.received && <Badge variant="outline" className="h-4 text-[10px]">Reçu</Badge>}
                      </div>
                    ))}
                  </div>
                  {tn.is_owner && ['draft', 'pending'].includes(tn.status) && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => openEditDialog(tn)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />Editer
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => { setInviteTontineId(tn.id); setInviteOpen(true); }}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />Ajouter
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-2xl"
                        disabled={remindingMembers}
                        onClick={() => submitReminder(tn.id)}
                      >
                        <BellRing className="mr-2 h-4 w-4" />Rappeler
                      </Button>
                    </div>
                  )}
                  <Button
                    onClick={() => { setContribTontineId(tn.id); setContribAmount(String(tn.contribution)); setContribOpen(true); }}
                    className="w-full bg-gradient-brand shadow-brand"
                    disabled={tn.status !== 'active' || tn.my_join_status !== 'active'}
                  >
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

      <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetForm(); }}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden p-0">
          <DialogHeader className="flex-row items-center justify-between bg-primary px-7 py-5 text-primary-foreground">
            <DialogTitle className="flex items-center gap-3 font-display text-2xl">
              <Briefcase className="h-6 w-6" /> {editingId ? 'Editer tontine' : 'Nouvelle tontine'}
            </DialogTitle>
            <button onClick={() => setOpen(false)} className="rounded-full p-1 text-primary-foreground/70 hover:text-primary-foreground">
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>
          <div className="max-h-[calc(92vh-148px)] space-y-4 overflow-y-auto p-7">
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
                <Select value={selection} onValueChange={(v) => setSelection(v as 'random' | 'ordered' | 'credit_score')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ordered">Ordonné</SelectItem><SelectItem value="random">Aléatoire</SelectItem><SelectItem value="credit_score">Score crédit</SelectItem></SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Membres max</Label><Input type="number" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} /></div>
              <div className="space-y-2"><Label>Score min</Label><Input type="number" value={minCreditScore} onChange={(e) => setMinCreditScore(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Commission %</Label><Input type="number" value={payoutCommission} onChange={(e) => setPayoutCommission(e.target.value)} /></div>
              <div className="space-y-2"><Label>Réserve %</Label><Input type="number" value={reservePercent} onChange={(e) => setReservePercent(e.target.value)} /></div>
            </div>
            <WalletSelector label="Wallet d'escrow" value={escrowWalletId} onChange={(id) => setEscrowWalletId(id)} />
            <WalletSelector label="Wallet trésorerie" value={treasuryWalletId} onChange={(id) => setTreasuryWalletId(id)} />
            {!editingId && (
              <div className="space-y-2">
                <Label>Membres</Label>
                <Textarea
                  value={members}
                  onChange={(e) => setMembers(e.target.value)}
                  placeholder="email@lipaxe.com, LI1234567890"
                  className="min-h-28 resize-none rounded-2xl"
                />
                <p className="text-xs text-muted-foreground">Email ou numero de compte, separes par virgule ou retour a la ligne.</p>
              </div>
            )}
          </div>
          <DialogFooter className="border-t border-border bg-background px-7 py-5">
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }} className="min-w-32 rounded-2xl">Annuler</Button>
            <Button onClick={submitCreate} disabled={creating || updating} className="min-w-40 rounded-2xl bg-primary text-primary-foreground shadow-brand hover:bg-primary/90">
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={contribOpen} onOpenChange={setContribOpen}>
        <DialogContent className="max-w-lg overflow-hidden p-0">
          <DialogHeader className="flex-row items-center justify-between bg-primary px-7 py-5 text-primary-foreground">
            <DialogTitle className="flex items-center gap-3 font-display text-2xl">
              <Users className="h-6 w-6" /> Contribuer
            </DialogTitle>
            <button onClick={() => setContribOpen(false)} className="rounded-full p-1 text-primary-foreground/70 hover:text-primary-foreground">
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>
          <div className="space-y-4 p-7">
            <WalletSelector label="Portefeuille" value={contribWallet} onChange={(id) => setContribWallet(id)} />
            <div className="space-y-2"><Label>Montant</Label><Input type="number" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} /></div>
          </div>
          <DialogFooter className="border-t border-border bg-background px-7 py-5">
            <Button variant="outline" onClick={() => setContribOpen(false)} className="min-w-32 rounded-2xl">Annuler</Button>
            <Button onClick={submitContribute} className="min-w-40 rounded-2xl bg-primary text-primary-foreground shadow-brand hover:bg-primary/90">
              <Check className="mr-2 h-4 w-4" />Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-lg overflow-hidden p-0">
          <DialogHeader className="flex-row items-center justify-between bg-primary px-7 py-5 text-primary-foreground">
            <DialogTitle className="flex items-center gap-3 font-display text-2xl">
              <UserPlus className="h-6 w-6" /> Ajouter membres
            </DialogTitle>
            <button onClick={() => setInviteOpen(false)} className="rounded-full p-1 text-primary-foreground/70 hover:text-primary-foreground">
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>
          <div className="space-y-3 p-7">
            <Label>Email ou numero de compte</Label>
            <Textarea
              value={inviteText}
              onChange={(e) => setInviteText(e.target.value)}
              placeholder="user@email.com, LI1234567890"
              className="min-h-32 resize-none rounded-2xl"
            />
            <p className="text-xs text-muted-foreground">Les membres recevront une invitation et devront accepter avant activation.</p>
          </div>
          <DialogFooter className="border-t border-border bg-background px-7 py-5">
            <Button variant="outline" onClick={() => setInviteOpen(false)} className="min-w-32 rounded-2xl">Annuler</Button>
            <Button onClick={submitInviteMembers} disabled={invitingMembers} className="min-w-40 rounded-2xl bg-primary text-primary-foreground shadow-brand hover:bg-primary/90">
              {invitingMembers ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Inviter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PinModal open={pin.open} onOpenChange={pin.setOpen} onSuccess={pin.onSuccess} />
    </div>
  );
};

export default BusinessAll;
