import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ClipboardCheck, ShieldAlert } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { useGetKycDataQuery } from '@/store/api/kycApi';
import { getKycState } from '@/lib/kycStatus';

export const KycStatusBanner = () => {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const { data } = useGetKycDataQuery();
  const state = getKycState(data, user);

  if (state.verified) return null;

  const underReview = state.underReview;
  return (
    <div
      role="status"
      className="mx-auto flex w-full max-w-[1500px] items-center gap-3 px-3 pt-3 sm:px-4 lg:px-8"
    >
      <div className="flex w-full items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3 text-foreground shadow-sm">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
          {underReview ? <ClipboardCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {t(underReview ? 'dashboard.kycPendingTitle' : 'kyc.navigationBannerTitle')}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {t(underReview ? 'dashboard.kycPending' : 'kyc.navigationBannerBody')}
          </p>
        </div>
        <Link
          to="/app/kyc"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:px-4 sm:text-sm"
        >
          <span className="hidden sm:inline">{t(underReview ? 'dashboard.kycPendingTitle' : state.inProgress ? 'dashboard.kycContinue' : 'dashboard.verifyNow')}</span>
          <span className="sm:hidden">{t(underReview ? 'dashboard.kycPendingTitle' : 'dashboard.verifyNow')}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};
