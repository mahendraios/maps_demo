import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import searchHistoryReducer from './slices/searchHistorySlice';

const rootReducer = combineReducers({
  searchHistory: searchHistoryReducer,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: [], // Pass an empty array since there are no default middlewares to configure
});

export const persistor = persistStore(store);
