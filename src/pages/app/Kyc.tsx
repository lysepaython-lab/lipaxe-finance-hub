import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setStep, updatePersonal, updateAddress, updateDocument, updateSelfie, resetKyc,
} from '@/store/slices/kycSlice';
import {
  useSubmitPersonalMutation, useSubmitAddressMutation, useSubmitDocumentsMutation,
} from '@/store/api/kycApi';
import { updateUser } from '@/store/slices/authSlice';
import { Check, ChevronRight, ChevronLeft, ShieldCheck, Camera, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CountryPicker } from '@/components/security/CountryPicker';
import { LivenessCapture } from '@/components/security/LivenessCapture';

const Kyc = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const kyc = useAppSelector((s) => s.kyc);
  const [submitPersonal, { isLoading: l1 }] = useSubmitPersonalMutation();
  const [submitAddress, { isLoading: l2 }] = useSubmitAddressMutation();
  const [submitDocuments, { isLoading: l3 }] = useSubmitDocumentsMutation();
  const isLoading = l1 || l2 || l3;

  const steps = [t('kyc.step1'), t('kyc.step2'), t('kyc.step3'), t('kyc.step4'), t('kyc.step5')];
  const next = () => dispatch(setStep(Math.min(kyc.step + 1, steps.length - 1)));
  const back = () => dispatch(setStep(Math.max(kyc.step - 1, 0)));

  const onSubmit = async () => {
    try {
      const personal = new FormData();
      Object.entries(kyc.personal).forEach(([k, v]) => personal.append(k, String(v ?? '')));
      const address = new FormData();
      Object.entries(kyc.address).forEach(([k, v]) => address.append(k, String(v ?? '')));
      const docs = new FormData();
      docs.append('type', kyc.document.type || '');
      docs.append('front_name', kyc.document.frontName);
      docs.append('back_name', kyc.document.backName);
      docs.append('selfie_name', kyc.selfie.selfieName);
      docs.append('liveness_ok', String(kyc.selfie.livenessOk));
      await submitPersonal(personal).unwrap();
      await submitAddress(address).unwrap();
      await submitDocuments(docs).unwrap();
      dispatch(updateUser({ kycStatus: 'pending' }));
      dispatch(resetKyc());
      toast.success(t('kyc.submitted'));
      navigate('/app');
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" /> {t('kyc.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('kyc.subtitle')}</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div
              className={cn(
                'flex items-center gap-2 transition-smooth',
                i <= kyc.step ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2',
                  i < kyc.step ? 'bg-primary text-primary-foreground border-primary' :
                  i === kyc.step ? 'border-primary text-primary bg-primary/10' :
                  'border-border',
                )}
              >
                {i < kyc.step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="hidden md:block text-xs font-medium">{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('h-0.5 flex-1 mx-2', i < kyc.step ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        ))}
      </div>

      <Card className="shadow-elegant border-border/60">
        <CardContent className="p-6 space-y-5">
          {kyc.step === 0 && <PersonalStep />}
          {kyc.step === 1 && <AddressStep />}
          {kyc.step === 2 && <DocumentsStep />}
          {kyc.step === 3 && <SelfieLivenessStep />}
          {kyc.step === 4 && <ReviewStep />}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={back} disabled={kyc.step === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('kyc.back')}
            </Button>
            {kyc.step < steps.length - 1 ? (
              <Button onClick={next} className="bg-gradient-brand shadow-brand">
                {t('kyc.next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={onSubmit} disabled={isLoading} className="bg-gradient-brand shadow-brand">
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('kyc.submit')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* ----------------------------- Step components ---------------------------- */

const PersonalStep = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const personal = useAppSelector((s) => s.kyc.personal);
  return (
    <>
      <div className="space-y-2">
        <Label>{t('kyc.dob')}</Label>
        <Input
          type="date"
          value={personal.dob}
          max={new Date().toISOString().split('T')[0]}
          onChange={(e) => dispatch(updatePersonal({ dob: e.target.value }))}
          className="h-11 rounded-xl"
        />
      </div>
      <CountryPicker
        label={t('kyc.nationality')}
        value={personal.nationality}
        onChange={(code) => dispatch(updatePersonal({ nationality: code }))}
      />
      <div className="space-y-2">
        <Label>{t('kyc.phone')}</Label>
        <Input
          value={personal.phone}
          onChange={(e) => dispatch(updatePersonal({ phone: e.target.value }))}
          placeholder="+33 6 12 34 56 78"
          className="h-11 rounded-xl"
          maxLength={20}
        />
      </div>
    </>
  );
};

const AddressStep = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const address = useAppSelector((s) => s.kyc.address);
  return (
    <>
      <div className="space-y-2">
        <Label>{t('kyc.street')}</Label>
        <Input
          value={address.street}
          onChange={(e) => dispatch(updateAddress({ street: e.target.value }))}
          className="h-11 rounded-xl"
          maxLength={120}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t('kyc.city')}</Label>
          <Input
            value={address.city}
            onChange={(e) => dispatch(updateAddress({ city: e.target.value }))}
            className="h-11 rounded-xl"
            maxLength={80}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('kyc.postalCode')}</Label>
          <Input
            value={address.postalCode}
            onChange={(e) => dispatch(updateAddress({ postalCode: e.target.value }))}
            className="h-11 rounded-xl"
            maxLength={20}
          />
        </div>
      </div>
      <CountryPicker
        label={t('kyc.country')}
        value={address.country}
        onChange={(code) => dispatch(updateAddress({ country: code }))}
      />
    </>
  );
};

const DocumentsStep = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const document = useAppSelector((s) => s.kyc.document);
  return (
    <>
      <div className="space-y-2">
        <Label>{t('kyc.idType')}</Label>
        <Select
          value={document.type || undefined}
          onValueChange={(v) => dispatch(updateDocument({ type: v as 'passport' | 'nationalId' | 'drivingLicense' }))}
        >
          <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Choisir" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="passport">{t('kyc.passport')}</SelectItem>
            <SelectItem value="nationalId">{t('kyc.nationalId')}</SelectItem>
            <SelectItem value="drivingLicense">{t('kyc.drivingLicense')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <DocumentCapture
          label={t('kyc.uploadFront')}
          value={document.frontName}
          onCapture={(name) => dispatch(updateDocument({ frontName: name }))}
        />
        {document.type !== 'passport' && (
          <DocumentCapture
            label={t('kyc.uploadBack')}
            value={document.backName}
            onCapture={(name) => dispatch(updateDocument({ backName: name }))}
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        🔒 Capture caméra uniquement — l'upload de fichiers existants est désactivé pour votre sécurité.
      </p>
    </>
  );
};

const DocumentCapture = ({ label, value, onCapture }: { label: string; value: string; onCapture: (n: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const start = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
      setActive(true);
    } catch {
      toast.error('Accès caméra refusé');
    }
  };

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setActive(false);
  };

  const snap = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    const dataUrl = c.toDataURL('image/jpeg', 0.85);
    setPreview(dataUrl);
    onCapture(`${label.replace(/\s+/g, '-')}-${Date.now()}.jpg`);
    stop();
  };

  const reset = () => { setPreview(null); onCapture(''); };

  return (
    <div className="rounded-xl border-2 border-dashed border-border p-3 space-y-2 bg-muted/30">
      <p className="text-sm font-medium">{label}</p>
      {preview ? (
        <div className="space-y-2">
          <img src={preview} alt={label} className="rounded-lg w-full aspect-[4/3] object-cover" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={reset} className="flex-1">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reprendre
            </Button>
          </div>
        </div>
      ) : active ? (
        <div className="space-y-2">
          <video ref={videoRef} playsInline muted className="rounded-lg w-full aspect-[4/3] object-cover bg-black" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={snap} className="flex-1 bg-gradient-brand">
              <Camera className="h-3.5 w-3.5 mr-1.5" /> Capturer
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={stop}>Annuler</Button>
          </div>
        </div>
      ) : value ? (
        <div className="flex items-center justify-between gap-2 py-3">
          <div className="flex items-center gap-2 text-success font-medium text-sm">
            <Check className="h-4 w-4" /> {value}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={start} className="w-full h-20 border-dashed">
          <Camera className="h-5 w-5 mr-2" /> Ouvrir la caméra
        </Button>
      )}
    </div>
  );
};

const SelfieLivenessStep = () => {
  const dispatch = useAppDispatch();
  const selfie = useAppSelector((s) => s.kyc.selfie);
  const [open, setOpen] = useState(false);

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Pour finaliser, nous devons confirmer que c'est bien vous via la caméra (anti-fraude).
      </p>
      <motion.div
        whileHover={{ y: -1 }}
        className={cn(
          'rounded-xl border-2 p-6 text-center transition-colors cursor-pointer',
          selfie.livenessOk ? 'border-success bg-success/5' : 'border-dashed border-border hover:border-primary/50',
        )}
        onClick={() => !selfie.livenessOk && setOpen(true)}
      >
        {selfie.livenessOk ? (
          <>
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-success/15 text-success flex items-center justify-center">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <p className="font-display font-semibold text-success">Présence vérifiée</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
              Refaire la vérification
            </Button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Camera className="h-7 w-7" />
            </div>
            <p className="font-display font-semibold">Démarrer la vérification</p>
            <p className="text-xs text-muted-foreground mt-1">
              Suivez les instructions guidées (clignement, tête, sourire)
            </p>
          </>
        )}
      </motion.div>

      <LivenessCapture
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          dispatch(updateSelfie({ selfieName: `liveness-${Date.now()}.jpg`, livenessOk: true }));
          toast.success('Vérification de présence réussie');
        }}
      />
    </>
  );
};

const ReviewStep = () => {
  const { t } = useTranslation();
  const kyc = useAppSelector((s) => s.kyc);
  const rows = [
    { k: t('kyc.dob'), v: kyc.personal.dob },
    { k: t('kyc.nationality'), v: kyc.personal.nationality },
    { k: t('kyc.phone'), v: kyc.personal.phone },
    {
      k: t('kyc.street'),
      v: `${kyc.address.street}, ${kyc.address.city} ${kyc.address.postalCode}, ${kyc.address.country}`,
    },
    { k: t('kyc.idType'), v: kyc.document.type },
    { k: 'Pièce', v: kyc.document.frontName },
    { k: 'Vivacité', v: kyc.selfie.livenessOk ? '✅ Vérifiée' : '❌ Manquante' },
  ];
  return (
    <div className="space-y-3">
      <h3 className="font-display font-semibold text-lg">{t('kyc.reviewTitle')}</h3>
      {rows.map((r) => (
        <div key={r.k} className="flex justify-between text-sm border-b border-border py-2">
          <span className="text-muted-foreground">{r.k}</span>
          <span className="font-medium text-right">{r.v || '—'}</span>
        </div>
      ))}
    </div>
  );
};

export default Kyc;
