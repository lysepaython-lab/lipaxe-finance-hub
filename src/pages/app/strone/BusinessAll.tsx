import { Briefcase, FileText, Receipt, BarChart3, Link2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ComingSoonPage } from '@/components/ComingSoonPage';

const BusinessAll = () => {
  const { t } = useTranslation();
  return (
    <ComingSoonPage
      title={t('nav.businessAll')}
      subtitle={t('strone.businessSubtitle')}
      icon={<Briefcase className="h-6 w-6" />}
      features={[
        t('strone.bizFeat1'),
        t('strone.bizFeat2'),
        t('strone.bizFeat3'),
        t('strone.bizFeat4'),
        t('strone.bizFeat5'),
        t('strone.bizFeat6'),
      ]}
    />
  );
};

export default BusinessAll;
