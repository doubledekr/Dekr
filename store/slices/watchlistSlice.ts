import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MarketCard {
  id: string;
  type: 'stock' | 'crypto';
  symbol: string;
  name: string;
  price: number;
  changePercentage: number;
  previousClose?: number;
  open24h?: number;
  high24h?: number;
  low24h?: number;
  volume?: number;
  marketCap?: number;
  exchange?: string;
  sector?: string;
  dayRange?: string;
  priceHistory?: {
    prices: number[];
    labels: string[];
  };
  sentiment?: 'positive' | 'negative' | 'neutral';
  timestamp: number;
  grade?: 'A' | 'B' | 'C' | 'D' | 'F';
  volatility?: 'Low' | 'Medium' | 'High';
  currentSignal?: 'Buy' | 'Sell' | 'Hold';
  peRatio?: number;
}

interface WatchlistState {
  items: MarketCard[];
  isLoading: boolean;
  error: string | null;
}

const initialState: WatchlistState = {
  items: [],
  isLoading: false,
  error: null,
};

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    addToWatchlist: (state, action: PayloadAction<MarketCard>) => {
      if (!state.items.find(item => item.id === action.payload.id)) {
        state.items.push(action.payload);
      }
    },
    removeFromWatchlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    setWatchlistItems: (state, action: PayloadAction<MarketCard[]>) => {
      state.items = action.payload;
    },
    setWatchlistLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setWatchlistError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearWatchlist: (state) => {
      state.items = [];
      state.error = null;
    },
  },
});

export const {
  addToWatchlist,
  removeFromWatchlist,
  setWatchlistItems,
  setWatchlistLoading,
  setWatchlistError,
  clearWatchlist,
} = watchlistSlice.actions;

export default watchlistSlice.reducer; 