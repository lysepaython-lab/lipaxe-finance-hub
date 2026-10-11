import { useRef } from 'react';
import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Calendar,
  FileCheck2,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useUpdateProfileImageMutation } from '@/store/api/authApi';
import { useGetKycDataQuery, type KycServerRecord } from '@/store/api/kycApi';
import { getKycState } from '@/lib/kycStatus';
import { updateUser } from '@/store/slices/authSlice';
import { toast } from 'sonner';

type ProfileRow = {
  Icon: ComponentType<{ className?: string }>;
  label: string;
  value?: unknown;
};

const asText = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>;
    return String(objectValue.name || objectValue.label || objectValue.code || objectValue.alpha_2 || '-');
  }
  return String(value);
};

const fromRecord = (record: KycServerRecord, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== '') return value;
  }
  return undefined;
};

const statusLabel = (verified?: boolean) => (verified ? 'Verified' : 'Non verified');

const Profile = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { data: kycData } = useGetKycDataQuery();
  const [updateProfileImage, { isLoading: uploading }] = useUpdateProfileImageMutation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!user) return null;

  const kycRecord = (kycData?.data || kycData || {}) as KycServerRecord;
  const kycState = getKycState(kycData, user);
  const kycVerified = kycState.verified;
  const kycComplete = kycState.complete;
  const kycStatus = kycState.status;
  const kycVariant: 'default' | 'secondary' | 'destructive' = kycVerified ? 'default' : kycComplete ? 'secondary' : 'destructive';
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  const personalRows: ProfileRow[] = [
    { Icon: Mail, label: t('auth.email'), value: user.email },
    { Icon: Phone, label: t('kyc.phone'), value: fromRecord(kycRecord, ['phone', 'phone_number']) },
    { Icon: Calendar, label: t('kyc.dob'), value: fromRecord(kycRecord, ['date_of_birth', 'dob']) },
    { Icon: MapPin, label: t('kyc.country'), value: fromRecord(kycRecord, ['country', 'country_name']) },
    { Icon: MapPin, label: t('kyc.address'), value: fromRecord(kycRecord, ['address', 'street']) },
    { Icon: MapPin, label: 'Ville / Province', value: [fromRecord(kycRecord, ['city']), fromRecord(kycRecord, ['province'])].filter(Boolean).join(' / ') },
  ];

  const kycRows: ProfileRow[] = [
    { Icon: UserCircle2, label: 'Genre', value: fromRecord(kycRecord, ['gender']) },
    { Icon: Briefcase, label: 'Emploi', value: fromRecord(kycRecord, ['employmentStatus', 'employment_status']) },
    { Icon: ShieldCheck, label: 'Usage du compte', value: fromRecord(kycRecord, ['purposeOfAccount', 'purpose_of_account']) },
    { Icon: ShieldCheck, label: 'Source des fonds', value: fromRecord(kycRecord, ['sourceOfFunds', 'source_of_funds']) },
    { Icon: FileCheck2, label: 'Type document', value: fromRecord(kycRecord, ['identity_type', 'document_type']) },
    { Icon: FileCheck2, label: 'Numero document', value: fromRecord(kycRecord, ['id_number', 'document_number']) },
  ];

  const onPickImage = async (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez selectionner une image valide.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image trop lourde (max 5MB).');
      return;
    }
    try {
      const updatedUser = await updateProfileImage(file).unwrap();
      dispatch(updateUser(updatedUser));
      toast.success('Photo de profil mise a jour.');
    } catch {
      toast.error('Echec de mise a jour de la photo.');
    }
  };

  const renderRows = (rows: ProfileRow[]) => rows.map((row) => (
    <div key={row.label} className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <row.Icon className="h-4 w-4" />
        {row.label}
      </div>
      <div className="text-right text-sm font-medium">{asText(row.value)}</div>
    </div>
  ));

  return (
    <div>
      <PageHeader title={t('nav.profile')} subtitle={t('profile.subtitle')} icon={<UserCircle2 className="h-6 w-6" />} />
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
          <Card className="bg-gradient-card">
            <CardContent className="space-y-4 p-6 text-center">
              {user.avatar ? (
                <img
                  src={`${import.meta.env.VITE_API_URL}${user.avatar}`}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="mx-auto h-24 w-24 rounded-full object-cover shadow-brand ring-2 ring-primary/20"
                />
              ) : (
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-brand font-display text-3xl font-bold text-primary-foreground shadow-brand">
                  {initials}
                </div>
              )}
              <div>
                <div className="font-display text-xl font-bold">{user.firstName} {user.lastName}</div>
                <div className="text-sm text-muted-foreground">@{user.username}</div>
              </div>
              <Badge variant={kycVariant} className="gap-1">
                <ShieldCheck className="h-3 w-3" /> {t(`profile.kyc.${kycStatus}`)}
              </Badge>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => void onPickImage(event.target.files?.[0])}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
                Mettre a jour la photo
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">{t('profile.personalInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">{renderRows(personalRows)}</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display">KYC</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {renderRows(kycRows)}
              <div className="grid gap-3 pt-4 sm:grid-cols-3">
                {[
                  ['Document', Boolean(fromRecord(kycRecord, ['photo_id_front', 'photo_id_back']))],
                  [t('profile.selfieWithId'), Boolean(fromRecord(kycRecord, ['selfie_with_id']))],
                  ['Decision KYC', kycVerified],
                ].map(([label, verified]) => (
                  <div key={String(label)} className="rounded-2xl border border-border/70 bg-muted/25 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                    <Badge variant={verified ? 'default' : 'secondary'} className="mt-3">
                      {statusLabel(Boolean(verified))}
                    </Badge>
                  </div>
                ))}
              </div>
              {!kycVerified && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
                  <div className="text-sm">{t('profile.kycPrompt')}</div>
                  <Link to="/app/kyc"><Button size="sm" className="bg-gradient-brand shadow-brand">{t('dashboard.verifyNow')}</Button></Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
