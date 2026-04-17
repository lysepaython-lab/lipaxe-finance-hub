import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  kycStatus: 'unverified' | 'pending' | 'verified';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const loadInitial = (): AuthState => {
  try {
    const raw = localStorage.getItem('lipaxe-auth');
    if (raw) return JSON.parse(raw);
  } catch {}
  return { user: null, accessToken: null, refreshToken: null };
};

const slice = createSlice({
  name: 'auth',
  initialState: loadInitial(),
  reducers: {
    setCredentials(state, action: PayloadAction<AuthState>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('lipaxe-auth', JSON.stringify(state));
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('lipaxe-auth', JSON.stringify(state));
      }
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem('lipaxe-auth');
    },
  },
});

export const { setCredentials, updateUser, logout } = slice.actions;
export default slice.reducer;
