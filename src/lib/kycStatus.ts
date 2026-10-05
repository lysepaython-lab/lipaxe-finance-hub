import type { KycSubmissionResponse } from '@/store/api/kycApi';
import type { User } from '@/store/slices/authSlice';

export type NormalizedKycStatus = 'unverified' | 'pending' | 'verified';

export const normalizeKycStatusValue = (value?: string | null): NormalizedKycStatus => {
  const raw = String(value || '').toLowerCase();
  if (raw === 'verified' || raw === 'approved') return 'verified';
  if (['pending', 'complete', 'completed', 'submitted', 'under_review', 'in_review', 'review'].includes(raw)) {
    return 'pending';
  }
  return 'unverified';
};

export const getKycState = (kycData?: KycSubmissionResponse, user?: User | null) => {
  const record = kycData?.data;
  const statusCandidates = [record?.kyc_status, kycData?.kyc_status, user?.kycStatus]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .map((value) => value.toLowerCase());
  const rawStatus = statusCandidates.find((value) =>
    ['rejected', 'failed', 'action_required', 'documents_required'].includes(value),
  ) ?? statusCandidates.find((value) => normalizeKycStatusValue(value) !== 'unverified') ?? statusCandidates[0] ?? '';
  const requiresResubmission = ['rejected', 'failed', 'action_required', 'documents_required'].includes(rawStatus);
  const status = normalizeKycStatusValue(rawStatus);
  const verified = !requiresResubmission && (
    Boolean(record?.kyc_verified ?? kycData?.kyc_verified) || status === 'verified'
  );
  const complete = !requiresResubmission && (
    Boolean(record?.kyc_complete ?? kycData?.kyc_complete ?? user?.kycComplete) ||
    status === 'pending' ||
    verified
  );

  return {
    status,
    complete,
    verified,
    locked: complete || verified,
    needsVerification: !complete && !verified,
    underReview: complete && !verified,
    requiresResubmission,
  };
};
