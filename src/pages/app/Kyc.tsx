import { useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent } from 'react';
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
  useGetKycDataQuery, useSubmitPersonalMutation, useSubmitDocumentsMutation,
} from '@/store/api/kycApi';
import { getKycState } from '@/lib/kycStatus';
import { useCountriesQuery } from '@/store/api/platformApi';
import type { IncountryEntry } from '@/store/api/platformApi';
import { updateUser } from '@/store/slices/authSlice';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  ClipboardCheck,
  FileCheck2,
  ShieldCheck,
  Camera,
  RotateCcw,
  Loader2,
  CheckCircle2,
  FileText,
  UploadCloud,
  X,
  UserRound,
  Home,
  BriefcaseBusiness,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CountryPicker } from '@/components/security/CountryPicker';
import { SelfieWithIdCapture } from '@/components/security/SelfieWithIdCapture';
import AnalyzerWorker from '@/workers/kycDocumentAnalyzer.worker.ts?worker';
import { t } from 'i18next';

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
  qualityScore?: number;
  mrzConfidence?: number;
  signals?: string[];
};

const DOCUMENT_MIN_SCORE = 78;

const GENDER_OPTIONS = ['male', 'female', 'other'] as const;
const EMPLOYMENT_STATUS_OPTIONS = ['employed', 'self_employed', 'student', 'unemployed', 'retired'] as const;
const PURPOSE_OF_ACCOUNT_OPTIONS = ['personal', 'transfers', 'business', 'savings', 'crypto'] as const;
const SOURCE_OF_FUNDS_OPTIONS = ['salary', 'business', 'savings', 'family_support', 'investment', 'crypto'] as const;

const PHONE_LOCAL_LENGTHS: Record<string, number | [number, number]> = {
  BI: 8,
  CD: 9,
  RW: 9,
  KE: 9,
  TZ: 9,
  UG: 9,
  SN: 9,
  GH: 9,
  NG: 10,
  FR: 9,
  GB: 10,
  US: 10,
  CA: 10,
};

const cleanDialCode = (value?: string) => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? `+${digits}` : '';
};

const findCountry = (countries: IncountryEntry[] | undefined, alpha2?: string) =>
  (countries || []).find((entry) => entry.country.alpha_2?.toUpperCase() === alpha2?.toUpperCase())?.country;

const normalizePhoneForCountry = (phone: string, dialCode: string) => {
  const raw = phone.trim();
  if (!raw) return '';
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  if (digits.startsWith('+')) return `+${digits.slice(1).replace(/\D/g, '')}`;

  const dialDigits = dialCode.replace(/\D/g, '');
  const local = digits.replace(/\D/g, '').replace(/^0+/, '');
  if (!dialDigits) return local ? `+${local}` : '';
  return local.startsWith(dialDigits) ? `+${local}` : `+${dialDigits}${local}`;
};

const validatePhoneForCountry = (
  phone: string,
  alpha2: string | undefined,
  countries: IncountryEntry[] | undefined,
) => {
  if (!alpha2) return { valid: false, normalized: phone.trim(), message: 'Selectionnez le pays de residence.' };
  const country = findCountry(countries, alpha2);
  const dialCode = cleanDialCode(country?.phone_code || country?.dialling_code);
  if (!dialCode) return { valid: false, normalized: phone.trim(), message: 'Indicatif pays indisponible.' };

  const normalized = normalizePhoneForCountry(phone, dialCode);
  if (!normalized.startsWith(dialCode)) {
    return {
      valid: false,
      normalized,
      message: `Le numero doit commencer par ${dialCode} pour ${country?.name || alpha2}.`,
    };
  }

  const local = normalized.slice(dialCode.length);
  const expected = PHONE_LOCAL_LENGTHS[alpha2.toUpperCase()];
  const min = Array.isArray(expected) ? expected[0] : expected || 6;
  const max = Array.isArray(expected) ? expected[1] : expected || 12;
  if (!/^\d+$/.test(local) || local.length < min || local.length > max) {
    const lengthHint = min === max ? `${min} chiffres` : `${min} a ${max} chiffres`;
    return {
      valid: false,
      normalized,
      message: `Apres ${dialCode}, le numero doit contenir ${lengthHint}.`,
    };
  }

  return { valid: true, normalized, message: `Numero coherent avec ${country?.name || alpha2}.` };
};

