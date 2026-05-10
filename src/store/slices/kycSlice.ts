import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface KYCData {
  step: number;
  personal: { dob: string; nationality: string; phone: string; phoneVerified: boolean; consentAccepted: boolean };
  address: { street: string; city: string; postalCode: string; country: string };
  document: {
    type: 'passport' | 'nationalId' | 'drivingLicense' | '';
    idNumber: string;
    frontName: string;
    backName: string;
    frontQualityScore: number;
    backQualityScore: number;
    frontMrzConfidence: number;
    backMrzConfidence: number;
  };
  selfie: { selfieName: string; livenessOk: boolean; livenessSignals: string[] };
}

const initial: KYCData = {
  step: 0,
  personal: { dob: '', nationality: '', phone: '', phoneVerified: false, consentAccepted: false },
  address: { street: '', city: '', postalCode: '', country: '' },
  document: {
    type: '',
    idNumber: '',
    frontName: '',
    backName: '',
    frontQualityScore: 0,
    backQualityScore: 0,
    frontMrzConfidence: 0,
    backMrzConfidence: 0,
  },
  selfie: { selfieName: '', livenessOk: false, livenessSignals: [] },
};

const load = (): KYCData => {
  try {
    const raw = localStorage.getItem('lipaxe-kyc');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure new fields exist on stored state
      return {
        ...initial,
        ...parsed,
        personal: { ...initial.personal, ...(parsed.personal || {}) },
        document: { ...initial.document, ...(parsed.document || {}) },
        selfie: { ...initial.selfie, ...(parsed.selfie || {}) },
      };
    }
  } catch {
    /* ignore parse errors */
  }
  return initial;
};

const persist = (state: KYCData) => localStorage.setItem('lipaxe-kyc', JSON.stringify(state));

const slice = createSlice({
  name: 'kyc',
  initialState: load(),
  reducers: {
    setStep(state, action: PayloadAction<number>) { state.step = action.payload; persist(state); },
    updatePersonal(state, action: PayloadAction<Partial<KYCData['personal']>>) {
      state.personal = { ...state.personal, ...action.payload }; persist(state);
    },
    updateAddress(state, action: PayloadAction<Partial<KYCData['address']>>) {
      state.address = { ...state.address, ...action.payload }; persist(state);
    },
    updateDocument(state, action: PayloadAction<Partial<KYCData['document']>>) {
      state.document = { ...state.document, ...action.payload }; persist(state);
    },
    updateSelfie(state, action: PayloadAction<Partial<KYCData['selfie']>>) {
      state.selfie = { ...state.selfie, ...action.payload }; persist(state);
    },
    resetKyc() { localStorage.removeItem('lipaxe-kyc'); return initial; },
  },
});

export const { setStep, updatePersonal, updateAddress, updateDocument, updateSelfie, resetKyc } = slice.actions;
export default slice.reducer;
