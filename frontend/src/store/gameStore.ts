import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserData } from '../Types';
import { Tile } from 'bingo-master/dist/types';

interface Game {
  boardInfo:  Tile[][];
  cancelInfo: Array<number>;
  cancelCount: number; 
  turn: boolean;
}

interface GameStore {
  oponent: UserData | null;
  game: Game | null;
  updateGame : (game: Game | null) => void; 
  updateOponent : (oponent: UserData | null) => void; 
}

const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      oponent: null,
      game: null,
      updateGame: (game) => set({ game }),
      updateOponent: (oponent) => set({ oponent })
    }),
    {
      name: 'game-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        game: state.game,
        oponent: state.oponent,
       }),
      version: 1,
    }
  )
);

export default useGameStore;    