const Kyc = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const kyc = useAppSelector((s) => s.kyc);
  const user = useAppSelector((s) => s.auth.user);
  const { data: countries } = useCountriesQuery();
  const { data: serverKyc, isLoading: serverKycLoading } = useGetKycDataQuery();
  const [submitPersonal, { isLoading: l1 }] = useSubmitPersonalMutation();
  const [submitDocuments, { isLoading: l2 }] = useSubmitDocumentsMutation();
  const isLoading = l1 || l2;
  const [frontCapture, setFrontCapture] = useState<CapturedFile>({ name: '', file: null });
  const [backCapture, setBackCapture] = useState<CapturedFile>({ name: '', file: null });
  const [addressProofCapture, setAddressProofCapture] = useState<CapturedFile>({ name: '', file: null });
  const [selfieCapture, setSelfieCapture] = useState<CapturedFile>({ name: '', file: null });
  const [showStepErrors, setShowStepErrors] = useState(false);
  const phoneValidation = useMemo(
    () => validatePhoneForCountry(kyc.personal.phone, kyc.address.country, countries),
    [countries, kyc.address.country, kyc.personal.phone],
  );
  const serverKycState = getKycState(serverKyc, user);
  const kycLocked = serverKycState.locked;

  const steps = [t('kyc.step1'), t('kyc.step3'), t('kyc.step4'), t('kyc.stepDecision')];
  const isStepValid = (step: number) => {
    if (step === 0) {
      return Boolean(
        kyc.personal.dob?.trim() &&
        kyc.personal.nationality?.trim() &&
        kyc.personal.phone?.trim() &&
        phoneValidation.valid &&
        kyc.personal.consentAccepted &&
        kyc.personal.gender &&
        kyc.personal.employmentStatus &&
        kyc.personal.purposeOfAccount &&
        kyc.personal.sourceOfFunds &&
        kyc.personal.annualIncome.trim() &&
        kyc.personal.expectedMonthlyVolume.trim() &&
        kyc.address.street?.trim() &&
        kyc.address.city?.trim() &&
        kyc.address.province?.trim() &&
        kyc.address.postalCode?.trim() &&
        kyc.address.country?.trim(),
      );
    }
    if (step === 1) {
      const hasFront = Boolean(kyc.document.frontName?.trim());
      const hasBack = kyc.document.type === 'passport' || Boolean(kyc.document.backName?.trim());
      return Boolean(kyc.document.type && kyc.document.idNumber?.trim() && hasFront && hasBack && addressProofCapture.file);
    }
    if (step === 2) return Boolean(kyc.selfie.cameraCaptured && kyc.selfie.policyAccepted);
    if (step === 3) return true;
    return true;
  };
  const getMissingFields = (step: number) => {
    if (step === 0) {
      const missing = [
        [!kyc.personal.dob?.trim(), t('kyc.dob')],
        [!kyc.personal.gender, t('kyc.gender')],
        [!kyc.personal.nationality?.trim(), t('kyc.nationality')],
        [!kyc.personal.phone?.trim() || !phoneValidation.valid, t('kyc.phone')],
        [!kyc.personal.employmentStatus?.trim(), t('kyc.employmentStatus')],
        [!kyc.personal.purposeOfAccount, t('kyc.purposeOfAccount')],
        [!kyc.personal.sourceOfFunds, t('kyc.sourceOfFunds')],
        [!kyc.personal.annualIncome?.trim(), t('kyc.annualIncome')],
        [!kyc.personal.expectedMonthlyVolume?.trim(), t('kyc.expectedMonthlyVolume')],
        [!kyc.address.country?.trim(), t('kyc.country')],
        [!kyc.address.street?.trim(), t('kyc.street')],
        [!kyc.address.city?.trim(), t('kyc.city')],
        [!kyc.address.province?.trim(), t('kyc.province')],
        [!kyc.address.postalCode?.trim(), t('kyc.postalCode')],
        [!kyc.personal.consentAccepted, t('kyc.consent')],
      ] as const;
      return missing.filter(([isMissing]) => isMissing).map(([, label]) => label);
    }
    if (step === 1) {
      const missing = [
        [!kyc.document.type, t('kyc.idType')],
        [!kyc.document.idNumber?.trim(), t('kyc.idNumber')],
        [!frontCapture.file, kyc.document.type === 'passport' ? t('kyc.uploadPassportPage') : t('kyc.uploadFront')],
        [kyc.document.type !== 'passport' && !backCapture.file, t('kyc.uploadBack')],
        [!addressProofCapture.file, t('kyc.addressProofTitle')],
      ] as const;
      return missing.filter(([isMissing]) => isMissing).map(([, label]) => label);
    }
    if (step === 2 && !(kyc.selfie.cameraCaptured && kyc.selfie.policyAccepted)) {
      return [t('kyc.cameraSelfieTitle')];
    }
    return [];
  };
  const next = () => {
    if (!isStepValid(kyc.step)) {
      setShowStepErrors(true);
      return;
    }
    setShowStepErrors(false);
    dispatch(setStep(Math.min(kyc.step + 1, steps.length - 1)));
  };
  const back = () => {
    setShowStepErrors(false);
    dispatch(setStep(Math.max(kyc.step - 1, 0)));
  };

  const onSubmit = async () => {
    if (![0, 1, 2, 3].every((step) => isStepValid(step))) {
      const firstInvalidStep = [0, 1, 2].find((step) => !isStepValid(step));
      if (firstInvalidStep !== undefined) {
        dispatch(setStep(firstInvalidStep));
        setShowStepErrors(true);
      }
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
      personal.append('province', kyc.address.province || '');
      personal.append('postalCode', kyc.address.postalCode || '');
      personal.append('gender', kyc.personal.gender || '');
      personal.append('employmentStatus', kyc.personal.employmentStatus || '');
      personal.append('purposeOfAccount', kyc.personal.purposeOfAccount || '');
      personal.append('sourceOfFunds', kyc.personal.sourceOfFunds || '');
      personal.append('annualIncome', kyc.personal.annualIncome || '');
      personal.append('expectedMonthlyVolume', kyc.personal.expectedMonthlyVolume || '');
      if (user?.firstName) personal.append('first_name', user.firstName);
      if (user?.lastName) personal.append('last_name', user.lastName);

      const finalPayload = new FormData();
      finalPayload.append('date_of_birth', kyc.personal.dob || '');
      finalPayload.append('phone', kyc.personal.phone || '');
      finalPayload.append('country_code', kyc.personal.nationality || '');
      finalPayload.append('country', selectedCountry.id);
      finalPayload.append('address', kyc.address.street || '');
      finalPayload.append('city', kyc.address.city || '');
      finalPayload.append('province', kyc.address.province || '');
      finalPayload.append('postalCode', kyc.address.postalCode || '');
      finalPayload.append('gender', kyc.personal.gender || '');
      finalPayload.append('employmentStatus', kyc.personal.employmentStatus || '');
      finalPayload.append('purposeOfAccount', kyc.personal.purposeOfAccount || '');
      finalPayload.append('sourceOfFunds', kyc.personal.sourceOfFunds || '');
      finalPayload.append('annualIncome', kyc.personal.annualIncome || '');
      finalPayload.append('expectedMonthlyVolume', kyc.personal.expectedMonthlyVolume || '');
      finalPayload.append('identity_type', kyc.document.type || '');
      finalPayload.append('id_number', kyc.document.idNumber || '');
      finalPayload.append('is_terms_conditions', 'true');
      finalPayload.append('selfie_capture_source', 'camera');
      finalPayload.append('selfie_capture_confirmed', 'true');
      if (user?.firstName) finalPayload.append('first_name', user.firstName);
      if (user?.lastName) finalPayload.append('last_name', user.lastName);
      if (frontCapture.file) finalPayload.append('photo_id_front', frontCapture.file, frontCapture.name);
      if (backCapture.file) finalPayload.append('photo_id_back', backCapture.file, backCapture.name);
      if (selfieCapture.file) finalPayload.append('selfie_with_id', selfieCapture.file, selfieCapture.name);
      if (addressProofCapture.file) finalPayload.append('proof_of_address', addressProofCapture.file, addressProofCapture.name);

      if (!frontCapture.file) {
        toast.error(kyc.document.type === 'passport' ? t('kyc.capturePassportPage') : t('kyc.captureFront'));
        return;
      }
      if (kyc.document.type !== 'passport' && !backCapture.file) {
        toast.error(t('kyc.captureBack'));
        return;
      }
      if (!selfieCapture.file) {
        toast.error(t('kyc.completeSelfieBeforeSubmit'));
        return;
      }
      if (!addressProofCapture.file) {
        toast.error(t('kyc.addressProofRequired'));
        return;
      }

      await submitPersonal(personal).unwrap();
      const addressResponse = await submitDocuments(finalPayload).unwrap();
      const responseState = getKycState(addressResponse, {
        ...user,
        kycStatus: 'pending',
        kycComplete: true,
      });
      const responseStatus = responseState.status === 'unverified' ? 'pending' : responseState.status;
      const responseComplete = true;
      dispatch(updateUser({ kycStatus: responseStatus, kycComplete: responseComplete }));
      dispatch(resetKyc());
      setFrontCapture({ name: '', file: null });
      setBackCapture({ name: '', file: null });
      setSelfieCapture({ name: '', file: null });
      setAddressProofCapture({ name: '', file: null });
      toast.success(t('kyc.submitted'));
      navigate('/app/kyc', { replace: true });
    } catch (error: unknown) {
      const data = (error as { data?: { message?: unknown; detail?: unknown } })?.data;
      const message = typeof data?.message === 'string'
        ? data.message
        : typeof data?.detail === 'string'
          ? data.detail
          : t('common.error');
      toast.error(message);
    }
  };

  if (serverKycLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (kycLocked) {
    const isVerified = serverKycState.verified;
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="overflow-hidden border-primary/20 bg-card/95 shadow-soft">
          <div className={cn('h-1.5', isVerified ? 'bg-success' : 'bg-amber-400')} />
          <CardContent className="space-y-6 p-8 text-center">
            <div
              className={cn(
                'mx-auto flex h-16 w-16 items-center justify-center rounded-3xl',
                isVerified ? 'bg-success/12 text-success' : 'bg-amber-500/12 text-amber-300',
              )}
            >
              {isVerified ? <CheckCircle2 className="h-8 w-8" /> : <ClipboardCheck className="h-8 w-8" />}
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-bold">
                {isVerified ? t('kyc.lockedVerifiedTitle') : t('kyc.lockedPendingTitle')}
              </h1>
              <p className="text-muted-foreground">
                {isVerified ? t('kyc.lockedVerifiedBody') : t('kyc.lockedPendingBody')}
              </p>
            </div>
            <Button className="bg-gradient-brand shadow-brand" onClick={() => navigate('/app')}>
              {t('kyc.backToDashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" /> {t('kyc.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('kyc.subtitle')}</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-4 shadow-sm sm:px-5">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div
              className={cn(
                'flex items-center gap-2 transition-smooth',
                i <= kyc.step ? 'text-emerald-700' : 'text-slate-400',
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold',
                  i < kyc.step ? 'border-emerald-700 bg-emerald-700 text-white' :
                  i === kyc.step ? 'border-emerald-700 bg-emerald-50 text-emerald-800' :
                  'border-slate-200 bg-white text-slate-400',
                )}
              >
                {i < kyc.step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="hidden text-xs font-medium text-slate-600 md:block">{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('mx-2 h-px flex-1', i < kyc.step ? 'bg-emerald-600' : 'bg-slate-200')} />
            )}
          </div>
        ))}
      </div>

      <Card className="overflow-hidden border-slate-200 bg-white text-slate-900 shadow-[0_12px_36px_rgba(15,23,42,0.07)]">
        <CardContent className="space-y-5 p-4 sm:p-6 lg:p-7">
          {kyc.step === 0 && (
            <IdentityStep countries={countries} showErrors={showStepErrors} />
          )}
          {kyc.step === 1 && (
            <DocumentsStep
              onFrontCapture={setFrontCapture}
              onBackCapture={setBackCapture}
              onAddressProofCapture={setAddressProofCapture}
              showErrors={showStepErrors}
            />
          )}
          {kyc.step === 2 && (
            <SelfieWithIdStep onCapture={setSelfieCapture} />
          )}
          {kyc.step === 3 && (
            <ManualReviewStep addressProofName={addressProofCapture.name} />
          )}

          {showStepErrors && getMissingFields(kyc.step).length > 0 && (
            <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-700">{t('kyc.requiredFieldsTitle')}</p>
              <ul className="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
                {getMissingFields(kyc.step).map((field) => <li key={field}>• {field}</li>)}
              </ul>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={back} disabled={kyc.step === 0} className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('kyc.back')}
            </Button>
            {kyc.step < steps.length - 1 ? (
              <Button onClick={next} className="rounded-xl bg-emerald-700 text-white shadow-sm hover:bg-emerald-800" disabled={isLoading}>
                {t('kyc.next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={onSubmit} disabled={isLoading || !isStepValid(kyc.step)} className="rounded-xl bg-emerald-700 text-white shadow-sm hover:bg-emerald-800">
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

const IdentityStep = ({ countries, showErrors }: { countries?: IncountryEntry[]; showErrors: boolean }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const personal = useAppSelector((s) => s.kyc.personal);
  const address = useAppSelector((s) => s.kyc.address);
  const selectedCountry = findCountry(countries, address.country);
  const selectedDialCode = cleanDialCode(selectedCountry?.phone_code || selectedCountry?.dialling_code);
  const phoneValidation = validatePhoneForCountry(personal.phone, address.country, countries);
  const hasPhoneInput = Boolean(personal.phone.trim());
  const invalid = (value?: string | boolean) => showErrors && !String(value || '').trim();
  const invalidClass = 'border-destructive focus-visible:ring-destructive/20';
  const fieldClass = 'h-11 rounded-xl border-slate-200 bg-white text-slate-800 shadow-sm placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-600/15';
  const sectionClass = 'space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)] sm:p-5';
  const labelClass = 'text-[11px] font-semibold text-slate-700';
  const requiredMark = <span className="ml-1 text-rose-500">*</span>;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px]">
      <div className="min-w-0 space-y-4">
        <section className={sectionClass}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><UserRound className="h-5 w-5" /></span>
            <div><h2 className="font-display text-base font-bold text-slate-900">{t('kyc.personalDetailsGroup')}</h2><p className="text-xs text-slate-500">{t('kyc.personalDetailsHint')}</p></div>
          </div>
          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className={labelClass}>{t('kyc.dob')}{requiredMark}</Label>
              <Input type="date" value={personal.dob} max={new Date().toISOString().split('T')[0]} onChange={(e) => dispatch(updatePersonal({ dob: e.target.value }))} aria-invalid={invalid(personal.dob)} className={cn(fieldClass, invalid(personal.dob) && invalidClass)} />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>{t('kyc.employmentStatus')}{requiredMark}</Label>
              <Select value={personal.employmentStatus || undefined} onValueChange={(value) => dispatch(updatePersonal({ employmentStatus: value }))}>
                <SelectTrigger aria-invalid={invalid(personal.employmentStatus)} className={cn(fieldClass, invalid(personal.employmentStatus) && invalidClass)}><SelectValue placeholder={t('kyc.selectPlaceholder')} /></SelectTrigger>
                <SelectContent className="border-slate-200 bg-white text-slate-800">{EMPLOYMENT_STATUS_OPTIONS.map((value) => <SelectItem key={value} value={value}>{t(`kyc.employment_${value}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>{t('kyc.gender')}{requiredMark}</Label>
              <Select value={personal.gender || undefined} onValueChange={(value) => dispatch(updatePersonal({ gender: value }))}>
                <SelectTrigger aria-invalid={showErrors && !personal.gender} className={cn(fieldClass, showErrors && !personal.gender && invalidClass)}><SelectValue placeholder={t('kyc.selectPlaceholder')} /></SelectTrigger>
                <SelectContent className="border-slate-200 bg-white text-slate-800">{GENDER_OPTIONS.map((value) => <SelectItem key={value} value={value}>{t(`kyc.gender_${value}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>{t('kyc.phone')}{requiredMark}</Label>
              <Input value={personal.phone} onChange={(e) => dispatch(updatePersonal({ phone: e.target.value, phoneVerified: false }))} onBlur={() => {
                if (phoneValidation.valid && phoneValidation.normalized !== personal.phone) dispatch(updatePersonal({ phone: phoneValidation.normalized, phoneVerified: false }));
              }} placeholder={selectedDialCode ? `${selectedDialCode} ...` : '+257 ...'} aria-invalid={showErrors && !phoneValidation.valid} className={cn(fieldClass, showErrors && !phoneValidation.valid && invalidClass)} maxLength={20} />
              <p className={cn('rounded-lg px-2.5 py-1.5 text-[10px] leading-relaxed', hasPhoneInput && phoneValidation.valid ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500')}>
                {hasPhoneInput ? phoneValidation.message : `Entrez un numero lie au pays selectionne${selectedDialCode ? ` (${selectedDialCode})` : ''}.`}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>{t('kyc.nationality')}{requiredMark}</Label>
              <CountryPicker value={personal.nationality} onChange={(code) => dispatch(updatePersonal({ nationality: code }))} triggerClassName="h-11 rounded-xl border-slate-200 bg-white text-sm text-slate-800 shadow-sm" contentClassName="border-slate-200 bg-white text-slate-800" />
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Home className="h-5 w-5" /></span>
            <div><h2 className="font-display text-base font-bold text-slate-900">{t('kyc.residenceGroup')}</h2><p className="text-xs text-slate-500">{t('kyc.residenceHint')}</p></div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className={labelClass}>{t('kyc.country')}{requiredMark}</Label><CountryPicker value={address.country} onChange={(code) => dispatch(updateAddress({ country: code }))} triggerClassName="h-11 rounded-xl border-slate-200 bg-white text-sm text-slate-800 shadow-sm" contentClassName="border-slate-200 bg-white text-slate-800" /></div>
            <div className="space-y-1.5"><Label className={labelClass}>{t('kyc.street')}{requiredMark}</Label><Input value={address.street} onChange={(e) => dispatch(updateAddress({ street: e.target.value }))} aria-invalid={invalid(address.street)} className={cn(fieldClass, invalid(address.street) && invalidClass)} maxLength={120} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label className={labelClass}>{t('kyc.city')}{requiredMark}</Label><Input value={address.city} onChange={(e) => dispatch(updateAddress({ city: e.target.value }))} aria-invalid={invalid(address.city)} className={cn(fieldClass, invalid(address.city) && invalidClass)} maxLength={80} /></div>
              <div className="space-y-1.5"><Label className={labelClass}>{t('kyc.province')}{requiredMark}</Label><Input value={address.province} onChange={(e) => dispatch(updateAddress({ province: e.target.value }))} aria-invalid={invalid(address.province)} className={cn(fieldClass, invalid(address.province) && invalidClass)} maxLength={100} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label className={labelClass}>{t('kyc.postalCode')}{requiredMark}</Label><Input value={address.postalCode} onChange={(e) => dispatch(updateAddress({ postalCode: e.target.value }))} aria-invalid={invalid(address.postalCode)} className={cn(fieldClass, invalid(address.postalCode) && invalidClass)} maxLength={20} /></div>
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><BriefcaseBusiness className="h-5 w-5" /></span>
            <div><h2 className="font-display text-base font-bold text-slate-900">{t('kyc.financialProfileGroup')}</h2><p className="text-xs text-slate-500">{t('kyc.financialProfileHint')}</p></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label className={labelClass}>{t('kyc.purposeOfAccount')}{requiredMark}</Label><Select value={personal.purposeOfAccount || undefined} onValueChange={(value) => dispatch(updatePersonal({ purposeOfAccount: value }))}><SelectTrigger aria-invalid={showErrors && !personal.purposeOfAccount} className={cn(fieldClass, showErrors && !personal.purposeOfAccount && invalidClass)}><SelectValue placeholder={t('kyc.selectPlaceholder')} /></SelectTrigger><SelectContent className="border-slate-200 bg-white text-slate-800">{PURPOSE_OF_ACCOUNT_OPTIONS.map((value) => <SelectItem key={value} value={value}>{t(`kyc.purpose_${value}`)}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label className={labelClass}>{t('kyc.sourceOfFunds')}{requiredMark}</Label><Select value={personal.sourceOfFunds || undefined} onValueChange={(value) => dispatch(updatePersonal({ sourceOfFunds: value }))}><SelectTrigger aria-invalid={showErrors && !personal.sourceOfFunds} className={cn(fieldClass, showErrors && !personal.sourceOfFunds && invalidClass)}><SelectValue placeholder={t('kyc.selectPlaceholder')} /></SelectTrigger><SelectContent className="border-slate-200 bg-white text-slate-800">{SOURCE_OF_FUNDS_OPTIONS.map((value) => <SelectItem key={value} value={value}>{t(`kyc.source_${value}`)}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label className={labelClass}>{t('kyc.annualIncome')}{requiredMark}</Label><Input value={personal.annualIncome} onChange={(e) => dispatch(updatePersonal({ annualIncome: e.target.value }))} aria-invalid={invalid(personal.annualIncome)} className={cn(fieldClass, invalid(personal.annualIncome) && invalidClass)} maxLength={60} placeholder={t('kyc.annualIncomePlaceholder')} /></div>
            <div className="space-y-1.5"><Label className={labelClass}>{t('kyc.expectedMonthlyVolume')}{requiredMark}</Label><Input value={personal.expectedMonthlyVolume} onChange={(e) => dispatch(updatePersonal({ expectedMonthlyVolume: e.target.value.replace(/[^0-9]/g, '') }))} aria-invalid={invalid(personal.expectedMonthlyVolume)} className={cn(fieldClass, invalid(personal.expectedMonthlyVolume) && invalidClass)} inputMode="numeric" maxLength={60} placeholder={t('kyc.expectedMonthlyVolumePlaceholder')} /></div>
          </div>
        </section>

        <label className={cn('flex cursor-pointer items-start gap-3 rounded-xl border bg-emerald-50/60 p-3 text-xs text-slate-700', showErrors && !personal.consentAccepted ? 'border-destructive' : 'border-emerald-100')}>
          <input type="checkbox" checked={personal.consentAccepted} onChange={(e) => dispatch(updatePersonal({ consentAccepted: e.target.checked }))} className="mt-0.5 h-4 w-4 accent-emerald-700" />
          <span className="font-medium">{t('kyc.consent')}</span>
        </label>
      </div>

      <aside className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-slate-700">
          <span className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-700"><ShieldCheck className="h-5 w-5" /></span>
          <h3 className="text-xs font-bold text-slate-900">{t('kyc.whyWeNeedThis')}</h3>
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">{t('kyc.whyWeNeedThisBody')}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700">
          <span className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-white text-emerald-700 shadow-sm"><FileText className="h-5 w-5" /></span>
          <h3 className="text-xs font-bold text-slate-900">{t('kyc.acceptedDocuments')}</h3>
          <ul className="mt-2 space-y-2 text-[11px] leading-snug text-slate-600">
            {['kyc.acceptedUtilityBill', 'kyc.acceptedBankStatement', 'kyc.acceptedResidenceCertificate'].map((key) => <li key={key} className="flex items-start gap-1.5"><Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />{t(key)}</li>)}
          </ul>
          <p className="mt-3 border-t border-slate-200 pt-2 text-[10px] text-slate-500">{t('kyc.addressProofFormats')}</p>
        </div>
      </aside>
    </div>
  );
};

const DocumentsStep = ({
  onFrontCapture,
  onBackCapture,
  onAddressProofCapture,
  showErrors,
}: {
  onFrontCapture: (capture: CapturedFile) => void;
  onBackCapture: (capture: CapturedFile) => void;
  onAddressProofCapture: (capture: CapturedFile) => void;
  showErrors: boolean;
}) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const document = useAppSelector((s) => s.kyc.document);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)]">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><FileCheck2 className="h-5 w-5" /></span>
        <div><h2 className="font-display text-base font-bold text-slate-900">{t('kyc.documentsHeading')}</h2><p className="text-xs text-slate-500">{t('kyc.documentsHint')}</p></div>
      </div>
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)] sm:p-5">
        <div className="space-y-1.5">
        <Label className="text-[11px] font-semibold text-slate-700">{t('kyc.idType')}<span className="ml-1 text-rose-500">*</span></Label>
        <Select
          value={document.type || undefined}
          onValueChange={(v) => {
            dispatch(updateDocument({
              type: v as 'passport' | 'nationalId' | 'drivingLicense',
              frontName: '',
              backName: '',
              frontQualityScore: 0,
              backQualityScore: 0,
              frontMrzConfidence: 0,
              backMrzConfidence: 0,
            }));
            onFrontCapture({ name: '', file: null, qualityScore: 0, mrzConfidence: 0, signals: [] });
            onBackCapture({ name: '', file: null, qualityScore: 0, mrzConfidence: 0, signals: [] });
          }}
        >
          <SelectTrigger aria-invalid={showErrors && !document.type} className={cn('h-11 rounded-xl border-slate-200 bg-white text-sm text-slate-800 shadow-sm focus-visible:border-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-600/15', showErrors && !document.type && 'border-destructive')}><SelectValue placeholder={t('kyc.selectPlaceholder')} /></SelectTrigger>
          <SelectContent className="border-slate-200 bg-white text-slate-800">
            <SelectItem value="passport">{t('kyc.passport')}</SelectItem>
            <SelectItem value="nationalId">{t('kyc.nationalId')}</SelectItem>
            <SelectItem value="drivingLicense">{t('kyc.drivingLicense')}</SelectItem>
          </SelectContent>
        </Select>
        </div>
        <div className="space-y-1.5">
        <Label className="text-[11px] font-semibold text-slate-700">{t('kyc.idNumber')}<span className="ml-1 text-rose-500">*</span></Label>
        <Input
          value={document.idNumber}
          onChange={(e) => dispatch(updateDocument({ idNumber: e.target.value }))}
          aria-invalid={showErrors && !document.idNumber.trim()}
          className={cn('h-11 rounded-xl border-slate-200 bg-white text-sm text-slate-800 shadow-sm placeholder:text-slate-400 focus-visible:border-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-600/15', showErrors && !document.idNumber.trim() && 'border-destructive')}
          maxLength={40}
          placeholder={t('kyc.idNumberPlaceholder')}
        />
        </div>
      </section>
      <div className="grid gap-3 md:grid-cols-2">
        <DocumentCapture
          label={document.type === 'passport' ? t('kyc.uploadPassportPage') : t('kyc.uploadFront')}
          value={document.frontName}
          documentType={(document.type as DocumentKind) || 'unknown'}
          showErrors={showErrors && !document.frontName}
          onCapture={(capture) => {
            dispatch(updateDocument({
              frontName: capture.name,
              frontQualityScore: capture.qualityScore || 0,
              frontMrzConfidence: capture.mrzConfidence || 0,
            }));
            onFrontCapture(capture);
          }}
        />
        {document.type !== 'passport' && (
          <DocumentCapture
            label={t('kyc.uploadBack')}
            value={document.backName}
            documentType={(document.type as DocumentKind) || 'unknown'}
            showErrors={showErrors && !document.backName}
            onCapture={(capture) => {
              dispatch(updateDocument({
                backName: capture.name,
                backQualityScore: capture.qualityScore || 0,
                backMrzConfidence: capture.mrzConfidence || 0,
              }));
              onBackCapture(capture);
            }}
          />
        )}
      </div>
      <AddressProofUpload
        onCapture={onAddressProofCapture}
        showErrors={showErrors}
      />
    </div>
  );
};

const ADDRESS_PROOF_MAX_BYTES = 10 * 1024 * 1024;
const ADDRESS_PROOF_TYPES = new Map([
  ['pdf', 'application/pdf'],
  ['png', 'image/png'],
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
]);

const AddressProofUpload = ({
  onCapture,
  showErrors = false,
}: {
  onCapture: (capture: CapturedFile) => void;
  showErrors?: boolean;
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const chooseFile = (selected?: File) => {
    if (!selected) return;
    const extension = selected.name.split('.').pop()?.toLowerCase() || '';
    const expectedType = ADDRESS_PROOF_TYPES.get(extension);
    if (!expectedType || (selected.type && selected.type !== expectedType && selected.type !== 'application/octet-stream')) {
      toast.error(t('kyc.addressProofInvalidType'));
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    if (selected.size === 0 || selected.size > ADDRESS_PROOF_MAX_BYTES) {
      toast.error(t('kyc.addressProofInvalidSize'));
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setFile(selected);
    onCapture({ name: selected.name, file: selected });
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const removeFile = () => {
    setFile(null);
    onCapture({ name: '', file: null });
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <section className={cn('rounded-2xl border bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)] sm:p-5', showErrors && !file ? 'border-destructive' : 'border-slate-200')} aria-labelledby="address-proof-title">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <MapPin className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 id="address-proof-title" className="text-sm font-bold text-slate-900">
            {t('kyc.addressProofTitle')} <span className="text-rose-500">*</span>
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {t('kyc.addressProofDescription')}
          </p>
          <p className="mt-2 text-[10px] font-medium text-slate-500">{t('kyc.addressProofFormats')}</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        className="sr-only"
        onChange={(event) => chooseFile(event.currentTarget.files?.[0])}
        aria-label={t('kyc.addressProofTitle')}
      />

      {file ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {previewUrl && (
            <img src={previewUrl} alt="Aperçu du justificatif de domicile" className="max-h-52 w-full bg-slate-50 object-contain" />
          )}
          <div className="flex items-center gap-3 p-3 sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800" title={file.name}>{file.name}</p>
              <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} Mo · {t('kyc.addressProofReady')}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" aria-label="Retirer le justificatif" onClick={removeFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-slate-100 p-3">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="border-emerald-200 text-emerald-800 hover:bg-emerald-50">
              {t('kyc.addressProofReplace')}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={removeFile}>{t('kyc.addressProofRemove')}</Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="group mt-4 flex min-h-32 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-emerald-300 bg-gradient-to-b from-emerald-50/70 to-white px-4 py-5 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/25"
        >
          <UploadCloud className="mb-1 h-6 w-6 text-emerald-600 transition-transform group-hover:-translate-y-0.5" />
          <span className="text-xs font-bold text-slate-800">{t('kyc.addressProofChoose')}</span>
          <span className="text-[10px] text-slate-500">{t('kyc.addressProofDropHint')}</span>
          <span className="mt-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-medium text-slate-500">{t('kyc.addressProofFormats')}</span>
        </button>
      )}
    </section>
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
  showErrors = false,
}: {
  label: string;
  value: string;
  documentType: DocumentKind;
  onCapture: (capture: CapturedFile) => void;
  showErrors?: boolean;
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const chooseImage = async (file?: File) => {
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    const allowedType = new Map([['jpg', 'image/jpeg'], ['jpeg', 'image/jpeg'], ['png', 'image/png']]);
    const expectedMime = extension ? allowedType.get(extension) : undefined;
    if (!expectedMime || (file.type && file.type !== expectedMime)) {
      toast.error(t('kyc.documentUploadTypeError'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (!file.size || file.size > 10 * 1024 * 1024) {
      toast.error(t('kyc.documentUploadSizeError'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    try {
      const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      const isPng = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
      if ((expectedMime === 'image/jpeg' && !isJpeg) || (expectedMime === 'image/png' && !isPng)) {
        toast.error(t('kyc.documentUploadTypeError'));
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const bitmap = await createImageBitmap(file);
      try {
        const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('image_normalization_failed');
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const normalizedBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('image_normalization_failed')), 'image/jpeg', 0.94);
        });
        const normalizedFile = new File([normalizedBlob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        setPreview(URL.createObjectURL(normalizedFile));
        setUploaded(true);
        setAutoScore(0);
        onCapture({ name: normalizedFile.name, file: normalizedFile, qualityScore: 0, mrzConfidence: 0, signals: [] });
      } finally {
        bitmap.close();
      }
    } catch {
      toast.error(t('kyc.documentUploadReadError'));
    }
  };

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
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(v.videoWidth, v.videoHeight));
    const previewW = Math.round(v.videoWidth * scale);
    const previewH = Math.round(v.videoHeight * scale);
    if (previewW < 640 || previewH < 480) {
      toast.error('La résolution de la caméra est trop faible. Veuillez utiliser une meilleure caméra ou un autre appareil.');
      return;
    }
    c.width = previewW;
    c.height = previewH;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    drawVideoCover(ctx, v, previewW, previewH);

    c.toBlob((blob) => {
      if (!blob) return;
      const fileName = `${label.replace(/\s+/g, '-')}-${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      const dataUrl = URL.createObjectURL(file);
      setPreview(dataUrl);
      setUploaded(false);
      onCapture({
        name: fileName,
        file,
        qualityScore: autoScore,
        mrzConfidence: analysis.mrzConfidence,
        signals: [
          analysis.withinFrame ? 'frame_pass' : 'frame_retry',
          analysis.centered ? 'centered' : 'off_center',
          analysis.sharpness >= 20 ? 'sharp' : 'blurred',
          analysis.brightness >= 55 ? 'light_ok' : 'low_light',
        ],
      });
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
    setUploaded(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setHint('Placez votre document dans le cadre');
    setAutoScore(0);
    setIsReadyToCapture(false);
    setAnalysis(defaultAnalysis);
    setVideoAttached(false);
    onCapture({ name: '', file: null, qualityScore: 0, mrzConfidence: 0, signals: [] });
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
    <div className={cn('space-y-3 rounded-2xl border bg-emerald-50/35 p-3.5 sm:p-4', showErrors && !value ? 'border-destructive' : 'border-emerald-100')}>
      <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" className="sr-only" onChange={(event) => chooseImage(event.currentTarget.files?.[0])} aria-label={t('kyc.documentUploadTitle')} />
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Camera className="h-4 w-4" /></span>
          <div className="min-w-0"><p className="truncate text-xs font-bold text-slate-800">{label}<span className="ml-1 text-rose-500">*</span></p><p className="text-[10px] text-slate-500">{documentType === 'passport' ? t('kyc.passportCaptureHint') : t('kyc.idCaptureHint')}</p></div>
        </div>
        {value && <span className="shrink-0 text-[10px] font-semibold text-emerald-700">{t('kyc.documentUploadSelected')}</span>}
      </div>
      {preview ? (
        <div className="space-y-2">
          <img src={preview} alt={label} className="w-full rounded-xl aspect-[4/3] object-cover" />
          <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs text-slate-700">
              <span className="flex items-center gap-1.5 font-medium">
                <FileCheck2 className="h-3.5 w-3.5 text-success" />
                {uploaded ? t('kyc.documentUploadSelected') : t('kyc.captureUsable')}
              </span>
              {!uploaded && <span className="font-semibold text-primary">{autoScore}/100</span>}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={reset} className="flex-1">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reprendre
            </Button>
            {uploaded && <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="flex-1">{t('kyc.documentUploadReplace')}</Button>}
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
              disabled={!analysis.hasDocument || autoScore < DOCUMENT_MIN_SCORE}
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
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={start} className="h-10 rounded-xl border-emerald-200 bg-white text-xs text-slate-700 hover:bg-emerald-50">
            <Camera className="mr-2 h-5 w-5" /> {t('kyc.documentUploadUseCamera')}
          </Button>
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="h-10 rounded-xl border-emerald-200 bg-white text-xs text-slate-700 hover:bg-emerald-50">
            <UploadCloud className="mr-2 h-5 w-5" /> {t('kyc.documentUploadTitle')}
          </Button>
        </div>
      )}
    </div>
  );
};

const SelfieWithIdStep = ({
  onCapture,
}: {
  onCapture: (capture: CapturedFile) => void;
}) => {
  const dispatch = useAppDispatch();
  const selfie = useAppSelector((s) => s.kyc.selfie);
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div
        whileHover={{ y: -1 }}
        className={cn(
          'rounded-xl border-2 p-6 text-center transition-colors cursor-pointer',
          selfie.cameraCaptured ? 'border-success bg-success/5' : 'border-dashed border-border hover:border-primary/50',
        )}
        onClick={() => !selfie.cameraCaptured && setOpen(true)}
      >
        {selfie.cameraCaptured ? (
          <>
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-success/15 text-success flex items-center justify-center">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <p className="font-display font-semibold text-success">{t('kyc.cameraSelfieVerified')}</p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
              {t('kyc.viewDetails')}
            </Button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Camera className="h-7 w-7" />
            </div>
            <p className="font-display font-semibold">{t('kyc.cameraSelfieTitle')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('kyc.cameraSelfieDescription')}
            </p>
          </>
        )}
      </motion.div>

      <SelfieWithIdCapture
        open={open}
        onOpenChange={setOpen}
        onSuccess={(result) => {
          dispatch(updateSelfie({ selfieName: result.name, cameraCaptured: true, policyAccepted: true }));
          onCapture({ name: result.name, file: result.file });
          toast.success(t('kyc.cameraSelfieCapturedToast'));
        }}
      />
    </>
  );
};

const ReviewStep = ({ addressProofName }: { addressProofName: string }) => {
  const { t } = useTranslation();
  const kyc = useAppSelector((s) => s.kyc);
  const sections = [
    {
      title: t('kyc.personalDetailsGroup'),
      rows: [
        { k: t('kyc.dob'), v: kyc.personal.dob },
        { k: t('kyc.gender'), v: kyc.personal.gender ? t(`kyc.gender_${kyc.personal.gender}`) : '' },
        { k: t('kyc.nationality'), v: kyc.personal.nationality },
        { k: t('kyc.phone'), v: kyc.personal.phone },
        { k: t('kyc.idType'), v: kyc.document.type ? t(`kyc.${kyc.document.type}`) : '' },
        { k: t('kyc.idNumber'), v: kyc.document.idNumber },
        { k: t('kyc.documentFile'), v: [kyc.document.frontName, kyc.document.backName].filter(Boolean).join(' · ') },
      ],
    },
    {
      title: t('kyc.residenceGroup'),
      rows: [
        { k: t('kyc.street'), v: [kyc.address.street, kyc.address.city, kyc.address.province, kyc.address.postalCode, kyc.address.country].filter(Boolean).join(', ') },
        { k: t('kyc.addressProofTitle'), v: addressProofName },
      ],
    },
    {
      title: t('kyc.financialProfileGroup'),
      rows: [
        { k: t('kyc.employmentStatus'), v: kyc.personal.employmentStatus },
        { k: t('kyc.purposeOfAccount'), v: kyc.personal.purposeOfAccount ? t(`kyc.purpose_${kyc.personal.purposeOfAccount}`) : '' },
        { k: t('kyc.sourceOfFunds'), v: kyc.personal.sourceOfFunds ? t(`kyc.source_${kyc.personal.sourceOfFunds}`) : '' },
        { k: t('kyc.annualIncome'), v: kyc.personal.annualIncome },
        { k: t('kyc.expectedMonthlyVolume'), v: kyc.personal.expectedMonthlyVolume },
        { k: t('kyc.gateCameraSelfie'), v: kyc.selfie.cameraCaptured ? t('kyc.cameraSelfieVerified') : t('kyc.missing') },
      ],
    },
  ];
  return (
    <div className="space-y-5">
      <h3 className="font-display font-semibold text-lg">{t('kyc.reviewTitle')}</h3>
      {sections.map((section) => (
        <section key={section.title} className="rounded-2xl border border-border/70 bg-muted/15 p-4">
          <h4 className="mb-2 font-semibold">{section.title}</h4>
          {section.rows.map((row) => (
            <div key={row.k} className="flex justify-between gap-4 border-b border-border/70 py-2 text-sm last:border-0">
              <span className="text-muted-foreground">{row.k}</span>
              <span className="max-w-[60%] break-words text-right font-medium">{row.v || '—'}</span>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
};

const ManualReviewStep = ({ addressProofName }: { addressProofName: string }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <p className="font-semibold">{t('kyc.manualReviewOnly')}</p>
          {/* <p className="mt-1 text-sm text-muted-foreground">{t('kyc.manualReviewOnlyBody')}</p> */}
        </div>
      </div>
      <ReviewStep addressProofName={addressProofName} />
    </div>
  );
};

export default Kyc;
