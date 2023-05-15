import { createSlice } from '@reduxjs/toolkit';

// Define action type constants
const STORE_HISTORY = 'searchHistory/storeHistory';
const CLEAR_HISTORY = 'searchHistory/clearHistory';

const initialState = {
  history: [],
};

export const searchHistorySlice = createSlice({
  name: 'searchHistory',
  initialState,
  reducers: {
    storeHistory: (state, action) => {
      state.history.push({ description: action.payload });
    },
    clearHistory: (state) => {
      state.history = [];
    },
  },
});

export const { storeHistory, clearHistory } = searchHistorySlice.actions;

// Export action type constants
export const SEARCH_HISTORY_TYPES = {
  STORE_HISTORY,
  CLEAR_HISTORY,
};

export default searchHistorySlice.reducer;
