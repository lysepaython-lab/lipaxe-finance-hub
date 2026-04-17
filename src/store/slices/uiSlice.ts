import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  language: 'en' | 'fr';
}

const slice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    language: (localStorage.getItem('lipaxe-lang') as 'en' | 'fr') || 'en',
  } as UIState,
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
    setSidebar(state, action: PayloadAction<boolean>) { state.sidebarOpen = action.payload; },
    setLanguage(state, action: PayloadAction<'en' | 'fr'>) {
      state.language = action.payload;
      localStorage.setItem('lipaxe-lang', action.payload);
    },
  },
});

export const { toggleSidebar, setSidebar, setLanguage } = slice.actions;
export default slice.reducer;
