import { useRef } from 'react';
import { motion } from 'framer-motion';
import { UserCircle2, Mail, ShieldCheck, Pencil, Phone, MapPin, Calendar, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useUpdateProfileImageMutation } from '@/store/api/authApi';
import { updateUser } from '@/store/slices/authSlice';
import { toast } from 'sonner';

const Profile = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  console.log("User in Profile:", user); // Debug log to check user data
  const [updateProfileImage, { isLoading: uploading }] = useUpdateProfileImageMutation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  if (!user) return null;
  const initials = `${user.firstName[0]}${user.lastName[0]}`;
  const kycVariant: any = user.kycStatus === 'verified' ? 'default' : user.kycStatus === 'pending' ? 'secondary' : 'destructive';

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

  return (
    <div>
      <PageHeader title={t('nav.profile')} subtitle={t('profile.subtitle')} icon={<UserCircle2 className="h-6 w-6" />} />
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
          <Card className="bg-gradient-card">
            <CardContent className="p-6 text-center space-y-4">
              {user.avatar ? (
                <img
                  src={`${import.meta.env.VITE_API_URL}${user.avatar}`}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="mx-auto h-24 w-24 rounded-full object-cover shadow-brand ring-2 ring-primary/20"
                />
              ) : (
                <div className="mx-auto h-24 w-24 rounded-full bg-gradient-brand text-primary-foreground flex items-center justify-center text-3xl font-display font-bold shadow-brand">{initials}</div>
              )}
              <div>
                <div className="font-display text-xl font-bold">{user.firstName} {user.lastName}</div>
                <div className="text-sm text-muted-foreground">@{user.username}</div>
              </div>
              <Badge variant={kycVariant} className="gap-1"><ShieldCheck className="h-3 w-3" /> {t(`profile.kyc.${user.kycStatus}`)}</Badge>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onPickImage(e.target.files?.[0])}
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

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <Card>
            <CardContent className="p-6 space-y-1">
              <h3 className="font-display font-semibold mb-4">{t('profile.personalInfo')}</h3>
              {[
                { Icon: Mail, label: t('auth.email'), value: user.email },
                { Icon: Phone, label: t('kyc.phone'), value: '+1 555 0192' },
                { Icon: MapPin, label: t('kyc.country'), value: 'United States' },
                { Icon: Calendar, label: t('kyc.dob'), value: '—' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground"><row.Icon className="h-4 w-4" />{row.label}</div>
                  <div className="font-medium">{row.value}</div>
                </div>
              ))}
              {user.kycStatus !== 'verified' && (
                <div className="mt-4 rounded-xl bg-warning/10 border border-warning/30 p-4 flex items-center justify-between">
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
