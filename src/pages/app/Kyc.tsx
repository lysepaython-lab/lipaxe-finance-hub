import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setStep, updatePersonal, updateAddress, updateDocument, updateSelfie, resetKyc,
} from '@/store/slices/kycSlice';
import {
  useSubmitPersonalMutation, useSubmitAddressMutation, useVerifyPhoneMutation, useRequestPhoneOtpMutation,
} from '@/store/api/kycApi';
import { useCountriesQuery } from '@/store/api/platformApi';
import { updateUser } from '@/store/slices/authSlice';
import { Check, ChevronRight, ChevronLeft, ShieldCheck, Camera, RotateCcw, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CountryPicker } from '@/components/security/CountryPicker';
import { LivenessCapture } from '@/components/security/LivenessCapture';
import AnalyzerWorker from '@/workers/kycDocumentAnalyzer.worker.ts?worker';

type DocumentKind = 'passport' | 'nationalId' | 'drivingLicense' | 'unknown';

type AnalyzerResult = {
  bbox: { x: number; y: number; width: number; height: number } | null;
  brightness: number;
  sharpness: number;
  areaRatio: number;
  centered: boolean;
  withinFrame: boolean;
  hasDocument: boolean;
  frameCoverage: number;
  mrzConfidence: number;
  orientationHint: 'landscape' | 'portrait' | 'unknown';
};

type CapturedFile = {
  name: string;
  file: File | null;
};

