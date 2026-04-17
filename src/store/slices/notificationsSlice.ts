import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  kind: 'info' | 'success' | 'warning';
}

const seed: AppNotification[] = [
  { id: 'n1', title: 'Welcome to Lipaxe', body: 'Your account is ready. Verify your identity to unlock higher limits.', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(), kind: 'info' },
  { id: 'n2', title: 'Deposit received', body: 'USD 1,250.00 added to your wallet.', read: false, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), kind: 'success' },
  { id: 'n3', title: 'Security tip', body: 'Enable two-factor authentication for extra protection.', read: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), kind: 'warning' },
];

const slice = createSlice({
  name: 'notifications',
  initialState: { items: seed },
  reducers: {
    push(state, action: PayloadAction<AppNotification>) { state.items.unshift(action.payload); },
    markAllRead(state) { state.items.forEach(n => (n.read = true)); },
  },
});

export const { push, markAllRead } = slice.actions;
export default slice.reducer;
