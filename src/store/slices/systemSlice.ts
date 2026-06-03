import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type MaintenanceState = {
  active: boolean;
  message?: string;
  retryAfter?: number;
  version?: string;
};

type SystemState = {
  maintenance: MaintenanceState;
  backendVersion?: string;
};

const initialState: SystemState = {
  maintenance: { active: false },
};

const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    setMaintenance(state, action: PayloadAction<Omit<MaintenanceState, 'active'> & { active?: boolean }>) {
      state.maintenance = { active: action.payload.active ?? true, ...action.payload };
    },
    clearMaintenance(state) {
      state.maintenance = { active: false, version: state.maintenance.version };
    },
    setBackendVersion(state, action: PayloadAction<string | undefined>) {
      state.backendVersion = action.payload;
      if (action.payload) state.maintenance.version = action.payload;
    },
  },
});

export const { setMaintenance, clearMaintenance, setBackendVersion } = systemSlice.actions;
export default systemSlice.reducer;