const Kyc = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const kyc = useAppSelector((s) => s.kyc);
  const user = useAppSelector((s) => s.auth.user);
  const { data: countries } = useCountriesQuery();
  const [submitPersonal, { isLoading: l1 }] = useSubmitPersonalMutation();
  const [submitAddress, { isLoading: l2 }] = useSubmitAddressMutation();
  const [verifyPhone, { isLoading: l3 }] = useVerifyPhoneMutation();
  const [requestPhoneOtp, { isLoading: l4 }] = useRequestPhoneOtpMutation();
  const isLoading = l1 || l2 || l3 || l4;
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [frontCapture, setFrontCapture] = useState<CapturedFile>({ name: '', file: null });
  const [backCapture, setBackCapture] = useState<CapturedFile>({ name: '', file: null });
  const [selfieCapture, setSelfieCapture] = useState<CapturedFile>({ name: '', file: null });

  const steps = ['Informations', "Piece d'identite", 'Selfie'];
  const isStepValid = (step: number) => {
    if (step === 0) {
      return Boolean(
        kyc.personal.dob?.trim() &&
        kyc.personal.nationality?.trim() &&
        kyc.personal.phone?.trim() &&
        kyc.address.street?.trim() &&
        kyc.address.city?.trim() &&
        kyc.address.postalCode?.trim() &&
        kyc.address.country?.trim(),
      );
    }
    if (step === 1) {
      const hasFront = Boolean(kyc.document.frontName?.trim());
      const hasBack = kyc.document.type === 'passport' || Boolean(kyc.document.backName?.trim());
      return Boolean(kyc.document.type && kyc.document.idNumber?.trim() && hasFront && hasBack);
    }
    if (step === 2) return Boolean(kyc.selfie.livenessOk);
    return true;
  };
  const next = () => {
    if (!isStepValid(kyc.step)) {
      toast.error('Veuillez completer cette etape avant de continuer.');
      return;
    }
    dispatch(setStep(Math.min(kyc.step + 1, steps.length - 1)));
  };
  const back = () => dispatch(setStep(Math.max(kyc.step - 1, 0)));

  const onSubmit = async () => {
    if (![0, 1, 2].every((step) => isStepValid(step))) {
      toast.error('Completer toutes les etapes KYC avant de soumettre.');
      return;
    }
    try {
      const selectedCountry = (countries || []).find(
        (entry) => entry.country.alpha_2?.toUpperCase() === kyc.address.country?.toUpperCase(),
      )?.country;
      if (!selectedCountry?.id) {
        toast.error('Selectionnez un pays KYC valide');
        return;
      }

      const personal = new FormData();
      personal.append('date_of_birth', kyc.personal.dob || '');
      personal.append('phone', kyc.personal.phone || '');
      personal.append('country_code', kyc.personal.nationality || '');
      personal.append('country', selectedCountry.id);
      personal.append('address', kyc.address.street || '');
      personal.append('city', kyc.address.city || '');
      personal.append('postalCode', kyc.address.postalCode || '');
      if (user?.firstName) personal.append('first_name', user.firstName);
      if (user?.lastName) personal.append('last_name', user.lastName);

      const finalPayload = new FormData();
      finalPayload.append('date_of_birth', kyc.personal.dob || '');
      finalPayload.append('phone', kyc.personal.phone || '');
      finalPayload.append('country_code', kyc.personal.nationality || '');
      finalPayload.append('country', selectedCountry.id);
      finalPayload.append('address', kyc.address.street || '');
      finalPayload.append('city', kyc.address.city || '');
      finalPayload.append('postalCode', kyc.address.postalCode || '');
      finalPayload.append('identity_type', kyc.document.type || '');
      finalPayload.append('id_number', kyc.document.idNumber || '');
      finalPayload.append('is_terms_conditions', 'true');
      if (user?.firstName) finalPayload.append('first_name', user.firstName);
      if (user?.lastName) finalPayload.append('last_name', user.lastName);
      if (frontCapture.file) finalPayload.append('photo_id_front', frontCapture.file, frontCapture.name);
      if (backCapture.file) finalPayload.append('photo_id_back', backCapture.file, backCapture.name);
      if (selfieCapture.file) finalPayload.append('selfie_with_id', selfieCapture.file, selfieCapture.name);

      if (!frontCapture.file) {
        toast.error('Capturez le recto de votre pièce.');
        return;
      }
      if (kyc.document.type !== 'passport' && !backCapture.file) {
        toast.error('Capturez aussi le verso de votre pièce.');
        return;
      }
      if (!selfieCapture.file) {
        toast.error('Finalisez la vérification selfie avant de soumettre.');
        return;
      }

      await submitPersonal(personal).unwrap();
      await submitAddress(finalPayload).unwrap();
      dispatch(updateUser({ kycStatus: 'pending' }));
      dispatch(resetKyc());
      setFrontCapture({ name: '', file: null });
      setBackCapture({ name: '', file: null });
      setSelfieCapture({ name: '', file: null });
      setPhoneOtp('');
      setOtpRequested(false);
      toast.success(t('kyc.submitted'));
      navigate('/app');
    } catch {
      toast.error(t('common.error'));
    }
  };

  const requestOtp = async () => {
    if (!kyc.personal.phone?.trim()) {
      toast.error('Entrez d’abord votre numéro.');
      return;
    }
    try {
      const result = await requestPhoneOtp({ phone: kyc.personal.phone.trim() }).unwrap();
      setOtpRequested(true);
      toast.success(result.detail || result.message || 'Code OTP envoyé.');
    } catch {
      toast.error('Impossible d’envoyer le code OTP pour le moment.');
    }
  };

  const confirmPhoneOtp = async () => {
    if (!kyc.personal.phone?.trim() || !phoneOtp.trim()) {
      toast.error('Entrez le numéro et le code OTP.');
      return;
    }
    try {
      await verifyPhone({ phone: kyc.personal.phone.trim(), otp: phoneOtp.trim() }).unwrap();
      dispatch(updatePersonal({ phoneVerified: true }));
      toast.success('Numéro vérifié.');
    } catch {
      toast.error('Code OTP invalide.');
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
          {kyc.step === 0 && (
            <IdentityStep
              phoneOtp={phoneOtp}
              otpRequested={otpRequested}
              otpLoading={l3 || l4}
              onPhoneOtpChange={setPhoneOtp}
              onRequestOtp={requestOtp}
              onConfirmOtp={confirmPhoneOtp}
            />
          )}
          {kyc.step === 1 && (
            <DocumentsStep
              onFrontCapture={setFrontCapture}
              onBackCapture={setBackCapture}
            />
          )}
          {kyc.step === 2 && (
            <SelfieLivenessStep onCapture={setSelfieCapture} />
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={back} disabled={kyc.step === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('kyc.back')}
            </Button>
            {kyc.step < steps.length - 1 ? (
              <Button onClick={next} className="bg-gradient-brand shadow-brand" disabled={!isStepValid(kyc.step)}>
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

const IdentityStep = ({
  phoneOtp,
  otpRequested,
  otpLoading,
  onPhoneOtpChange,
  onRequestOtp,
  onConfirmOtp,
}: {
  phoneOtp: string;
  otpRequested: boolean;
  otpLoading: boolean;
  onPhoneOtpChange: (value: string) => void;
  onRequestOtp: () => Promise<void>;
  onConfirmOtp: () => Promise<void>;
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const personal = useAppSelector((s) => s.kyc.personal);
  const address = useAppSelector((s) => s.kyc.address);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
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
        <div className="space-y-2">
          <Label>{t('kyc.phone')}</Label>
          <Input
            value={personal.phone}
            onChange={(e) => dispatch(updatePersonal({ phone: e.target.value, phoneVerified: false }))}
            placeholder="+33 6 12 34 56 78"
            className="h-11 rounded-xl"
            maxLength={20}
          />
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className={personal.phoneVerified ? 'text-success font-medium' : 'text-muted-foreground'}>
              {personal.phoneVerified ? 'Numéro vérifié' : 'Numéro non vérifié'}
            </span>
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={onRequestOtp} disabled={otpLoading}>
              Envoyer OTP
            </Button>
          </div>
          {otpRequested && !personal.phoneVerified && (
            <div className="flex gap-2">
              <Input
                value={phoneOtp}
                onChange={(e) => onPhoneOtpChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="Code OTP"
                inputMode="numeric"
                className="h-10 rounded-xl"
                maxLength={8}
              />
              <Button type="button" variant="outline" className="shrink-0" onClick={onConfirmOtp} disabled={otpLoading}>
                Vérifier
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <CountryPicker
          label={t('kyc.nationality')}
          value={personal.nationality}
          onChange={(code) => dispatch(updatePersonal({ nationality: code }))}
        />
        <CountryPicker
          label={t('kyc.country')}
          value={address.country}
          onChange={(code) => dispatch(updateAddress({ country: code }))}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('kyc.street')}</Label>
        <Input
          value={address.street}
          onChange={(e) => dispatch(updateAddress({ street: e.target.value }))}
          className="h-11 rounded-xl"
          maxLength={120}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
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
    </div>
  );
};

const DocumentsStep = ({
  onFrontCapture,
  onBackCapture,
}: {
  onFrontCapture: (capture: CapturedFile) => void;
  onBackCapture: (capture: CapturedFile) => void;
}) => {
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
      <div className="space-y-2">
        <Label>Numéro de pièce</Label>
        <Input
          value={document.idNumber}
          onChange={(e) => dispatch(updateDocument({ idNumber: e.target.value }))}
          className="h-11 rounded-xl"
          maxLength={40}
          placeholder="Numéro d’identification"
        />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <DocumentCapture
          label={t('kyc.uploadFront')}
          value={document.frontName}
          documentType={(document.type as DocumentKind) || 'unknown'}
          onCapture={(capture) => {
            dispatch(updateDocument({ frontName: capture.name }));
            onFrontCapture(capture);
          }}
        />
        {document.type !== 'passport' && (
          <DocumentCapture
            label={t('kyc.uploadBack')}
            value={document.backName}
            documentType={(document.type as DocumentKind) || 'unknown'}
            onCapture={(capture) => {
              dispatch(updateDocument({ backName: capture.name }));
              onBackCapture(capture);
            }}
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Capture camera uniquement - l'upload de fichiers existants est desactive pour votre securite.
      </p>
    </>
  );
};

const defaultAnalysis: AnalyzerResult = {
  bbox: null,
  brightness: 0,
  sharpness: 0,
  areaRatio: 0,
  centered: false,
  withinFrame: false,
  hasDocument: false,
  frameCoverage: 0,
  mrzConfidence: 0,
  orientationHint: 'unknown',
};

const DocumentCapture = ({
  label,
  value,
  documentType,
  onCapture,
}: {
  label: string;
  value: string;
  documentType: DocumentKind;
  onCapture: (capture: CapturedFile) => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const frameLoopRef = useRef<number | null>(null);
  const frameCallbackRef = useRef<number | null>(null);
  const workerBusyRef = useRef(false);
  const lastRunAtRef = useRef(0);
  const okFramesRef = useRef(0);
  const lastMetricsRef = useRef<{ areaRatio: number; brightness: number; sharpness: number } | null>(null);
  const [active, setActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [hint, setHint] = useState('Placez votre document dans le cadre');
  const [autoScore, setAutoScore] = useState(0);
  const [isReadyToCapture, setIsReadyToCapture] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzerResult>(defaultAnalysis);
  const [videoAttached, setVideoAttached] = useState(false);

  const getDocumentVideoConstraints = async (): Promise<MediaStreamConstraints['video']> => {
    const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
    const hasMultipleVideoInputs = devices.filter((device) => device.kind === 'videoinput').length > 1;
    if (hasMultipleVideoInputs) {
      return {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      };
    }
    return {
      facingMode: { ideal: 'user' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    };
  };

  const drawVideoCover = (
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    targetW: number,
    targetH: number,
  ) => {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return;
    const scale = Math.max(targetW / vw, targetH / vh);
    const drawW = vw * scale;
    const drawH = vh * scale;
    const dx = (targetW - drawW) / 2;
    const dy = (targetH - drawH) / 2;
    ctx.drawImage(video, dx, dy, drawW, drawH);
  };

  const buildQualityScore = (result: AnalyzerResult, stable: boolean) => {
    const brightnessScore = Math.max(0, 100 - Math.abs(128 - result.brightness) * 1.1);
    const sharpnessScore = Math.min(100, result.sharpness * 2.7);
    const frameScore = result.withinFrame ? 100 : 30;
    const centeringScore = result.centered ? 100 : 45;
    const coverageScore = Math.min(100, result.areaRatio * 145);
    const mrzScore = documentType === 'passport' ? Math.min(100, result.mrzConfidence * 100) : 100;
    const stabilityScore = stable ? 100 : 40;
    return Math.round(
      brightnessScore * 0.15 +
      sharpnessScore * 0.18 +
      frameScore * 0.18 +
      centeringScore * 0.14 +
      coverageScore * 0.17 +
      mrzScore * 0.08 +
      stabilityScore * 0.1,
    );
  };

  const stop = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (frameLoopRef.current) window.clearTimeout(frameLoopRef.current);
    frameLoopRef.current = null;
    frameCallbackRef.current = null;
    workerBusyRef.current = false;
    setVideoAttached(false);
    setActive(false);
  };

  const snap = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const previewW = 640;
    const previewH = 480;
    c.width = previewW;
    c.height = previewH;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    drawVideoCover(ctx, v, previewW, previewH);

    const frameX = Math.floor(previewW * 0.10);
    const frameY = Math.floor(previewH * 0.10);
    const frameW = Math.floor(previewW * 0.80);
    const frameH = Math.floor(previewH * 0.80);
    const output = document.createElement('canvas');
    output.width = frameW;
    output.height = frameH;
    const outCtx = output.getContext('2d', { willReadFrequently: true });
    if (!outCtx) return;
    outCtx.drawImage(c, frameX, frameY, frameW, frameH, 0, 0, frameW, frameH);
    output.toBlob((blob) => {
      if (!blob) return;
      const fileName = `${label.replace(/\s+/g, '-')}-${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      const dataUrl = URL.createObjectURL(file);
      setPreview(dataUrl);
      onCapture({ name: fileName, file });
      stop();
    }, 'image/jpeg', 0.88);
  };

  const applyAnalysisResult = (result: AnalyzerResult) => {
    const last = lastMetricsRef.current;
    const stable = last
      ? Math.abs(last.areaRatio - result.areaRatio) < 0.08 &&
        Math.abs(last.brightness - result.brightness) < 8 &&
        Math.abs(last.sharpness - result.sharpness) < 8
      : false;
    lastMetricsRef.current = {
      areaRatio: result.areaRatio,
      brightness: result.brightness,
      sharpness: result.sharpness,
    };

    const score = buildQualityScore(result, stable);
    let message = 'Ajustez le document dans le cadre';
    let ready = false;

    if (result.brightness < 55) message = 'Ajoutez plus de lumiere';
    else if (!result.hasDocument) message = 'Document non detecte dans la zone cible';
    else if (!result.withinFrame) message = 'Placez le document entierement dans le cadre';
    else if (!result.centered) message = 'Centrez le document';
    else if (result.areaRatio < 0.34) message = 'Rapprochez le document';
    else if (result.areaRatio > 0.9) message = 'Reculez legerement le document';
    else if (result.sharpness < 20) message = 'Image floue: stabilisez la camera';
    else if (documentType === 'passport' && result.mrzConfidence < 0.2) message = 'Montrez la zone MRZ en bas du passeport';
    else if (!stable) message = 'Ne bougez plus, verification en cours';
    else {
      message = 'Parfait, capture automatique en cours';
      ready = score >= 82;
    }

    setAnalysis(result);
    setHint(message);
    setIsReadyToCapture(ready);
    setAutoScore(score);

    if (ready) okFramesRef.current += 1;
    else okFramesRef.current = Math.max(0, okFramesRef.current - 1);

    if (okFramesRef.current >= 8) {
      snap();
    }
  };

  const runAnalysis = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const worker = workerRef.current;
    if (!video || !canvas || !worker || workerBusyRef.current) return;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;
    const now = Date.now();
    if (now - lastRunAtRef.current < 90) return;
    lastRunAtRef.current = now;

    const width = 320;
    const height = 240;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    drawVideoCover(ctx, video, width, height);
    const image = ctx.getImageData(0, 0, width, height);
    workerBusyRef.current = true;
    worker.postMessage({
      type: 'analyze',
      payload: {
        width,
        height,
        pixels: image.data.buffer,
        documentKind: documentType,
      },
    }, [image.data.buffer]);
  };

  const scheduleAnalysis = () => {
    const video = videoRef.current as (HTMLVideoElement & {
      requestVideoFrameCallback?: (callback: () => void) => number;
    }) | null;
    if (!video || !active) return;

    if (typeof video.requestVideoFrameCallback === 'function') {
      frameCallbackRef.current = video.requestVideoFrameCallback(() => {
        runAnalysis();
        scheduleAnalysis();
      });
      return;
    }

    frameLoopRef.current = window.setTimeout(() => {
      runAnalysis();
      scheduleAnalysis();
    }, 110);
  };

  const start = async () => {
    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: await getDocumentVideoConstraints(),
          audio: false,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      }
      if (!stream) throw new Error('camera_unavailable');
      streamRef.current = stream;
      okFramesRef.current = 0;
      lastMetricsRef.current = null;
      setAnalysis(defaultAnalysis);
      setAutoScore(0);
      setHint('Placez votre document dans le cadre');
      setIsReadyToCapture(false);
      setVideoAttached(false);
      setActive(true);
    } catch {
      toast.error('Acces camera refuse');
    }
  };

  const reset = () => {
    setPreview(null);
    setHint('Placez votre document dans le cadre');
    setAutoScore(0);
    setIsReadyToCapture(false);
    setAnalysis(defaultAnalysis);
    setVideoAttached(false);
    onCapture({ name: '', file: null });
  };

  useEffect(() => {
    workerRef.current = new AnalyzerWorker();
    workerRef.current.onmessage = (event: MessageEvent<{ type: string; payload: AnalyzerResult }>) => {
      if (event.data?.type !== 'result') return;
      workerBusyRef.current = false;
      applyAnalysisResult(event.data.payload);
    };
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [documentType]);

  useEffect(() => {
    if (!active || !videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;

    const attachAndPlay = async () => {
      try {
        await video.play();
        setVideoAttached(true);
      } catch {
        setVideoAttached(false);
      }
    };

    const handleLoadedData = () => {
      void attachAndPlay();
    };

    video.addEventListener('loadeddata', handleLoadedData);
    if (video.readyState >= 2) {
      void attachAndPlay();
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    scheduleAnalysis();
    return () => {
      if (frameLoopRef.current) window.clearTimeout(frameLoopRef.current);
      frameLoopRef.current = null;
      frameCallbackRef.current = null;
    };
  }, [active, documentType]);

  const overlayBox = analysis.bbox ? {
    left: `${(analysis.bbox.x / 320) * 100}%`,
    top: `${(analysis.bbox.y / 240) * 100}%`,
    width: `${(analysis.bbox.width / 320) * 100}%`,
    height: `${(analysis.bbox.height / 240) * 100}%`,
  } : null;

  const qualitySummary = [
    analysis.brightness >= 55 ? 'Lumiere OK' : 'Lumiere faible',
    analysis.sharpness >= 20 ? 'Image nette' : 'Image floue',
    analysis.withinFrame && analysis.centered ? 'Bien cadre' : 'Recadrez le document',
  ].join(' • ');

  return (
    <div className="space-y-3 rounded-2xl border border-border/70 bg-card/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{label}</p>
        {value && <span className="text-xs font-medium text-success">Capturee</span>}
      </div>
      {preview ? (
        <div className="space-y-2">
          <img src={preview} alt={label} className="w-full rounded-xl aspect-[4/3] object-cover" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={reset} className="flex-1">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reprendre
            </Button>
          </div>
        </div>
      ) : active ? (
        <div className="space-y-3">
          <div className="relative w-full overflow-hidden rounded-[1.25rem] bg-black shadow-inner aspect-[4/3] ring-1 ring-white/10">
            <video ref={videoRef} playsInline muted autoPlay className="absolute inset-0 h-full w-full object-contain bg-black" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35" />
            <div
              className={cn(
                'absolute inset-[9%] rounded-[1.1rem] border-2 transition-colors',
                isReadyToCapture ? 'border-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.22)]' : 'border-white/90',
              )}
            />
            <div className="pointer-events-none absolute inset-[9%] rounded-[1.1rem]">
              <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold text-white">
                Document
              </div>
              <div className="absolute right-3 top-3 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
                {videoAttached ? 'Camera active' : 'Initialisation...'}
              </div>
              {overlayBox && (
                <div
                  className={cn(
                    'absolute rounded-md border transition-all',
                    isReadyToCapture ? 'border-emerald-400 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]' : 'border-amber-300/90',
                  )}
                  style={overlayBox}
                />
              )}
              {!videoAttached && (
                <div className="absolute inset-0 flex items-center justify-center rounded-[1.1rem] bg-black/42">
                  <div className="rounded-full border border-white/10 bg-black/65 px-3 py-2 text-xs font-medium text-white">
                    Ouverture du flux camera...
                  </div>
                </div>
              )}
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="rounded-xl bg-background/70 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className={cn('text-sm font-medium', isReadyToCapture ? 'text-success' : 'text-foreground')}>{hint}</p>
              <span className="text-xs font-semibold text-primary">{autoScore}/100</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{qualitySummary}</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={snap}
              disabled={!analysis.hasDocument}
              className="w-full bg-gradient-brand shadow-brand"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Capturer
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={stop} className="w-full">Annuler</Button>
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
        <Button type="button" variant="outline" onClick={start} className="h-16 w-full border-dashed rounded-xl">
          <Camera className="h-5 w-5 mr-2" /> Ouvrir la camera
        </Button>
      )}
    </div>
  );
};

const SelfieLivenessStep = ({
  onCapture,
}: {
  onCapture: (capture: CapturedFile) => void;
}) => {
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
        onSuccess={(result) => {
          const selfieName = result.snapshotFile?.name || `liveness-${Date.now()}.jpg`;
          dispatch(updateSelfie({ selfieName, livenessOk: true }));
          onCapture({ name: selfieName, file: result.snapshotFile || null });
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
