import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface KYCData {
  step: number;
  personal: { dob: string; nationality: string; phone: string };
  address: { street: string; city: string; postalCode: string; country: string };
  document: { type: 'passport' | 'nationalId' | 'drivingLicense' | ''; frontName: string; backName: string };
  selfie: { selfieName: string };
}

const initial: KYCData = {
  step: 0,
  personal: { dob: '', nationality: '', phone: '' },
  address: { street: '', city: '', postalCode: '', country: '' },
  document: { type: '', frontName: '', backName: '' },
  selfie: { selfieName: '' },
};

const load = (): KYCData => {
  try {
    const raw = localStorage.getItem('lipaxe-kyc');
    if (raw) return JSON.parse(raw);
  } catch {}
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
