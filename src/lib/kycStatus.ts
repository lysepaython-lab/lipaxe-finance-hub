import type { KycSubmissionResponse } from '@/store/api/kycApi';
import type { User } from '@/store/slices/authSlice';

export type NormalizedKycStatus = 'unverified' | 'pending' | 'verified';

export const normalizeKycStatusValue = (value?: string | null): NormalizedKycStatus => {
  const raw = String(value || '').toLowerCase();
  if (raw === 'verified' || raw === 'approved') return 'verified';
  if (raw === 'pending' || raw === 'complete') return 'pending';
  return 'unverified';
};

export const getKycState = (kycData?: KycSubmissionResponse, user?: User | null) => {
  const record = kycData?.data;
  const status = normalizeKycStatusValue(record?.kyc_status ?? kycData?.kyc_status ?? user?.kycStatus);
  const verified = Boolean(record?.kyc_verified ?? kycData?.kyc_verified) || status === 'verified';
  const complete = Boolean(record?.kyc_complete ?? kycData?.kyc_complete ?? user?.kycComplete ?? status !== 'unverified') || verified;

  return {
    status,
    complete,
    verified,
    locked: complete || verified,
    needsVerification: !complete && !verified,
    underReview: complete && !verified,
  };
};
