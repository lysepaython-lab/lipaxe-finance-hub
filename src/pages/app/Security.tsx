import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { TwoFactorSetup } from '@/components/security/TwoFactorSetup';
import { TrustedDevicesCard } from '@/components/security/TrustedDevicesCard';
import { PushNotificationsCard } from '@/components/security/PushNotificationsCard';

const Security = () => {
  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Sécurité"
        subtitle="Verrouillez votre compte avec la 2FA, gérez vos appareils de confiance et activez les notifications push."
        icon={<ShieldCheck className="h-6 w-6" />}
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <TwoFactorSetup />
        <TrustedDevicesCard />
        <PushNotificationsCard />
      </motion.div>
    </div>
  );
};

export default Security;
