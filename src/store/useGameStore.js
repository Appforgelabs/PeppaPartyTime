// ============================================================
//  useGameStore.js — lightweight global game state (zustand)
// ============================================================
import { create } from 'zustand';

export const TOTAL_CANDLES = 5;
export const TOPPER_TYPES = ['star', 'heart', 'candy'];
export const PHONICS_WORDS = ['PIG', 'DUCK', 'BALL'];

let decorationId = 0;

export const useGameStore = create((set) => ({
  // --- Balloon Pop (counting) ---
  balloonCount: 0,
  popBalloon: () => set((s) => ({ balloonCount: s.balloonCount + 1 })),

  // --- Present Unboxing (phonics) ---
  activePhonicsWord: null,
  openPhonics: (word) => set({ activePhonicsWord: word }),
  closePhonics: () => set({ activePhonicsWord: null }),

  // --- Cake Decorating & Candle Blowing ---
  isCandleBlowingMode: false,
  candlesBlown: 0,
  toggleCandleMode: () =>
    set((s) => ({
      isCandleBlowingMode: !s.isCandleBlowingMode,
      candlesBlown: 0, // fresh candles every time the mode starts
    })),
  blowCandle: () =>
    set((s) => ({ candlesBlown: Math.min(s.candlesBlown + 1, TOTAL_CANDLES) })),

  // --- Cake toppers placed by the player ---
  cakeDecorations: [],
  addDecoration: (type) =>
    set((s) => ({
      cakeDecorations: [
        ...s.cakeDecorations,
        { id: ++decorationId, type, slot: s.cakeDecorations.length },
      ],
    })),

  // --- Celebration Mode ---
  celebrating: false,
  setCelebrating: (v) => set({ celebrating: v }),
}));
