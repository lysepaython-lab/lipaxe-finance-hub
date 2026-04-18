import { motion } from 'framer-motion';
import { UserCircle2, Mail, ShieldCheck, Pencil, Phone, MapPin, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/store/hooks';

const Profile = () => {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return null;
  const initials = `${user.firstName[0]}${user.lastName[0]}`;
  const kycVariant: any = user.kycStatus === 'verified' ? 'default' : user.kycStatus === 'pending' ? 'secondary' : 'destructive';

  return (
    <div>
      <PageHeader title={t('nav.profile')} subtitle={t('profile.subtitle')} icon={<UserCircle2 className="h-6 w-6" />} />
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
          <Card className="bg-gradient-card">
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto h-24 w-24 rounded-full bg-gradient-brand text-primary-foreground flex items-center justify-center text-3xl font-display font-bold shadow-brand">{initials}</div>
              <div>
                <div className="font-display text-xl font-bold">{user.firstName} {user.lastName}</div>
                <div className="text-sm text-muted-foreground">@{user.username}</div>
              </div>
              <Badge variant={kycVariant} className="gap-1"><ShieldCheck className="h-3 w-3" /> {t(`profile.kyc.${user.kycStatus}`)}</Badge>
              <Button variant="outline" className="w-full"><Pencil className="mr-2 h-4 w-4" />{t('profile.edit')}</Button>
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
