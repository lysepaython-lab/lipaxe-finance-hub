import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setStep, updatePersonal, updateAddress, updateDocument, updateSelfie, resetKyc } from '@/store/slices/kycSlice';
import { useSubmitPersonalMutation, useSubmitAddressMutation, useSubmitDocumentsMutation } from '@/store/api/kycApi';
import { updateUser } from '@/store/slices/authSlice';
import { Check, Upload, ChevronRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Kyc = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const kyc = useAppSelector(s => s.kyc);
  const [submit, { isLoading }] = useSubmitKycMutation();

  const steps = [t('kyc.step1'), t('kyc.step2'), t('kyc.step3'), t('kyc.step4'), t('kyc.step5')];

  const next = () => dispatch(setStep(Math.min(kyc.step + 1, steps.length - 1)));
  const back = () => dispatch(setStep(Math.max(kyc.step - 1, 0)));

  const onSubmit = async () => {
    try {
      const res = await submit(kyc).unwrap();
      dispatch(updateUser({ kycStatus: 'pending' }));
      dispatch(resetKyc());
      toast.success(t('kyc.submitted'));
      navigate('/app');
    } catch { toast.error(t('common.error')); }
  };

  const FileBox = ({ label, value, onPick }: { label: string; value: string; onPick: (n: string) => void }) => (
    <label className="block cursor-pointer rounded-xl border-2 border-dashed border-border p-6 text-center transition-smooth hover:border-primary hover:bg-brand-50/50 dark:hover:bg-brand-900/10">
      <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && onPick(e.target.files[0].name)} />
      {value ? (
        <div className="flex items-center justify-center gap-2 text-success font-medium">
          <Check className="h-5 w-5" /> {value}
        </div>
      ) : (
        <>
          <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
        </>
      )}
    </label>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2"><ShieldCheck className="h-7 w-7 text-primary" /> {t('kyc.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('kyc.subtitle')}</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={cn('flex items-center gap-2 transition-smooth',
              i <= kyc.step ? 'text-primary' : 'text-muted-foreground')}>
              <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2',
                i < kyc.step ? 'bg-primary text-primary-foreground border-primary' :
                i === kyc.step ? 'border-primary text-primary bg-brand-50 dark:bg-brand-900/30' :
                'border-border')}>
                {i < kyc.step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="hidden md:block text-xs font-medium">{s}</span>
            </div>
            {i < steps.length - 1 && <div className={cn('h-0.5 flex-1 mx-2', i < kyc.step ? 'bg-primary' : 'bg-border')} />}
          </div>
        ))}
      </div>

      <Card className="shadow-elegant border-border/60">
        <CardContent className="p-6 space-y-5">
          {kyc.step === 0 && (
            <>
              <div className="space-y-2"><Label>{t('kyc.dob')}</Label><Input type="date" value={kyc.personal.dob} onChange={e => dispatch(updatePersonal({ dob: e.target.value }))} /></div>
              <div className="space-y-2"><Label>{t('kyc.nationality')}</Label><Input value={kyc.personal.nationality} onChange={e => dispatch(updatePersonal({ nationality: e.target.value }))} placeholder="French" /></div>
              <div className="space-y-2"><Label>{t('kyc.phone')}</Label><Input value={kyc.personal.phone} onChange={e => dispatch(updatePersonal({ phone: e.target.value }))} placeholder="+33 6 12 34 56 78" /></div>
            </>
          )}
          {kyc.step === 1 && (
            <>
              <div className="space-y-2"><Label>{t('kyc.street')}</Label><Input value={kyc.address.street} onChange={e => dispatch(updateAddress({ street: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>{t('kyc.city')}</Label><Input value={kyc.address.city} onChange={e => dispatch(updateAddress({ city: e.target.value }))} /></div>
                <div className="space-y-2"><Label>{t('kyc.postalCode')}</Label><Input value={kyc.address.postalCode} onChange={e => dispatch(updateAddress({ postalCode: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>{t('kyc.country')}</Label><Input value={kyc.address.country} onChange={e => dispatch(updateAddress({ country: e.target.value }))} /></div>
            </>
          )}
          {kyc.step === 2 && (
            <>
              <div className="space-y-2">
                <Label>{t('kyc.idType')}</Label>
                <Select value={kyc.document.type || undefined} onValueChange={(v: any) => dispatch(updateDocument({ type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">{t('kyc.passport')}</SelectItem>
                    <SelectItem value="nationalId">{t('kyc.nationalId')}</SelectItem>
                    <SelectItem value="drivingLicense">{t('kyc.drivingLicense')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <FileBox label={t('kyc.uploadFront')} value={kyc.document.frontName} onPick={(n) => dispatch(updateDocument({ frontName: n }))} />
                {kyc.document.type !== 'passport' && (
                  <FileBox label={t('kyc.uploadBack')} value={kyc.document.backName} onPick={(n) => dispatch(updateDocument({ backName: n }))} />
                )}
              </div>
            </>
          )}
          {kyc.step === 3 && (
            <>
              <p className="text-sm text-muted-foreground">{t('kyc.selfieInstructions')}</p>
              <FileBox label={t('kyc.uploadSelfie')} value={kyc.selfie.selfieName} onPick={(n) => dispatch(updateSelfie({ selfieName: n }))} />
            </>
          )}
          {kyc.step === 4 && (
            <div className="space-y-3">
              <h3 className="font-display font-semibold text-lg">{t('kyc.reviewTitle')}</h3>
              {[
                { k: t('kyc.dob'), v: kyc.personal.dob },
                { k: t('kyc.nationality'), v: kyc.personal.nationality },
                { k: t('kyc.phone'), v: kyc.personal.phone },
                { k: t('kyc.street'), v: `${kyc.address.street}, ${kyc.address.city} ${kyc.address.postalCode}, ${kyc.address.country}` },
                { k: t('kyc.idType'), v: kyc.document.type },
                { k: 'Selfie', v: kyc.selfie.selfieName },
              ].map(r => (
                <div key={r.k} className="flex justify-between text-sm border-b border-border py-2">
                  <span className="text-muted-foreground">{r.k}</span>
                  <span className="font-medium text-right">{r.v || '—'}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={back} disabled={kyc.step === 0}><ChevronLeft className="h-4 w-4 mr-1" />{t('kyc.back')}</Button>
            {kyc.step < steps.length - 1 ? (
              <Button onClick={next} className="bg-gradient-brand shadow-brand">{t('kyc.next')}<ChevronRight className="h-4 w-4 ml-1" /></Button>
            ) : (
              <Button onClick={onSubmit} disabled={isLoading} className="bg-gradient-brand shadow-brand">{t('kyc.submit')}</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Kyc;
