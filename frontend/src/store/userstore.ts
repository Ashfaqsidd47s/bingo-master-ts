import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axiosInstance from '../lib/axiosInstance';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  profile_img: string;
}

interface UserStore {
  user: User | null;
  isVerifying: boolean;
  updateUser: (user: User | null) => void;
  verifyUser: () => Promise<void>;
  logout: () => void;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
  profile_img: string;
}

const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isVerifying: false,
      updateUser: (user) => set({ user }),
      logout: () => set({ user: null, isVerifying: false }),
      verifyUser: async () => {
        set({ isVerifying: true });
        try {
          const res = await axiosInstance.get<{user: UserResponse}>('/api/user/profile');
          if (res.data?.user?.id) {
            get().updateUser(res.data.user);
          } else {
            get().logout();
          }
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            get().logout();
          } else {
            console.error('Verification error:', error);
          }
        } finally {
          set({ isVerifying: false });
        }
      },
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
      version: 1,
    }
  )
);

export default useUserStore;