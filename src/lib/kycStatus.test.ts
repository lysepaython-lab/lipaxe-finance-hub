import { describe, expect, it } from 'vitest';
import { getKycState } from './kycStatus';

describe('getKycState', () => {
  it('does not mistake a new account with a legacy pending label for a submission', () => {
    expect(getKycState({ kyc_status: 'pending', kyc_complete: false })).toMatchObject({
      status: 'unverified',
      complete: false,
      verified: false,
      locked: false,
      needsVerification: true,
      underReview: false,
    });
  });

  it('labels a saved but unsubmitted draft as in progress', () => {
    expect(getKycState({ kyc_status: 'created', kyc_complete: false })).toMatchObject({
      status: 'in_progress',
      complete: false,
      locked: false,
      needsVerification: true,
      inProgress: true,
    });
  });

  it('locks a dossier only after it is explicitly complete and pending review', () => {
    expect(getKycState({ kyc_status: 'pending', kyc_complete: true })).toMatchObject({
      status: 'pending',
      complete: true,
      verified: false,
      locked: true,
      underReview: true,
    });
  });

  it('recognizes verified dossiers as final', () => {
    expect(getKycState({ kyc_status: 'verified', kyc_complete: true, kyc_verified: true })).toMatchObject({
      status: 'verified',
      complete: true,
      verified: true,
      locked: true,
      underReview: false,
    });
  });
});
